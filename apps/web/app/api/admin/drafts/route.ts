/**
 * Draft List API
 * GET: List all drafts
 */

import { NextResponse } from "next/server";
import { getAllDrafts, getDraftStatistics } from "@/lib/drafts";

export async function GET() {
  try {
    const [drafts, stats] = await Promise.all([
      getAllDrafts(),
      getDraftStatistics(),
    ]);

    return NextResponse.json({ drafts, stats });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "下書き一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
