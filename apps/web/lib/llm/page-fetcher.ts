/**
 * Page Content Fetcher
 * Fetches and processes web page content for LLM extraction
 */

import { PageContent } from './types';

/**
 * Fetch and process a web page
 */
export async function fetchPage(url: string): Promise<PageContent> {
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

  const html = await response.text();
  const { title, content } = extractTextContent(html);

  return {
    url,
    title,
    content,
    fetchedAt: new Date().toISOString(),
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
 */
export function isUsefulUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Exclude certain file types
  const excludeExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.jpg', '.png', '.gif'];
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
