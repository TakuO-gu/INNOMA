/**
 * Playwright Link Crawler - ページ内リンクを辿って変数を取得
 *
 * Extractor で変数が取得できなかった場合に:
 * 1. ページ内の関連リンクを LLM で評価
 * 2. Playwright でクリックして遷移
 * 3. 各ページで Extractor を実行
 * 4. 最大3ページまで横断探索
 */

import { chromium, Browser, Page } from 'playwright';
import { generateJSON } from './gemini';
import { isOfficialDomain } from './google-search';
import { ExtractedVariable } from './types';
import { extractVariables } from './prompts/extractor';
import { validateVariable } from './validators';
import { isConcreteValue } from './deep-search';

/**
 * リンク評価結果
 */
interface EvaluatedLink {
  href: string;
  text: string;
  relevanceScore: number;
  reason: string;
}

/**
 * クローラー設定
 */
export interface CrawlerOptions {
  maxPages?: number;        // 最大探索ページ数（デフォルト: 3）
  maxLinksPerPage?: number; // ページあたりの最大リンク評価数（デフォルト: 5）
  timeout?: number;         // ページ読み込みタイムアウト（デフォルト: 30000ms）
  headed?: boolean;         // ブラウザ表示（デバッグ用）
  officialUrl?: string;     // 公式サイトURL（ドメイン判定用）
}

/**
 * クローラー結果
 */
export interface CrawlerResult {
  variables: ExtractedVariable[];
  visitedUrls: string[];
  totalPages: number;
  pdfUrls: string[];  // 発見したPDFリンク
}

/**
 * ページからリンクを抽出
 */
async function extractLinksFromPage(page: Page): Promise<{ href: string; text: string }[]> {
  return await page.evaluate(() => {
    const links: { href: string; text: string }[] = [];
    const anchors = document.querySelectorAll('a[href]');

    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href');
      const text = anchor.textContent?.trim() || '';

      if (href && text && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        // 相対URLを絶対URLに変換
        const absoluteHref = new URL(href, window.location.href).href;
        links.push({ href: absoluteHref, text });
      }
    });

    return links;
  });
}

/**
 * ページのテキストコンテンツを取得
 */
async function getPageTextContent(page: Page): Promise<string> {
  return await page.evaluate(() => {
    // メインコンテンツ領域を優先
    const main = document.querySelector('main') || document.querySelector('article') || document.querySelector('.content') || document.body;

    // 不要な要素を除外
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove());

    return clone.textContent?.replace(/\s+/g, ' ').trim() || '';
  });
}

/**
 * リンクを LLM で評価し、関連性の高いものを返す
 */
async function evaluateLinks(
  links: { href: string; text: string }[],
  targetVariables: { name: string; description: string }[],
  maxLinks: number
): Promise<EvaluatedLink[]> {
  // 公式ドメインのリンクのみ（PDFやファイルダウンロードを除外）
  const filteredLinks = links.filter(l => {
    const url = l.href.toLowerCase();
    return isOfficialDomain(l.href) &&
      !url.endsWith('.pdf') &&
      !url.endsWith('.xlsx') &&
      !url.endsWith('.doc') &&
      !url.endsWith('.docx') &&
      !url.includes('/download/');
  });

  if (filteredLinks.length === 0) {
    return [];
  }

  // リンクが多すぎる場合は最初の20件に絞る
  const linksToEvaluate = filteredLinks.slice(0, 20);

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
- 「詳細はこちら」「○○について」「手続き案内」などのリンクは有用な可能性が高い
- ファイルダウンロード（申請書等）は情報取得には不向き
- 関連性スコア50以上のリンクのみ含めてください
- 最大${maxLinks}件まで`;

  interface LinkEvaluationResponse {
    evaluatedLinks: {
      index: number;
      relevanceScore: number;
      reason: string;
    }[];
  }

  try {
    const response = await generateJSON<LinkEvaluationResponse>(prompt, { maxOutputTokens: 800 });

    return (response.evaluatedLinks || [])
      .filter(e => e.relevanceScore >= 50)
      .slice(0, maxLinks)
      .map(e => {
        const link = linksToEvaluate[e.index - 1];
        return {
          href: link?.href || '',
          text: link?.text || '',
          relevanceScore: e.relevanceScore,
          reason: e.reason,
        };
      })
      .filter(e => e.href);
  } catch (error) {
    console.error('Failed to evaluate links:', error);
    return [];
  }
}

/**
 * Playwright でページを巡回して変数を取得
 */
export async function crawlForVariables(
  startUrl: string,
  targetVariables: { name: string; description: string; examples?: string[] }[],
  options: CrawlerOptions = {}
): Promise<CrawlerResult> {
  const {
    maxPages = 3,
    maxLinksPerPage = 5,
    timeout = 30000,
    headed = false,
  } = options;

  const variables: ExtractedVariable[] = [];
  const visitedUrls = new Set<string>();
  const pdfUrls = new Set<string>();  // PDFリンクを収集
  const pendingVariables = new Map(
    targetVariables.map(v => [v.name, v])
  );

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: !headed,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ja-JP',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    // BFS でページを探索
    const urlQueue: string[] = [startUrl];
    let pagesVisited = 0;

    while (urlQueue.length > 0 && pagesVisited < maxPages && pendingVariables.size > 0) {
      const currentUrl = urlQueue.shift()!;

      if (visitedUrls.has(currentUrl)) {
        continue;
      }

      visitedUrls.add(currentUrl);
      pagesVisited++;

      console.log(`[Crawler] Visiting (${pagesVisited}/${maxPages}): ${currentUrl}`);

      try {
        await page.goto(currentUrl, {
          waitUntil: 'networkidle',
          timeout,
        });

        // ページのテキストを取得
        const textContent = await getPageTextContent(page);

        if (textContent.length < 100) {
          console.log(`[Crawler] Page has insufficient content, skipping`);
          continue;
        }

        // 変数を抽出
        const pendingVarList = Array.from(pendingVariables.values());
        const extracted = await extractVariables(
          textContent,
          currentUrl,
          pendingVarList.map(v => ({
            variableName: v.name,
            description: v.description,
            examples: v.examples,
          }))
        );

        // 具体的な値が取得できた変数を記録
        for (const ext of extracted) {
          if (ext.value && isConcreteValue(ext.variableName, ext.value)) {
            const validationResult = validateVariable(ext.variableName, ext.value);
            if (validationResult.valid) {
              ext.confidence = Math.min(ext.confidence + 0.2, 1.0);
              if (validationResult.normalized) {
                ext.value = validationResult.normalized;
              }
            }

            variables.push(ext);
            pendingVariables.delete(ext.variableName);
            console.log(`[Crawler] Found: ${ext.variableName} = ${ext.value}`);
          }
        }

        // まだ取得できていない変数があり、探索余地がある場合はリンクを評価
        if (pendingVariables.size > 0 && pagesVisited < maxPages) {
          const links = await extractLinksFromPage(page);

          // PDFリンクを収集（後で処理するため）
          for (const link of links) {
            const lowerHref = link.href.toLowerCase();
            if (lowerHref.endsWith('.pdf') || lowerHref.includes('.pdf?')) {
              if (isOfficialDomain(link.href)) {
                pdfUrls.add(link.href);
                console.log(`[Crawler] Found PDF: ${link.text} -> ${link.href}`);
              }
            }
          }

          const evaluatedLinks = await evaluateLinks(
            links,
            Array.from(pendingVariables.values()),
            maxLinksPerPage
          );

          for (const link of evaluatedLinks) {
            if (!visitedUrls.has(link.href) && !urlQueue.includes(link.href)) {
              urlQueue.push(link.href);
              console.log(`[Crawler] Queued: ${link.text} (score: ${link.relevanceScore})`);
            }
          }
        }
      } catch (error) {
        console.error(`[Crawler] Failed to process ${currentUrl}:`, error);
      }
    }

    await context.close();
  } catch (error) {
    console.error('[Crawler] Browser error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return {
    variables,
    visitedUrls: Array.from(visitedUrls),
    totalPages: visitedUrls.size,
    pdfUrls: Array.from(pdfUrls),
  };
}
