/**
 * コンテンツレビューシステム 型定義
 *
 * 自治体Webサイトの変更を検知し、関連ページを非公開にするシステム
 */

/**
 * ページのレビュー状態
 */
export type PageReviewStatus = "published" | "review_required" | "under_review";

/**
 * ページレビュー情報
 */
export interface PageReview {
  /** レビュー状態 */
  status: PageReviewStatus;
  /** 変更が検出された変数名リスト */
  changedVariables: string[];
  /** 変更検出日時 */
  detectedAt: string;
  /** レビュー開始日時 */
  reviewStartedAt?: string;
  /** レビュー完了日時 */
  reviewedAt?: string;
  /** レビュアー */
  reviewedBy?: string;
}

/**
 * ページレビューストア
 * {municipality}/page-reviews.json の構造
 */
export interface PageReviewStore {
  [pagePath: string]: PageReview;
}

/**
 * ソース変更情報
 */
export interface SourceChange {
  /** 変数名 */
  variableName: string;
  /** ソースURL */
  sourceUrl: string;
  /** 変更前のハッシュ */
  oldHash: string;
  /** 変更後のハッシュ */
  newHash: string;
  /** この変数を使用しているページ */
  affectedPages: string[];
}

/**
 * ソースチェックエラー
 */
export interface SourceCheckError {
  /** 変数名 */
  variableName: string;
  /** ソースURL */
  sourceUrl: string;
  /** エラーメッセージ */
  error: string;
}

/**
 * ソースチェック結果
 * _source-checks/{municipality}/latest.json の構造
 */
export interface SourceCheckResult {
  /** 自治体ID */
  municipalityId: string;
  /** チェック日時 */
  checkedAt: string;
  /** チェック対象の変数数 */
  totalVariables: number;
  /** 変更が検出された変数 */
  changedVariables: SourceChange[];
  /** チェック時のエラー */
  errors: SourceCheckError[];
}

/**
 * レビュー待ちページのサマリー（一覧表示用）
 */
export interface ReviewPendingPage {
  /** 自治体ID */
  municipalityId: string;
  /** 自治体名 */
  municipalityName: string;
  /** ページパス */
  pagePath: string;
  /** ページタイトル */
  pageTitle: string;
  /** レビュー状態 */
  status: PageReviewStatus;
  /** 変更が検出された変数 */
  changedVariables: ChangedVariableInfo[];
  /** 変更検出日時 */
  detectedAt: string;
}

/**
 * 変更が検出された変数の詳細情報
 */
export interface ChangedVariableInfo {
  /** 変数名 */
  name: string;
  /** ソースURL */
  sourceUrl: string;
  /** 変更検出日時 */
  detectedAt: string;
}

/**
 * 変数→ページのマッピング
 * _templates/variable-page-map.json の構造
 */
export interface VariablePageMap {
  [variableName: string]: string[];
}

/**
 * レビューアクションの種類
 */
export type ReviewAction = "approve" | "dismiss" | "refetch";

/**
 * レビューアクションの結果
 */
export interface ReviewActionResult {
  /** 成功したか */
  success: boolean;
  /** アクション */
  action: ReviewAction;
  /** 影響を受けたページ数 */
  affectedPages: number;
  /** エラーメッセージ（失敗時） */
  error?: string;
}
