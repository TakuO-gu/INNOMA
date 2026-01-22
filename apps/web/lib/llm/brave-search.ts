/**
 * Brave Search API Client
 * https://brave.com/search/api/
 */

import { SearchResult } from './types';

const BRAVE_SEARCH_API_URL = 'https://api.search.brave.com/res/v1/web/search';

/**
 * Brave Search API response types
 */
interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  extra_snippets?: string[];
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
  query?: {
    original: string;
  };
}

/**
 * Search configuration
 */
interface SearchConfig {
  /** Limit search to specific site */
  siteRestrict?: string;
  /** Number of results to return (max 20) */
  count?: number;
  /** Country code (e.g., 'JP') */
  country?: string;
  /** Search language (e.g., 'ja') */
  searchLang?: string;
}

/**
 * Execute Brave Search
 */
export async function braveSearch(
  query: string,
  config: SearchConfig = {}
): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    throw new Error('BRAVE_SEARCH_API_KEY is not set');
  }

  // Build query with site restriction if provided
  let searchQuery = query;
  if (config.siteRestrict) {
    searchQuery = `site:${config.siteRestrict} ${query}`;
  }

  const params = new URLSearchParams({
    q: searchQuery,
    count: String(config.count || 5),
    country: config.country || 'JP',
    search_lang: config.searchLang || 'jp',
    text_decorations: 'false',
  });

  const url = `${BRAVE_SEARCH_API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brave Search Error: ${response.status} - ${errorText}`);
  }

  const data: BraveSearchResponse = await response.json();

  if (!data.web?.results) {
    return [];
  }

  // Convert to common SearchResult format
  return data.web.results.map((result) => ({
    title: result.title,
    link: result.url,
    snippet: result.description,
    displayLink: new URL(result.url).hostname,
  }));
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
    : `${municipalityName} ${query} (site:lg.jp OR site:go.jp)`;

  return braveSearch(fullQuery, {
    siteRestrict,
    count: 5,
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
