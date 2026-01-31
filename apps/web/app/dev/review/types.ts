/**
 * UIレビューツール 型定義
 */

export type ReviewStatus = "proposal" | "in_progress" | "confirmed";

export interface Review {
  id: string;
  /** CSS selector */
  elementSelector: string;
  /** Block type (Title, Summary, RichText等) */
  blockType: string;
  /** Block ID */
  blockId: string;
  /** 要素のタイプ（より詳細な名前） */
  elementType?: string;
  /** 改善指示 */
  instruction: string;
  /** 適用範囲 */
  scope: "global" | "local";
  /** レビューステータス */
  status: ReviewStatus;
  /** 作成日時 */
  createdAt: string;
}

export interface ReviewSession {
  id: string;
  /** ページURL */
  pageUrl: string;
  /** 自治体ID */
  municipalityId: string;
  /** パス */
  path: string;
  /** レビュー一覧 */
  reviews: Review[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

export interface SelectedElement {
  selector: string;
  blockType: string;
  blockId: string;
  /** 要素のタイプ（より詳細な名前） */
  elementType?: string;
  /** 要素のouterHTML（参考用） */
  htmlPreview: string;
}

export interface PreviewMessage {
  type: "element-selected" | "element-deselected" | "element-hover" | "ready" | "navigate-request";
  data?: SelectedElement | { href: string };
}

export interface ParentMessage {
  type: "enable-inspector" | "disable-inspector";
}
