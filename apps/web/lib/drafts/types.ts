/**
 * Draft System Types
 */

/**
 * Draft status
 */
export type DraftStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

/**
 * Draft variable entry
 */
export interface DraftVariableEntry {
  value: string;
  sourceUrl: string;
  confidence: number;
  extractedAt: string;
  validated: boolean;
  validationError?: string;
}

/**
 * Suggestion for missing variable
 */
export interface MissingVariableSuggestion {
  variableName: string;
  reason: string;
  relatedUrls: string[];
  relatedPdfs: string[];
  suggestedValue?: string | null;
  suggestedSourceUrl?: string | null;
  confidence?: number;
  status?: "suggested" | "accepted" | "rejected";
}

/**
 * Draft variable update payload
 */
export interface DraftVariableUpdate {
  value: string;
  sourceUrl?: string;
  confidence?: number;
  validated?: boolean;
}

/**
 * Search attempt record for a variable
 */
export interface SearchAttempt {
  query: string;
  searchedAt: string;
  resultsCount: number;
  urls: string[];
  snippets: string[];
  reason: 'not_found' | 'no_match' | 'low_confidence' | 'validation_failed';
}

/**
 * Draft data structure
 */
export interface Draft {
  id: string;
  municipalityId: string;
  service: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  variables: Record<string, DraftVariableEntry>;
  missingVariables: string[];
  /** 未取得変数の検索試行情報 */
  searchAttempts?: Record<string, SearchAttempt[]>;
  /** 未取得変数への代替案提案 */
  missingSuggestions?: Record<string, MissingVariableSuggestion>;
  errors: DraftError[];
  metadata: DraftMetadata;
}

/**
 * Draft error
 */
export interface DraftError {
  variableName?: string;
  code: string;
  message: string;
  timestamp: string;
}

/**
 * Draft metadata
 */
export interface DraftMetadata {
  fetchJobId?: string;
  totalVariables: number;
  filledVariables: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  autoApproved?: boolean;
}

/**
 * Draft summary for listing
 */
export interface DraftSummary {
  id: string;
  municipalityId: string;
  municipalityName?: string;
  service: string;
  serviceName: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  filledCount: number;
  missingCount: number;
  totalCount: number;
}

/**
 * Draft approval request
 */
export interface DraftApprovalRequest {
  draftId: string;
  variableOverrides?: Record<string, string>;
  approvedBy: string;
}

/**
 * Draft rejection request
 */
export interface DraftRejectionRequest {
  draftId: string;
  reason: string;
  rejectedBy: string;
}

/**
 * Diff entry for showing changes
 */
export interface DraftDiffEntry {
  variableName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: 'added' | 'modified' | 'removed' | 'unchanged';
}

/**
 * Draft comparison result
 */
export interface DraftComparison {
  draftId: string;
  municipalityId: string;
  service: string;
  changes: DraftDiffEntry[];
  hasChanges: boolean;
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
}
