/**
 * Information Extraction Prompts
 */

import { generateJSON } from '../gemini';
import { ExtractedVariable } from '../types';

/**
 * Variable extraction request
 */
interface ExtractionRequest {
  variableName: string;
  description: string;
  validationHint?: string;
  examples?: string[];
}

/**
 * Extraction response from LLM
 */
interface ExtractionResponse {
  [key: string]: string | null;
}

/**
 * Extract variables from page content
 */
export async function extractVariables(
  pageContent: string,
  pageUrl: string,
  variables: ExtractionRequest[]
): Promise<ExtractedVariable[]> {
  // Truncate content if too long (Gemini has token limits)
  const maxContentLength = 15000;
  const truncatedContent =
    pageContent.length > maxContentLength
      ? pageContent.slice(0, maxContentLength) + '\n...[省略]'
      : pageContent;

  const variableList = variables
    .map((v) => {
      let line = `- ${v.variableName}: ${v.description}`;
      if (v.validationHint) {
        line += ` (${v.validationHint})`;
      }
      return line;
    })
    .join('\n');

  const prompt = `ページから以下を抽出しJSON出力。見つからなければnull。
${variableList}

ページ:
${truncatedContent}`;

  const response = await generateJSON<ExtractionResponse>(prompt);
  const now = new Date().toISOString();

  return variables.map((v) => {
    const value = response[v.variableName];
    return {
      variableName: v.variableName,
      value: value ?? null,
      confidence: value !== null ? 0.8 : 0,
      sourceUrl: pageUrl,
      extractedAt: now,
    };
  });
}

/**
 * Extract variables from search snippets (without fetching full page)
 */
export async function extractFromSnippets(
  snippets: { title: string; snippet: string; url: string }[],
  variables: ExtractionRequest[]
): Promise<{ extracted: ExtractedVariable[]; needsPageFetch: string[] }> {
  const snippetText = snippets
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet}\nURL: ${s.url}`)
    .join('\n\n');

  const variableList = variables
    .map((v) => `- ${v.variableName}: ${v.description}`)
    .join('\n');

  const prompt = `検索結果から以下を抽出しJSON出力。不確かならneedsPageFetchに追加。
${variableList}

検索結果:
${snippetText}

出力形式: { "extracted": { "変数名": { "value": "値", "sourceIndex": 番号 } }, "needsPageFetch": ["変数名"] }`;

  interface SnippetExtractionResponse {
    extracted: Record<string, { value: string; sourceIndex: number }>;
    needsPageFetch: string[];
  }

  const response = await generateJSON<SnippetExtractionResponse>(prompt);
  const now = new Date().toISOString();

  const extracted: ExtractedVariable[] = [];

  for (const [variableName, data] of Object.entries(response.extracted)) {
    const sourceUrl = snippets[data.sourceIndex - 1]?.url || '';
    extracted.push({
      variableName,
      value: data.value,
      confidence: 0.7, // Lower confidence for snippet extraction
      sourceUrl,
      extractedAt: now,
    });
  }

  return {
    extracted,
    needsPageFetch: response.needsPageFetch || [],
  };
}

/**
 * Extract contact information specifically
 */
export async function extractContactInfo(
  pageContent: string,
  pageUrl: string,
  departmentPrefix: string
): Promise<ExtractedVariable[]> {
  return extractVariables(pageContent, pageUrl, [
    {
      variableName: `${departmentPrefix}_department`,
      description: '担当課・部署名',
      examples: ['市民課', '保険年金課', '住民福祉課'],
    },
    {
      variableName: `${departmentPrefix}_phone`,
      description: '電話番号',
      validationHint: 'XX-XXXX-XXXX形式',
      examples: ['03-1234-5678', '0120-123-456'],
    },
    {
      variableName: `${departmentPrefix}_email`,
      description: 'メールアドレス',
      validationHint: 'xxx@xxx.lg.jp形式',
      examples: ['shimin@city.example.lg.jp'],
    },
    {
      variableName: `${departmentPrefix}_address`,
      description: '窓口住所',
      examples: ['〒100-0001 東京都千代田区...'],
    },
    {
      variableName: `${departmentPrefix}_hours`,
      description: '受付時間',
      examples: ['平日8:30-17:15', '月〜金 9:00-17:00'],
    },
  ]);
}

/**
 * Extract fee information specifically
 */
export async function extractFeeInfo(
  pageContent: string,
  pageUrl: string,
  feeVariables: { name: string; description: string }[]
): Promise<ExtractedVariable[]> {
  return extractVariables(
    pageContent,
    pageUrl,
    feeVariables.map((v) => ({
      variableName: v.name,
      description: v.description,
      validationHint: '金額（例: 300円、1,000円）',
    }))
  );
}
