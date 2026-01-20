/**
 * Draft System
 * Main entry point for draft operations
 */

// Types
export * from './types';

// Storage operations
export {
  getAllDrafts,
  getMunicipalityDrafts,
  getDraft,
  saveDraft,
  createDraft,
  updateDraftStatus,
  updateDraftVariables,
  deleteDraft,
  getDraftsByStatus,
  draftExists,
  getPendingReviewCount,
  getDraftStatistics,
} from './storage';

// Diff utilities
export {
  compareDraftWithStore,
  getDraftComparison,
  getChangedVariables,
  generateDiffSummary,
  applyDraftToStore,
  hasSignificantChanges,
} from './diff';
