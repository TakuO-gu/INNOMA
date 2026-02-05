/**
 * Content-Item 公開設定の型定義
 */

/**
 * 個別ページの公開設定
 */
export interface PageVisibility {
  visible: boolean;
}

/**
 * グローバル公開設定
 */
export interface VisibilityConfig {
  /** 最終更新日時 (ISO 8601) */
  updatedAt: string;
  /** ページ別の公開設定 (キー: page-registry のスラッグ) */
  pages: Record<string, PageVisibility>;
  /** 設定されていないページのデフォルト公開状態 */
  defaultVisibility: boolean;
}

/**
 * ページ情報（API レスポンス用）
 */
export interface PageInfo {
  /** ページスラッグ */
  slug: string;
  /** 所属カテゴリ */
  categories: string[];
  /** ページタイプ（topic の場合のみ設定） */
  type?: "topic";
  /** 現在の公開状態 */
  visible: boolean;
}

/**
 * 公開設定 API レスポンス
 */
export interface VisibilityApiResponse {
  config: VisibilityConfig;
  pages: PageInfo[];
}

/**
 * 公開設定更新リクエスト
 */
export interface UpdateVisibilityRequest {
  pages: Record<string, { visible: boolean }>;
}

/**
 * カテゴリ一括更新リクエスト
 */
export interface UpdateCategoryVisibilityRequest {
  category: string;
  visible: boolean;
}

/**
 * 更新レスポンス
 */
export interface UpdateVisibilityResponse {
  success: boolean;
  updatedAt: string;
  updatedPages?: string[];
}
