/**
 * Deep Search - 再検索・ページ内リンク探索機能
 *
 * 初回検索で具体的な値が取得できなかった場合に：
 * 1. ページ内の関連リンクを抽出して詳細ページを辿る
 * 2. より具体的なキーワードで再検索する
 */

import { generateJSON } from './gemini';
import { searchMunicipalitySite, isOfficialDomain } from './google-search';
import { fetchPage, isUsefulUrl } from './page-fetcher';
import { ExtractedVariable, SearchResult } from './types';
import { extractVariables } from './prompts/extractor';
import { getVariableDefinition } from './variable-priority';
import { validateVariable } from './validators';

/**
 * ページ内リンクの評価結果
 */
interface LinkEvaluation {
  url: string;
  title: string;
  relevanceScore: number;
  reason: string;
}

/**
 * 再検索のための推奨クエリ
 */
interface SuggestedQuery {
  query: string;
  targetVariables: string[];
  reason: string;
}

/**
 * 深堀り検索の結果
 */
export interface DeepSearchResult {
  variables: ExtractedVariable[];
  visitedUrls: string[];
  suggestedQueries: SuggestedQuery[];
  totalApiCalls: number;
}

/**
 * HTMLからリンクを抽出
 */
function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();

    // 相対URLを絶対URLに変換
    if (href.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        href = `${base.protocol}//${base.host}${href}`;
      } catch {
        continue;
      }
    } else if (!href.startsWith('http')) {
      continue; // javascript:, mailto:, # などをスキップ
    }

    if (text && href) {
      links.push({ href, text });
    }
  }

  return links;
}

/**
 * ページ内のリンクを評価し、関連性の高いものを返す
 */
export async function evaluatePageLinks(
  pageHtml: string,
  pageUrl: string,
  targetVariables: { name: string; description: string }[],
  maxLinks: number = 5
): Promise<LinkEvaluation[]> {
  const links = extractLinks(pageHtml, pageUrl);

  // 公式ドメインのリンクのみ
  const officialLinks = links.filter(l => isOfficialDomain(l.href) && isUsefulUrl(l.href));

  if (officialLinks.length === 0) {
    return [];
  }

  // リンクが多すぎる場合は最初の20件に絞る
  const linksToEvaluate = officialLinks.slice(0, 20);

  const variableList = targetVariables
    .map(v => `- ${v.name}: ${v.description}`)
    .join('\n');

  const linkList = linksToEvaluate
    .map((l, i) => `[${i + 1}] ${l.text} -> ${l.href}`)
    .join('\n');

  const prompt = `以下のリンクの中から、指定された情報を取得するのに有用なリンクを評価してください。

【取得したい情報】
${variableList}

【ページ内のリンク】
${linkList}

【出力形式】
JSON形式で、有用なリンクを関連性スコア順（高い順）で出力してください。
関連性スコアは0-100で評価してください。

{
  "evaluatedLinks": [
    {
      "index": リンク番号,
      "relevanceScore": 関連性スコア(0-100),
      "reason": "このリンクが有用な理由"
    }
  ]
}

注意:
- 「詳細はこちら」「○○について」などのリンクは有用な可能性が高い
- ファイルダウンロード（申請書等）は情報取得には不向き
- 関連性スコア50以上のリンクのみ含めてください`;

  interface LinkEvaluationResponse {
    evaluatedLinks: {
      index: number;
      relevanceScore: number;
      reason: string;
    }[];
  }

  try {
    const response = await generateJSON<LinkEvaluationResponse>(prompt);

    return response.evaluatedLinks
      .filter(e => e.relevanceScore >= 50)
      .slice(0, maxLinks)
      .map(e => {
        const link = linksToEvaluate[e.index - 1];
        return {
          url: link?.href || '',
          title: link?.text || '',
          relevanceScore: e.relevanceScore,
          reason: e.reason,
        };
      })
      .filter(e => e.url);
  } catch {
    return [];
  }
}

/**
 * 曖昧な結果に対して再検索クエリを生成
 */
export async function generateRefinedQueries(
  municipalityName: string,
  originalQuery: string,
  failedVariables: { name: string; description: string; failedValue?: string }[],
  context?: string
): Promise<SuggestedQuery[]> {
  const variableList = failedVariables
    .map(v => {
      let line = `- ${v.name}: ${v.description}`;
      if (v.failedValue) {
        line += ` (取得された値: "${v.failedValue}" - 具体的でない)`;
      }
      return line;
    })
    .join('\n');

  const prompt = `以下の情報取得に失敗しました。より具体的な検索クエリを提案してください。

【自治体名】
${municipalityName}

【元の検索クエリ】
${originalQuery}

【取得できなかった情報】
${variableList}

${context ? `【追加コンテキスト】\n${context}\n` : ''}

【出力形式】
JSON形式で、効果的な検索クエリを提案してください。

{
  "suggestedQueries": [
    {
      "query": "提案する検索クエリ",
      "targetVariables": ["このクエリで取得を狙う変数名"],
      "reason": "このクエリが有効な理由"
    }
  ]
}

注意:
- 「手数料」「料金表」「金額」など具体的なキーワードを含める
- 「申請書」「様式」よりも「案内」「一覧」「料金」を優先
- 自治体名は必ず含める
- 最大3つまでの提案にしてください`;

  interface QuerySuggestionResponse {
    suggestedQueries: SuggestedQuery[];
  }

  try {
    const response = await generateJSON<QuerySuggestionResponse>(prompt);
    return response.suggestedQueries || [];
  } catch {
    return [];
  }
}

/**
 * 値が具体的かどうかを判定
 */
export function isConcreteValue(variableName: string, value: string | null): boolean {
  if (!value) return false;

  // 曖昧な表現のパターン
  const vaguePatterns = [
    /^詳細は/,
    /^お問い合わせ/,
    /による$/,
    /^要確認/,
    /^未定/,
    /^－$/,
    /^-$/,
    /をご覧/,
    /参照$/,
    /をご確認/,
    /^各種/,
    /によって異なる/,
  ];

  if (vaguePatterns.some(pattern => pattern.test(value))) {
    return false;
  }

  // 手数料の場合は金額が含まれているかチェック
  if (variableName.includes('fee') || variableName.includes('料')) {
    const hasFee = /\d+円/.test(value) || /無料/.test(value);
    return hasFee;
  }

  // 電話番号の場合はフォーマットチェック
  if (variableName.includes('phone') || variableName.includes('電話')) {
    const hasPhone = /\d{2,5}-\d{2,4}-\d{4}/.test(value);
    return hasPhone;
  }

  return value.length > 2; // 最低限の長さ
}

/**
 * 深堀り検索を実行
 *
 * 1. 最初のページで変数抽出を試みる
 * 2. 具体的でない値があれば、ページ内リンクを探索
 * 3. それでも取得できなければ再検索クエリを生成
 */
export async function deepSearch(
  municipalityName: string,
  initialUrl: string,
  targetVariables: { name: string; description: string; examples?: string[] }[],
  options: {
    maxDepth?: number;
    maxPagesPerLevel?: number;
    officialUrl?: string;
  } = {}
): Promise<DeepSearchResult> {
  const { maxDepth = 2, maxPagesPerLevel = 3 } = options;

  const variables: ExtractedVariable[] = [];
  const visitedUrls = new Set<string>();
  const suggestedQueries: SuggestedQuery[] = [];
  let totalApiCalls = 0;

  // 未取得の変数を追跡
  const pendingVariables = new Map(
    targetVariables.map(v => [v.name, v])
  );

  // BFSでページを探索
  let currentUrls = [initialUrl];

  for (let depth = 0; depth < maxDepth && pendingVariables.size > 0; depth++) {
    const nextUrls: string[] = [];

    for (const url of currentUrls.slice(0, maxPagesPerLevel)) {
      if (visitedUrls.has(url)) continue;
      visitedUrls.add(url);

      try {
        const page = await fetchPage(url);
        totalApiCalls++;

        // 変数抽出
        const pendingVarList = Array.from(pendingVariables.values());
        const extracted = await extractVariables(
          page.content,
          url,
          pendingVarList.map(v => ({
            variableName: v.name,
            description: v.description,
            examples: v.examples,
          }))
        );
        totalApiCalls++;

        // 具体的な値が取得できた変数を記録
        for (const ext of extracted) {
          if (ext.value && isConcreteValue(ext.variableName, ext.value)) {
            // バリデーションと信頼度調整
            const validationResult = validateVariable(ext.variableName, ext.value);
            if (validationResult.valid) {
              ext.confidence = Math.min(ext.confidence + 0.2, 1.0);
              if (validationResult.normalized) {
                ext.value = validationResult.normalized;
              }
            }

            variables.push(ext);
            pendingVariables.delete(ext.variableName);
          }
        }

        // まだ取得できていない変数があれば、ページ内リンクを評価
        if (pendingVariables.size > 0 && depth < maxDepth - 1) {
          // HTMLを再取得してリンク抽出（page.contentはテキスト化されている）
          const htmlResponse = await fetch(url);
          if (htmlResponse.ok) {
            const html = await htmlResponse.text();
            const links = await evaluatePageLinks(
              html,
              url,
              Array.from(pendingVariables.values()),
              maxPagesPerLevel
            );
            totalApiCalls++;

            for (const link of links) {
              if (!visitedUrls.has(link.url)) {
                nextUrls.push(link.url);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to process ${url}:`, error);
      }
    }

    currentUrls = nextUrls;
  }

  // まだ取得できていない変数があれば再検索クエリを提案
  if (pendingVariables.size > 0) {
    const failedVars = Array.from(pendingVariables.values()).map(v => ({
      name: v.name,
      description: v.description,
    }));

    const queries = await generateRefinedQueries(
      municipalityName,
      '', // 元のクエリは不明
      failedVars
    );
    totalApiCalls++;

    suggestedQueries.push(...queries);
  }

  return {
    variables,
    visitedUrls: Array.from(visitedUrls),
    suggestedQueries,
    totalApiCalls,
  };
}

/**
 * 再検索を実行
 */
export async function executeRefinedSearch(
  municipalityName: string,
  suggestedQuery: SuggestedQuery,
  officialUrl?: string
): Promise<ExtractedVariable[]> {
  const variables: ExtractedVariable[] = [];

  try {
    // 提案されたクエリで検索
    const searchResults = await searchMunicipalitySite(
      municipalityName,
      suggestedQuery.query,
      officialUrl
    );

    if (searchResults.length === 0) {
      return variables;
    }

    // 上位3件のページを取得
    const urlsToFetch = searchResults
      .filter((r: SearchResult) => isUsefulUrl(r.link) && isOfficialDomain(r.link))
      .slice(0, 3)
      .map((r: SearchResult) => r.link);

    for (const url of urlsToFetch) {
      try {
        const page = await fetchPage(url);

        const varRequests = suggestedQuery.targetVariables.map(name => {
          const def = getVariableDefinition(name);
          return {
            variableName: name,
            description: def?.description || name,
            examples: def?.examples,
          };
        });

        const extracted = await extractVariables(page.content, url, varRequests);

        for (const ext of extracted) {
          if (ext.value && isConcreteValue(ext.variableName, ext.value)) {
            const validationResult = validateVariable(ext.variableName, ext.value);
            if (validationResult.valid) {
              ext.confidence = Math.min(ext.confidence + 0.1, 1.0);
              if (validationResult.normalized) {
                ext.value = validationResult.normalized;
              }
            }

            // 既に取得済みでなければ追加
            if (!variables.some(v => v.variableName === ext.variableName)) {
              variables.push(ext);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
      }
    }
  } catch (error) {
    console.error('Refined search failed:', error);
  }

  return variables;
}
