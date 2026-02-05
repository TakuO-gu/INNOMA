/**
 * カテゴリ一括公開設定 API
 *
 * PUT - 指定カテゴリの全ページの公開設定を一括更新
 */

import { NextRequest, NextResponse } from "next/server";
import { updateCategoryVisibility } from "@/lib/visibility";
import type {
  UpdateCategoryVisibilityRequest,
  UpdateVisibilityResponse,
} from "@/lib/visibility";
import { revalidatePath } from "next/cache";

/**
 * PUT /api/admin/visibility/category
 * 指定カテゴリの全ページの公開設定を一括更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateCategoryVisibilityRequest;

    if (!body.category || typeof body.category !== "string") {
      return NextResponse.json(
        { error: "Invalid request body: category is required" },
        { status: 400 }
      );
    }

    if (typeof body.visible !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body: visible (boolean) is required" },
        { status: 400 }
      );
    }

    const { config, updatedPages } = await updateCategoryVisibility(
      body.category,
      body.visible
    );

    // 全自治体のページをrevalidate
    revalidatePath("/[municipality]", "layout");

    const response: UpdateVisibilityResponse = {
      success: true,
      updatedAt: config.updatedAt,
      updatedPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update category visibility:", error);
    return NextResponse.json(
      { error: "Failed to update category visibility" },
      { status: 500 }
    );
  }
}
