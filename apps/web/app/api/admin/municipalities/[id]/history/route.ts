/**
 * Municipality History API
 * GET: Get history list
 */

import { NextRequest, NextResponse } from "next/server";
import { getHistoryList, getHistoryEntry, getHistoryStats } from "@/lib/history";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Check if requesting a specific entry
    const entryId = searchParams.get("entryId");
    if (entryId) {
      const entry = await getHistoryEntry(id, entryId);
      if (!entry) {
        return NextResponse.json(
          { error: "履歴が見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json(entry);
    }

    // Check if requesting stats
    const statsOnly = searchParams.get("stats");
    if (statsOnly === "true") {
      const stats = await getHistoryStats(id);
      return NextResponse.json(stats);
    }

    // Get paginated history list
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const history = await getHistoryList(id, { limit, offset });
    const stats = await getHistoryStats(id);

    return NextResponse.json({
      history,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: history.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
