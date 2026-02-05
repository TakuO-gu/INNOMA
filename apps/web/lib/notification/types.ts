/**
 * 通知システム 型定義
 */

/**
 * 通知の種類
 */
export type NotificationType =
  | "draft_created"      // 新しい下書きが作成された
  | "draft_approved"     // 下書きが承認された
  | "draft_rejected"     // 下書きが却下された
  | "variable_updated"   // 変数が手動更新された
  | "cron_completed"     // 定期更新が完了
  | "cron_failed"        // 定期更新が失敗
  | "fetch_completed"    // LLM取得が完了
  | "fetch_failed"       // LLM取得が失敗
  | "source_changed"     // ソース変更検出
  | "review_approved"    // ソース変更レビュー承認
  | "review_dismissed";  // ソース変更レビュー却下（誤検知）

/**
 * 通知の重要度
 */
export type NotificationSeverity = "info" | "success" | "warning" | "error";

/**
 * 通知エントリ
 */
export interface Notification {
  /** 一意のID */
  id: string;
  /** 通知の種類 */
  type: NotificationType;
  /** 重要度 */
  severity: NotificationSeverity;
  /** タイトル */
  title: string;
  /** 詳細メッセージ */
  message: string;
  /** 関連する自治体ID */
  municipalityId?: string;
  /** 関連するサービスID */
  serviceId?: string;
  /** 追加データ */
  data?: Record<string, unknown>;
  /** 作成日時 */
  createdAt: string;
  /** 既読かどうか */
  read: boolean;
}

/**
 * 通知サマリー（一覧表示用）
 */
export interface NotificationSummary {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  municipalityId?: string;
  createdAt: string;
  read: boolean;
}

/**
 * 通知の統計
 */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}
