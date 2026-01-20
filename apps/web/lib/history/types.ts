/**
 * 編集履歴 型定義
 */

/**
 * 変更の種類
 */
export type ChangeType = "create" | "update" | "delete" | "approve" | "reject";

/**
 * 変更のソース
 */
export type ChangeSource = "manual" | "llm" | "cron" | "import";

/**
 * 変数の変更エントリ
 */
export interface VariableChange {
  /** 変数名 */
  variableName: string;
  /** 変更前の値（新規作成時はundefined） */
  oldValue?: string;
  /** 変更後の値（削除時はundefined） */
  newValue?: string;
}

/**
 * 編集履歴エントリ
 */
export interface HistoryEntry {
  /** 一意のID */
  id: string;
  /** 自治体ID */
  municipalityId: string;
  /** 変更の種類 */
  type: ChangeType;
  /** 変更のソース */
  source: ChangeSource;
  /** 変更された変数のリスト */
  changes: VariableChange[];
  /** 変更者（ユーザー名やシステム名） */
  changedBy: string;
  /** 変更日時 */
  changedAt: string;
  /** サービスID（下書き承認の場合） */
  serviceId?: string;
  /** コメント */
  comment?: string;
}

/**
 * 編集履歴のサマリー（一覧表示用）
 */
export interface HistorySummary {
  /** エントリID */
  id: string;
  /** 変更の種類 */
  type: ChangeType;
  /** 変更のソース */
  source: ChangeSource;
  /** 変更された変数の数 */
  changeCount: number;
  /** 変更者 */
  changedBy: string;
  /** 変更日時 */
  changedAt: string;
  /** コメント */
  comment?: string;
}
