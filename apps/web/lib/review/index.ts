/**
 * コンテンツレビューシステム
 *
 * 自治体Webサイトの変更を検知し、関連ページを非公開にするシステム
 */

// 型定義
export * from "./types";

// ストレージ
export {
  getPageReviews,
  savePageReviews,
  getPageReviewStatus,
  markPageForReview,
  approvePageReview,
  dismissPageReview,
  getReviewPendingPages,
  saveSourceCheckResult,
  getLatestSourceCheckResult,
  isPagePendingReview,
} from "./storage";

// ソース変更検知
export {
  calculateContentHash,
  checkSourceChanges,
  clearSourceChangedFlag,
  initializeSourceHashes,
} from "./source-checker";

// 変数→ページマッピング
export {
  getVariablePageMap,
  generateVariablePageMap,
  saveVariablePageMap,
  clearVariablePageMapCache,
  getPagesUsingVariable,
  getVariablesInPage,
} from "./variable-page-map";
