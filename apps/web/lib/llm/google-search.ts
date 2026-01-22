/**
 * Search API Client
 * Supports both Brave Search API and Google Custom Search API
 * Default: Brave Search API (recommended)
 */

import { SearchResult } from './types';
import { braveSearch as braveSearchImpl, searchMunicipalitySite as braveSearchMunicipalitySite, searchServiceInfo as braveSearchServiceInfo } from './brave-search';

/**
 * Search provider type
 */
type SearchProvider = 'brave' | 'google';

/**
 * Get the configured search provider
 */
function getSearchProvider(): SearchProvider {
  // Use Brave by default, fallback to Google if BRAVE_SEARCH_API_KEY is not set
  if (process.env.BRAVE_SEARCH_API_KEY) {
    return 'brave';
  }
  if (process.env.GOOGLE_CUSTOM_SEARCH_API_KEY) {
    return 'google';
  }
  throw new Error('No search API configured. Set BRAVE_SEARCH_API_KEY or GOOGLE_CUSTOM_SEARCH_API_KEY');
}

/**
 * Google Custom Search API (legacy, kept for backwards compatibility)
 */
const GOOGLE_CUSTOM_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

interface GoogleSearchResponse {
  items?: SearchResult[];
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Search configuration
 */
interface SearchConfig {
  /** Limit search to specific site */
  siteRestrict?: string;
  /** Number of results to return (max 10 for Google, 20 for Brave) */
  num?: number;
  /** Language restriction */
  lr?: string;
}

/**
 * Execute Google Custom Search (legacy)
 */
async function googleSearchImpl(
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
 * Execute search using configured provider
 */
export async function googleSearch(
  query: string,
  config: SearchConfig = {}
): Promise<SearchResult[]> {
  const provider = getSearchProvider();

  if (provider === 'brave') {
    return braveSearchImpl(query, {
      siteRestrict: config.siteRestrict,
      count: config.num,
    });
  }

  return googleSearchImpl(query, config);
}

/**
 * Search within municipality official site
 */
export async function searchMunicipalitySite(
  municipalityName: string,
  query: string,
  officialUrl?: string
): Promise<SearchResult[]> {
  const provider = getSearchProvider();

  if (provider === 'brave') {
    return braveSearchMunicipalitySite(municipalityName, query, officialUrl);
  }

  // Google implementation
  let siteRestrict: string | undefined;
  if (officialUrl) {
    try {
      const url = new URL(officialUrl);
      siteRestrict = url.hostname;
    } catch {
      // Invalid URL, ignore
    }
  }

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
  const provider = getSearchProvider();

  if (provider === 'brave') {
    return braveSearchServiceInfo(municipalityName, serviceName, targetInfo, officialUrl);
  }

  const infoKeywords = targetInfo.join(' ');
  const query = `${municipalityName} ${serviceName} ${infoKeywords}`;

  return searchMunicipalitySite(municipalityName, query, officialUrl);
}

/**
 * Check if domain is official government domain
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
