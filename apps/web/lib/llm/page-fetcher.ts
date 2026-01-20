/**
 * Page Content Fetcher
 * Fetches and processes web page content for LLM extraction
 * PDFファイルはGoogle Vision APIでOCRを実行
 */

import { PageContent } from './types';
import { extractTextFromBase64Image, type PdfOcrResult } from '../pdf/vision-ocr';
import { getCachedOcr, setCachedOcr } from '../pdf/cache';

/**
 * URLがPDFかどうかを判定
 */
function isPdfUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');
}

/**
 * URLが画像かどうかを判定
 */
function isImageUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  return imageExtensions.some(ext => lowerUrl.endsWith(ext) || lowerUrl.includes(ext + '?'));
}

/**
 * PDFまたは画像からテキストを抽出（Vision API OCR）
 */
async function fetchPdfContent(url: string): Promise<PageContent> {
  // キャッシュを確認
  const cached = await getCachedOcr(url);
  if (cached) {
    return {
      url,
      title: 'PDF Document (Cached)',
      content: cached.text,
      fetchedAt: cached.cachedAt,
      contentType: 'pdf',
    };
  }

  // URLからコンテンツを取得
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0; +https://innoma.jp)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // PDFの場合
  if (contentType.includes('pdf')) {
    // Vision APIはPDFを直接処理できない
    // 将来的にはpdf-to-imageライブラリで変換するか、
    // Google Cloud Storage経由の非同期OCRを使用
    return {
      url,
      title: 'PDF Document',
      content: '[PDF file detected. Direct PDF OCR requires page-by-page image conversion. Consider using Cloud Vision async API for large PDFs.]',
      fetchedAt: new Date().toISOString(),
      contentType: 'pdf',
      error: 'PDF direct OCR not supported. Convert to images first.',
    };
  }

  // 画像の場合はOCRを実行
  if (contentType.startsWith('image/')) {
    const result: PdfOcrResult = await extractTextFromBase64Image(base64);

    if (!result.success) {
      throw new Error(`OCR failed: ${result.error}`);
    }

    // キャッシュに保存
    await setCachedOcr(url, result.text);

    return {
      url,
      title: 'Image Document (OCR)',
      content: result.text,
      fetchedAt: new Date().toISOString(),
      contentType: 'image',
    };
  }

  throw new Error(`Unsupported content type: ${contentType}`);
}

/**
 * Fetch and process a web page or PDF/image
 */
export async function fetchPage(url: string): Promise<PageContent> {
  // PDFまたは画像の場合はOCR処理
  if (isPdfUrl(url) || isImageUrl(url)) {
    return fetchPdfContent(url);
  }

  // 通常のHTMLページ
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; INNOMA/1.0; +https://innoma.jp)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en;q=0.5',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }

  // Content-Typeを確認
  const contentType = response.headers.get('content-type') || '';

  // レスポンスがPDFや画像の場合（リダイレクトされた可能性）
  if (contentType.includes('pdf') || contentType.startsWith('image/')) {
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    if (contentType.startsWith('image/')) {
      const result = await extractTextFromBase64Image(base64);
      if (result.success) {
        await setCachedOcr(url, result.text);
        return {
          url,
          title: 'Image Document (OCR)',
          content: result.text,
          fetchedAt: new Date().toISOString(),
          contentType: 'image',
        };
      }
    }

    return {
      url,
      title: 'PDF Document',
      content: '[PDF content - requires image conversion for OCR]',
      fetchedAt: new Date().toISOString(),
      contentType: 'pdf',
    };
  }

  const html = await response.text();
  const { title, content } = extractTextContent(html);

  return {
    url,
    title,
    content,
    fetchedAt: new Date().toISOString(),
    contentType: 'html',
  };
}

/**
 * Extract text content from HTML
 * Simple implementation - can be enhanced with libraries like cheerio
 */
function extractTextContent(html: string): { title: string; content: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';

  // Remove script and style elements
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Remove header, footer, nav (usually not relevant content)
  content = content
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');

  // Convert HTML to text
  content = content
    // Add newlines for block elements
    .replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, '\n')
    .replace(/<(p|div|h[1-6]|li|tr|br)[^>]*>/gi, '\n')
    // Convert table cells to spaces
    .replace(/<\/(td|th)[^>]*>/gi, ' | ')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    // Clean up whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return { title, content };
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

/**
 * Fetch multiple pages with rate limiting
 */
export async function fetchPages(
  urls: string[],
  options: { concurrency?: number; delayMs?: number } = {}
): Promise<Map<string, PageContent | Error>> {
  const { concurrency = 2, delayMs = 500 } = options;
  const results = new Map<string, PageContent | Error>();

  // Process in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const content = await fetchPage(url);
          return { url, result: content };
        } catch (error) {
          return { url, result: error as Error };
        }
      })
    );

    for (const { url, result } of batchResults) {
      results.set(url, result);
    }

    // Rate limiting delay between batches
    if (i + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Check if URL is likely to contain useful content
 * PDFと画像は除外しない（OCRで処理可能）
 */
export function isUsefulUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Exclude certain file types (but keep PDF and images for OCR)
  const excludeExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.zip', '.ppt', '.pptx'];
  if (excludeExtensions.some((ext) => lowerUrl.endsWith(ext))) {
    return false;
  }

  // Exclude common non-content paths
  const excludePaths = ['/login', '/signin', '/register', '/cart', '/checkout', '/admin'];
  if (excludePaths.some((path) => lowerUrl.includes(path))) {
    return false;
  }

  return true;
}

/**
 * Check if URL points to a PDF file
 */
export function isPdf(url: string): boolean {
  return isPdfUrl(url);
}

/**
 * Check if URL points to an image file
 */
export function isImage(url: string): boolean {
  return isImageUrl(url);
}
