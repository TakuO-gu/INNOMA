/**
 * Notifications API
 * GET: Get notification list
 * PUT: Mark notifications as read
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
} from "@/lib/notification";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Check if requesting stats
    if (searchParams.get("stats") === "true") {
      const stats = await getNotificationStats();
      return NextResponse.json(stats);
    }

    // Check if requesting a specific notification
    const id = searchParams.get("id");
    if (id) {
      const notification = await getNotification(id);
      if (!notification) {
        return NextResponse.json(
          { error: "通知が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json(notification);
    }

    // Get paginated notification list
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await getNotifications({ limit, offset, unreadOnly });
    const stats = await getNotificationStats();

    return NextResponse.json({
      notifications,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "通知の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id } = body;

    if (action === "markAllAsRead") {
      const count = await markAllAsRead();
      return NextResponse.json({ success: true, markedCount: count });
    }

    if (action === "markAsRead" && id) {
      const success = await markAsRead(id);
      if (!success) {
        return NextResponse.json(
          { error: "通知が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "無効なアクションです" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "通知の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "通知IDを指定してください" },
        { status: 400 }
      );
    }

    const success = await deleteNotification(id);
    if (!success) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "通知の削除に失敗しました" },
      { status: 500 }
    );
  }
}
