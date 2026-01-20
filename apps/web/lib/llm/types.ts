/**
 * LLM Fetcher System Types
 */

/**
 * LLM fetch configuration
 */
export interface LLMFetchConfig {
  municipalityId: string;
  municipalityName: string;
  prefecture: string;
  officialUrl?: string;
  targetVariables?: string[];
  services?: string[];
}

/**
 * Search result from Google Custom Search
 */
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

/**
 * Page content fetched from URL
 */
export interface PageContent {
  url: string;
  title: string;
  content: string;
  fetchedAt: string;
}

/**
 * Extracted variable value from LLM
 */
export interface ExtractedVariable {
  variableName: string;
  value: string | null;
  confidence: number;
  sourceUrl: string;
  extractedAt: string;
}

/**
 * Result of a single variable extraction attempt
 */
export interface ExtractionResult {
  success: boolean;
  variables: ExtractedVariable[];
  errors: ExtractionError[];
}

/**
 * Error during extraction
 */
export interface ExtractionError {
  variableName?: string;
  code: 'SEARCH_FAILED' | 'PAGE_FETCH_FAILED' | 'EXTRACTION_FAILED' | 'RATE_LIMITED' | 'VALIDATION_FAILED';
  message: string;
  retryable: boolean;
}

/**
 * Draft data structure
 */
export interface Draft {
  municipalityId: string;
  service: string;
  status: 'draft' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  variables: Record<string, DraftVariable>;
  missingVariables: string[];
  errors: ExtractionError[];
}

/**
 * Variable in draft
 */
export interface DraftVariable {
  value: string;
  sourceUrl: string;
  confidence: number;
  extractedAt: string;
}

/**
 * Fetch job status
 */
export interface FetchJob {
  id: string;
  municipalityId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  totalVariables: number;
  fetchedVariables: number;
  errors: ExtractionError[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Variable priority levels
 */
export type VariablePriority = 'high' | 'medium' | 'low';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
  name: string;
  description: string;
  category: string;
  priority: VariablePriority;
  validationPattern?: string;
  examples?: string[];
}

/**
 * Service definition for grouping variables
 */
export interface ServiceDefinition {
  id: string;
  name: string;
  nameJa: string;
  variables: string[];
  searchKeywords: string[];
}

/**
 * Google Custom Search API response
 */
export interface GoogleSearchResponse {
  items?: SearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Gemini API message
 */
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Gemini API response
 */
export interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
    finishReason: string;
  }[];
  error?: {
    code: number;
    message: string;
  };
}
