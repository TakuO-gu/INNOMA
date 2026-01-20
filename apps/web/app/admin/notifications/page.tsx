"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface NotificationSummary {
  id: string;
  type: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  municipalityId?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationStats {
  total: number;
  unread: number;
}

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  draft_created: "下書き作成",
  draft_approved: "下書き承認",
  draft_rejected: "下書き却下",
  variable_updated: "変数更新",
  cron_completed: "定期更新完了",
  cron_failed: "定期更新失敗",
  fetch_completed: "取得完了",
  fetch_failed: "取得失敗",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const unreadParam = filter === "unread" ? "&unread=true" : "";
      const response = await fetch(
        `/api/admin/notifications?limit=100${unreadParam}`
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllAsRead" }),
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", id }),
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知</h1>
          {stats && (
            <p className="text-sm text-gray-500 mt-1">
              全{stats.total}件 / 未読{stats.unread}件
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "unread")}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="all">すべて</option>
            <option value="unread">未読のみ</option>
          </select>
          {stats && stats.unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              すべて既読にする
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filter === "unread" ? "未読の通知はありません" : "通知はありません"}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 hover:bg-gray-50 ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        severityColors[notification.severity]
                      }`}
                    >
                      {typeLabels[notification.type] || notification.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.municipalityId && (
                      <Link
                        href={`/admin/municipalities/${notification.municipalityId}`}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        詳細を見る
                      </Link>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        既読にする
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="px-3 py-1 text-xs text-red-500 hover:text-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
