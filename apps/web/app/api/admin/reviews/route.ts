/**
 * レビュー待ちページ一覧 API
 */

import { NextResponse } from "next/server";
import { getReviewPendingPages } from "@/lib/review";

/**
 * GET /api/admin/reviews
 * レビュー待ちページの一覧を取得
 */
export async function GET() {
  try {
    const reviews = await getReviewPendingPages();

    return NextResponse.json({
      reviews,
      total: reviews.length,
    });
  } catch (error) {
    console.error("Failed to get pending reviews:", error);
    return NextResponse.json(
      { error: "Failed to get pending reviews" },
      { status: 500 }
    );
  }
}
