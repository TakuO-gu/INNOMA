/**
 * Google Custom Search API Client
 */

import { GoogleSearchResponse, SearchResult } from './types';

const GOOGLE_CUSTOM_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * Search configuration
 */
interface SearchConfig {
  /** Limit search to specific site */
  siteRestrict?: string;
  /** Number of results to return (max 10) */
  num?: number;
  /** Language restriction */
  lr?: string;
}

/**
 * Execute Google Custom Search
 */
export async function googleSearch(
  query: string,
  config: SearchConfig = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey) {
    throw new Error('GOOGLE_CUSTOM_SEARCH_API_KEY is not set');
  }

  if (!searchEngineId) {
    throw new Error('GOOGLE_CUSTOM_SEARCH_ENGINE_ID is not set');
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: searchEngineId,
    q: query,
    num: String(config.num || 5),
    lr: config.lr || 'lang_ja',
  });

  if (config.siteRestrict) {
    params.set('siteSearch', config.siteRestrict);
  }

  const url = `${GOOGLE_CUSTOM_SEARCH_API_URL}?${params.toString()}`;

  const response = await fetch(url);
  const data: GoogleSearchResponse = await response.json();

  if (data.error) {
    throw new Error(`Google Search Error: ${data.error.message}`);
  }

  return data.items || [];
}

/**
 * Search within municipality official site
 */
export async function searchMunicipalitySite(
  municipalityName: string,
  query: string,
  officialUrl?: string
): Promise<SearchResult[]> {
  // Extract domain from official URL if provided
  let siteRestrict: string | undefined;
  if (officialUrl) {
    try {
      const url = new URL(officialUrl);
      siteRestrict = url.hostname;
    } catch {
      // Invalid URL, ignore
    }
  }

  // Build search query
  const fullQuery = siteRestrict
    ? query
    : `${municipalityName} ${query} site:.lg.jp OR site:.go.jp`;

  return googleSearch(fullQuery, {
    siteRestrict,
    num: 5,
  });
}

/**
 * Search for specific service information
 */
export async function searchServiceInfo(
  municipalityName: string,
  serviceName: string,
  targetInfo: string[],
  officialUrl?: string
): Promise<SearchResult[]> {
  const infoKeywords = targetInfo.join(' ');
  const query = `${municipalityName} ${serviceName} ${infoKeywords}`;

  return searchMunicipalitySite(municipalityName, query, officialUrl);
}

/**
 * Check if domain is official government domain
 * どんなhostnameでも受け入れ、公式ドメインかどうかを判定
 */
export function isOfficialDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // 日本の行政ドメイン
    const officialSuffixes = ['.lg.jp', '.go.jp'];
    if (officialSuffixes.some(suffix => hostname.endsWith(suffix))) {
      return true;
    }

    // 自治体ドメインパターン (例: www.city.takaoka.toyama.jp)
    const municipalityPatterns = [
      /\.city\.[a-z]+\.jp$/,      // city.xxx.jp
      /\.town\.[a-z]+\.jp$/,      // town.xxx.jp
      /\.vill\.[a-z]+\.jp$/,      // vill.xxx.jp (村)
      /\.pref\.[a-z]+\.jp$/,      // pref.xxx.jp (県)
      /^www\.city\./,              // www.city.xxx
      /^www\.town\./,              // www.town.xxx
      /^www\.vill\./,              // www.vill.xxx
      /^www\.pref\./,              // www.pref.xxx
      /^city\./,                   // city.xxx
      /^town\./,                   // town.xxx
      /^vill\./,                   // vill.xxx
      /^pref\./,                   // pref.xxx
    ];

    if (municipalityPatterns.some(pattern => pattern.test(hostname))) {
      return true;
    }

    // その他の公式っぽいドメイン
    // 例: takaoka.lg.jp, xxx-city.jp など
    if (hostname.endsWith('.jp') && (
      hostname.includes('-city') ||
      hostname.includes('-town') ||
      hostname.includes('-village') ||
      hostname.includes('-shi') ||
      hostname.includes('-machi') ||
      hostname.includes('-mura')
    )) {
      return true;
    }

    return false;
  } catch {
    // URLパースエラーの場合はfalse
    return false;
  }
}

/**
 * Calculate credibility score based on URL
 */
export function calculateUrlCredibility(url: string): number {
  let score = 0.5; // Base score

  if (isOfficialDomain(url)) {
    score += 0.3;
  }

  // Prefer HTTPS
  if (url.startsWith('https://')) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}
