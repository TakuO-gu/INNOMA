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
