/**
 * Search API Client
 * Supports both Brave Search API and Google Custom Search API
 * Features:
 * - Dual provider support with automatic fallback
 * - Primary: Brave Search API (2,000 free queries/month)
 * - Secondary: Google Custom Search API (100 free queries/day)
 * - Configurable via SEARCH_PROVIDER env var
 */

import { SearchResult } from './types';
import { braveSearch as braveSearchImpl, searchMunicipalitySite as braveSearchMunicipalitySite, searchServiceInfo as braveSearchServiceInfo } from './brave-search';

/**
 * Search provider type
 */
export type SearchProvider = 'brave' | 'google' | 'auto';

/**
 * Search provider status
 */
export interface SearchProviderStatus {
  brave: {
    available: boolean;
    apiKey: boolean;
  };
  google: {
    available: boolean;
    apiKey: boolean;
    engineId: boolean;
  };
  primary: SearchProvider | null;
  fallback: SearchProvider | null;
}

/**
 * Get configured search providers status
 */
export function getSearchProviderStatus(): SearchProviderStatus {
  const braveKey = !!process.env.BRAVE_SEARCH_API_KEY;
  const googleKey = !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const googleEngineId = !!process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  const braveAvailable = braveKey;
  const googleAvailable = googleKey && googleEngineId;

  // Determine primary and fallback based on configuration
  const configuredProvider = process.env.SEARCH_PROVIDER as SearchProvider | undefined;

  let primary: SearchProvider | null = null;
  let fallback: SearchProvider | null = null;

  if (configuredProvider === 'brave' && braveAvailable) {
    primary = 'brave';
    fallback = googleAvailable ? 'google' : null;
  } else if (configuredProvider === 'google' && googleAvailable) {
    primary = 'google';
    fallback = braveAvailable ? 'brave' : null;
  } else {
    // Auto mode: prefer Brave, fallback to Google
    if (braveAvailable) {
      primary = 'brave';
      fallback = googleAvailable ? 'google' : null;
    } else if (googleAvailable) {
      primary = 'google';
      fallback = null;
    }
  }

  return {
    brave: { available: braveAvailable, apiKey: braveKey },
    google: { available: googleAvailable, apiKey: googleKey, engineId: googleEngineId },
    primary,
    fallback,
  };
}

/**
 * Get the primary search provider
 */
function getPrimaryProvider(): SearchProvider {
  const status = getSearchProviderStatus();
  if (status.primary) {
    return status.primary;
  }
  throw new Error('No search API configured. Set BRAVE_SEARCH_API_KEY or (GOOGLE_CUSTOM_SEARCH_API_KEY + GOOGLE_CUSTOM_SEARCH_ENGINE_ID)');
}

/**
 * Get the fallback search provider (if available)
 */
function getFallbackProvider(): SearchProvider | null {
  const status = getSearchProviderStatus();
  return status.fallback;
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
 * Extended search configuration with fallback options
 */
interface ExtendedSearchConfig extends SearchConfig {
  /** Disable fallback to secondary provider */
  disableFallback?: boolean;
  /** Force specific provider */
  forceProvider?: SearchProvider;
}

/**
 * Common fallback options interface
 */
interface FallbackOptions {
  disableFallback?: boolean;
  forceProvider?: SearchProvider;
}

/**
 * Execute operation with provider fallback support
 * Reduces code duplication across search functions
 */
async function executeWithFallback<T>(
  operation: (provider: SearchProvider) => Promise<T[]>,
  options: FallbackOptions,
  context: string
): Promise<T[]> {
  const primaryProvider = options.forceProvider || getPrimaryProvider();
  const fallbackProvider = options.disableFallback ? null : getFallbackProvider();

  try {
    const results = await operation(primaryProvider);
    if (results.length > 0) {
      return results;
    }
    // If no results and fallback is available, try fallback
    if (fallbackProvider && fallbackProvider !== primaryProvider) {
      console.log(`[Search] No ${context} results from ${primaryProvider}, trying fallback: ${fallbackProvider}`);
      return operation(fallbackProvider);
    }
    return results;
  } catch (error) {
    // On error, try fallback if available
    if (fallbackProvider && fallbackProvider !== primaryProvider) {
      console.warn(`[Search] ${primaryProvider} failed for ${context}, trying fallback: ${fallbackProvider}`, error);
      try {
        return await operation(fallbackProvider);
      } catch (fallbackError) {
        console.error(`[Search] Fallback ${fallbackProvider} also failed for ${context}`, fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

/**
 * Execute search using configured provider with automatic fallback
 */
export async function googleSearch(
  query: string,
  config: ExtendedSearchConfig = {}
): Promise<SearchResult[]> {
  return executeWithFallback(
    (provider) => executeSearch(query, config, provider),
    config,
    'search'
  );
}

/**
 * Execute search with specific provider
 */
async function executeSearch(
  query: string,
  config: SearchConfig,
  provider: SearchProvider
): Promise<SearchResult[]> {
  if (provider === 'brave') {
    return braveSearchImpl(query, {
      siteRestrict: config.siteRestrict,
      count: config.num,
    });
  }
  return googleSearchImpl(query, config);
}

/**
 * Search options for municipality site search
 */
interface MunicipalitySiteSearchOptions {
  /** Disable fallback to secondary provider */
  disableFallback?: boolean;
  /** Force specific provider */
  forceProvider?: SearchProvider;
}

/**
 * Search within municipality official site with fallback support
 */
export async function searchMunicipalitySite(
  municipalityName: string,
  query: string,
  officialUrl?: string,
  options: MunicipalitySiteSearchOptions = {}
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

  return executeWithFallback(
    (provider) => executeMunicipalitySiteSearch(municipalityName, query, officialUrl, siteRestrict, provider),
    options,
    'municipality'
  );
}

/**
 * Execute municipality site search with specific provider
 */
async function executeMunicipalitySiteSearch(
  municipalityName: string,
  query: string,
  officialUrl: string | undefined,
  siteRestrict: string | undefined,
  provider: SearchProvider
): Promise<SearchResult[]> {
  if (provider === 'brave') {
    return braveSearchMunicipalitySite(municipalityName, query, officialUrl);
  }

  // Google implementation
  const fullQuery = siteRestrict
    ? query
    : `${municipalityName} ${query} site:.lg.jp OR site:.go.jp`;

  return googleSearch(fullQuery, {
    siteRestrict,
    num: 5,
    disableFallback: true, // Already in fallback context
  });
}

/**
 * Search options for service info search
 */
interface ServiceInfoSearchOptions {
  /** Disable fallback to secondary provider */
  disableFallback?: boolean;
  /** Force specific provider */
  forceProvider?: SearchProvider;
}

/**
 * Search for specific service information with fallback support
 */
export async function searchServiceInfo(
  municipalityName: string,
  serviceName: string,
  targetInfo: string[],
  officialUrl?: string,
  options: ServiceInfoSearchOptions = {}
): Promise<SearchResult[]> {
  return executeWithFallback(
    (provider) => executeServiceInfoSearch(municipalityName, serviceName, targetInfo, officialUrl, provider),
    options,
    'service info'
  );
}

/**
 * Execute service info search with specific provider
 */
async function executeServiceInfoSearch(
  municipalityName: string,
  serviceName: string,
  targetInfo: string[],
  officialUrl: string | undefined,
  provider: SearchProvider
): Promise<SearchResult[]> {
  if (provider === 'brave') {
    return braveSearchServiceInfo(municipalityName, serviceName, targetInfo, officialUrl);
  }

  const infoKeywords = targetInfo.join(' ');
  const query = `${municipalityName} ${serviceName} ${infoKeywords}`;

  return searchMunicipalitySite(municipalityName, query, officialUrl, {
    disableFallback: true, // Already in fallback context
  });
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
