/**
 * 通知システム ストレージ操作
 */

import { readFile, writeFile, mkdir, stat } from "fs/promises";
import { join } from "path";
import type {
  Notification,
  NotificationSummary,
  NotificationStats,
  NotificationType,
  NotificationSeverity,
} from "./types";

const NOTIFICATIONS_DIR = join(process.cwd(), "data/notifications");
const NOTIFICATIONS_FILE = join(NOTIFICATIONS_DIR, "notifications.json");
const MAX_NOTIFICATIONS = 100; // 保持する最大通知数

/**
 * ディレクトリが存在するか確認
 */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 一意のIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 通知一覧を読み込む
 */
async function loadNotifications(): Promise<Notification[]> {
  if (!(await exists(NOTIFICATIONS_FILE))) {
    return [];
  }

  try {
    const content = await readFile(NOTIFICATIONS_FILE, "utf-8");
    return JSON.parse(content) as Notification[];
  } catch {
    return [];
  }
}

/**
 * 通知一覧を保存
 */
async function saveNotifications(notifications: Notification[]): Promise<void> {
  if (!(await exists(NOTIFICATIONS_DIR))) {
    await mkdir(NOTIFICATIONS_DIR, { recursive: true });
  }

  // 最大数を超えた場合は古いものを削除（既読のものを優先的に削除）
  if (notifications.length > MAX_NOTIFICATIONS) {
    const read = notifications.filter((n) => n.read);
    const unread = notifications.filter((n) => !n.read);

    // 既読を古い順にソートして削除対象に
    read.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const toKeep = MAX_NOTIFICATIONS;
    if (unread.length >= toKeep) {
      // 未読だけで上限を超える場合は古い未読から削除
      unread.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      notifications = unread.slice(0, toKeep);
    } else {
      // 既読から削除
      const readToKeep = toKeep - unread.length;
      notifications = [...unread, ...read.slice(-readToKeep)];
    }
  }

  await writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
}

/**
 * 通知を追加
 */
export async function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    severity?: NotificationSeverity;
    municipalityId?: string;
    serviceId?: string;
    data?: Record<string, unknown>;
  }
): Promise<Notification> {
  const notification: Notification = {
    id: generateId(),
    type,
    severity: options?.severity || getSeverityForType(type),
    title,
    message,
    municipalityId: options?.municipalityId,
    serviceId: options?.serviceId,
    data: options?.data,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const notifications = await loadNotifications();
  notifications.unshift(notification); // 新しい通知を先頭に
  await saveNotifications(notifications);

  return notification;
}

/**
 * 通知タイプに応じたデフォルトの重要度を取得
 */
function getSeverityForType(type: NotificationType): NotificationSeverity {
  switch (type) {
    case "draft_approved":
    case "cron_completed":
    case "fetch_completed":
      return "success";
    case "draft_rejected":
      return "warning";
    case "cron_failed":
    case "fetch_failed":
      return "error";
    default:
      return "info";
  }
}

/**
 * 下書き作成の通知
 */
export async function notifyDraftCreated(
  municipalityId: string,
  municipalityName: string,
  serviceId: string,
  variableCount: number
): Promise<Notification> {
  return addNotification(
    "draft_created",
    `新しい下書き: ${municipalityName}`,
    `サービス「${serviceId}」の情報を取得しました（${variableCount}件の変数）`,
    { municipalityId, serviceId, data: { variableCount } }
  );
}

/**
 * 下書き承認の通知
 */
export async function notifyDraftApproved(
  municipalityId: string,
  municipalityName: string,
  serviceId: string,
  variableCount: number
): Promise<Notification> {
  return addNotification(
    "draft_approved",
    `下書き承認: ${municipalityName}`,
    `サービス「${serviceId}」の下書きを承認しました（${variableCount}件の変数を反映）`,
    { municipalityId, serviceId, data: { variableCount } }
  );
}

/**
 * 下書き却下の通知
 */
export async function notifyDraftRejected(
  municipalityId: string,
  municipalityName: string,
  serviceId: string,
  reason?: string
): Promise<Notification> {
  return addNotification(
    "draft_rejected",
    `下書き却下: ${municipalityName}`,
    reason || `サービス「${serviceId}」の下書きを却下しました`,
    { municipalityId, serviceId, data: { reason } }
  );
}

/**
 * 変数更新の通知
 */
export async function notifyVariableUpdated(
  municipalityId: string,
  municipalityName: string,
  variableCount: number
): Promise<Notification> {
  return addNotification(
    "variable_updated",
    `変数更新: ${municipalityName}`,
    `${variableCount}件の変数を手動で更新しました`,
    { municipalityId, data: { variableCount } }
  );
}

/**
 * 定期更新完了の通知
 */
export async function notifyCronCompleted(
  processedCount: number,
  servicesUpdated: number,
  errors: number
): Promise<Notification> {
  const hasErrors = errors > 0;
  return addNotification(
    hasErrors ? "cron_completed" : "cron_completed",
    "定期更新完了",
    `${processedCount}自治体を処理しました（${servicesUpdated}サービス更新、${errors}件のエラー）`,
    {
      severity: hasErrors ? "warning" : "success",
      data: { processedCount, servicesUpdated, errors },
    }
  );
}

/**
 * 定期更新失敗の通知
 */
export async function notifyCronFailed(error: string): Promise<Notification> {
  return addNotification("cron_failed", "定期更新エラー", error);
}

/**
 * LLM取得完了の通知
 */
export async function notifyFetchCompleted(
  municipalityId: string,
  municipalityName: string,
  servicesCount: number,
  totalVariables: number
): Promise<Notification> {
  return addNotification(
    "fetch_completed",
    `情報取得完了: ${municipalityName}`,
    `${servicesCount}サービスから${totalVariables}件の変数を取得しました`,
    { municipalityId, data: { servicesCount, totalVariables } }
  );
}

/**
 * LLM取得失敗の通知
 */
export async function notifyFetchFailed(
  municipalityId: string,
  municipalityName: string,
  error: string
): Promise<Notification> {
  return addNotification(
    "fetch_failed",
    `情報取得エラー: ${municipalityName}`,
    error,
    { municipalityId }
  );
}

/**
 * 通知一覧を取得
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<NotificationSummary[]> {
  let notifications = await loadNotifications();

  // 未読のみフィルタ
  if (options?.unreadOnly) {
    notifications = notifications.filter((n) => !n.read);
  }

  // ページネーション
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  const paged = notifications.slice(offset, offset + limit);

  return paged.map((n) => ({
    id: n.id,
    type: n.type,
    severity: n.severity,
    title: n.title,
    municipalityId: n.municipalityId,
    createdAt: n.createdAt,
    read: n.read,
  }));
}

/**
 * 特定の通知を取得
 */
export async function getNotification(id: string): Promise<Notification | null> {
  const notifications = await loadNotifications();
  return notifications.find((n) => n.id === id) || null;
}

/**
 * 通知を既読にする
 */
export async function markAsRead(id: string): Promise<boolean> {
  const notifications = await loadNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) return false;

  notifications[index].read = true;
  await saveNotifications(notifications);
  return true;
}

/**
 * すべての通知を既読にする
 */
export async function markAllAsRead(): Promise<number> {
  const notifications = await loadNotifications();
  let count = 0;
  for (const n of notifications) {
    if (!n.read) {
      n.read = true;
      count++;
    }
  }
  await saveNotifications(notifications);
  return count;
}

/**
 * 通知を削除
 */
export async function deleteNotification(id: string): Promise<boolean> {
  const notifications = await loadNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) return false;

  notifications.splice(index, 1);
  await saveNotifications(notifications);
  return true;
}

/**
 * 通知の統計を取得
 */
export async function getNotificationStats(): Promise<NotificationStats> {
  const notifications = await loadNotifications();

  const byType: Record<string, number> = {};
  let unread = 0;

  for (const n of notifications) {
    byType[n.type] = (byType[n.type] || 0) + 1;
    if (!n.read) unread++;
  }

  return {
    total: notifications.length,
    unread,
    byType: byType as Record<NotificationType, number>,
  };
}
