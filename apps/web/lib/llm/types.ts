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
  /** コンテンツの種類: html, pdf, image */
  contentType?: 'html' | 'pdf' | 'image';
  /** OCR/取得時のエラー（あれば） */
  error?: string;
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

// SearchAttempt is defined in @/lib/drafts/types.ts
import type { SearchAttempt } from '../drafts/types';
// Re-export with alias for backwards compatibility
export type { SearchAttempt as SearchAttemptRecord } from '../drafts/types';

/**
 * Result of a single variable extraction attempt
 */
export interface ExtractionResult {
  success: boolean;
  variables: ExtractedVariable[];
  errors: ExtractionError[];
  /** 未取得変数ごとの検索試行情報 */
  searchAttempts?: Record<string, SearchAttempt[]>;
  /** 未取得変数への代替案提案 */
  missingSuggestions?: Record<string, import("../drafts/types").MissingVariableSuggestion>;
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

// Draft types are defined in @/lib/drafts/types.ts
// Re-export for backwards compatibility
export type { Draft, DraftVariableEntry as DraftVariable } from '../drafts/types';

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
 * Variable validation types
 * 変数のバリデーションタイプ（明示的に指定することで、命名規則に依存しない）
 */
export type VariableValidationType =
  | 'phone'      // 電話番号
  | 'email'      // メールアドレス
  | 'url'        // URL
  | 'fee'        // 料金（円）
  | 'percent'    // パーセンテージ
  | 'date'       // 日付
  | 'time'       // 時間
  | 'postal'     // 郵便番号
  | 'count'      // カウント（数値のみ、例: 29）
  | 'text';      // テキスト（バリデーションなし）

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
  name: string;
  description: string;
  category: string;
  priority: VariablePriority;
  /** 明示的なバリデーションタイプ（指定しない場合は変数名から推測） */
  validationType?: VariableValidationType;
  /** @deprecated validationTypeを使用してください */
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

/**
 * 地区（町丁目）の定義
 * 地区依存変数の値を格納するための構造
 */
export interface District {
  /** 地区ID（一意識別子） */
  id: string;
  /** 地区名（表示用） */
  name: string;
  /** この地区での値 */
  value: string;
  /** 含まれる町名・地名（検索・マッチング用） */
  areas: string[];
}

/**
 * 地区依存変数のデータ構造
 * 同一自治体内でも地区によって値が異なる変数用
 */
export interface DistrictDependentVariable {
  /** 変数名 */
  variableName: string;
  /** 地区リスト（選択肢） */
  districts: District[];
  /** デフォルト値（地区未選択時に表示） */
  defaultValue?: string;
  /** 地区選択を促すメッセージ */
  selectPrompt: string;
  /** ソースURL */
  sourceUrl?: string;
  /** 最終更新日時 */
  updatedAt?: string;
}

/**
 * 自治体の地区データ
 * 各自治体が持つ地区依存変数の集合
 */
export interface MunicipalityDistrictData {
  /** 自治体ID */
  municipalityId: string;
  /** 地区依存変数のマップ（変数名 -> データ） */
  variables: Record<string, DistrictDependentVariable>;
  /** 最終更新日時 */
  updatedAt: string;
}
