/**
 * Content-Item 公開設定 API
 *
 * GET  - 全ページの公開設定を取得
 * PUT  - 指定ページの公開設定を更新
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getVisibilityConfig,
  getAllPagesWithVisibility,
  updatePagesVisibility,
  getAllCategories,
  getVisibilityStats,
} from "@/lib/visibility";
import type {
  VisibilityApiResponse,
  UpdateVisibilityRequest,
  UpdateVisibilityResponse,
} from "@/lib/visibility";
import { revalidatePath } from "next/cache";

/**
 * GET /api/admin/visibility
 * 全ページの公開設定を取得
 */
export async function GET() {
  try {
    const [config, pages, categories, stats] = await Promise.all([
      getVisibilityConfig(),
      getAllPagesWithVisibility(),
      getAllCategories(),
      getVisibilityStats(),
    ]);

    const response: VisibilityApiResponse & {
      categories: string[];
      stats: { total: number; visible: number; hidden: number };
    } = {
      config,
      pages,
      categories,
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to get visibility config:", error);
    return NextResponse.json(
      { error: "Failed to get visibility config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/visibility
 * 指定ページの公開設定を更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateVisibilityRequest;

    if (!body.pages || typeof body.pages !== "object") {
      return NextResponse.json(
        { error: "Invalid request body: pages object is required" },
        { status: 400 }
      );
    }

    const config = await updatePagesVisibility(body.pages);

    // 全自治体のページをrevalidate
    revalidatePath("/[municipality]", "layout");

    const response: UpdateVisibilityResponse = {
      success: true,
      updatedAt: config.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update visibility:", error);
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }
}
