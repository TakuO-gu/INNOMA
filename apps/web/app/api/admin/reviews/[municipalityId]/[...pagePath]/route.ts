/**
 * レビュー詳細・操作 API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getPageReviewStatus,
  approvePageReview,
  dismissPageReview,
  clearSourceChangedFlag,
} from "@/lib/review";
import { getVariableStore } from "@/lib/template/storage";
import { addNotification } from "@/lib/notification";

interface RouteParams {
  params: Promise<{
    municipalityId: string;
    pagePath: string[];
  }>;
}

/**
 * GET /api/admin/reviews/[municipalityId]/[...pagePath]
 * レビュー詳細を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { municipalityId, pagePath } = await params;
    const pagePathStr = pagePath.join("/");

    const review = await getPageReviewStatus(municipalityId, pagePathStr);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // 変更が検出された変数の詳細情報を取得
    const variableStore = await getVariableStore(municipalityId);
    const changedVariableDetails = review.changedVariables.map((varName) => {
      const variable = variableStore[varName];
      return {
        name: varName,
        currentValue: variable?.value || null,
        sourceUrl: variable?.sourceUrl || null,
        sourceChangedAt: variable?.sourceChangedAt || null,
      };
    });

    return NextResponse.json({
      municipalityId,
      pagePath: pagePathStr,
      ...review,
      changedVariableDetails,
    });
  } catch (error) {
    console.error("Failed to get review details:", error);
    return NextResponse.json(
      { error: "Failed to get review details" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/reviews/[municipalityId]/[...pagePath]
 * レビューを承認または却下
 *
 * Body: { action: "approve" | "dismiss" }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { municipalityId, pagePath } = await params;
    const pagePathStr = pagePath.join("/");

    const body = await request.json();
    const { action } = body as { action: "approve" | "dismiss" };

    if (!action || !["approve", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'dismiss'" },
        { status: 400 }
      );
    }

    // レビューの状態を取得
    const review = await getPageReviewStatus(municipalityId, pagePathStr);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      await approvePageReview(municipalityId, pagePathStr);

      // 変数のsourceChangedフラグをクリア
      for (const varName of review.changedVariables) {
        await clearSourceChangedFlag(municipalityId, varName);
      }

      await addNotification(
        "review_approved",
        "レビュー承認",
        `${municipalityId}/${pagePathStr}のレビューが承認されました。`,
        {
          severity: "success",
          municipalityId,
          data: { pagePath: pagePathStr },
        }
      );
    } else {
      await dismissPageReview(municipalityId, pagePathStr);

      // 変数のsourceChangedフラグをクリア（誤検知として処理）
      for (const varName of review.changedVariables) {
        await clearSourceChangedFlag(municipalityId, varName);
      }

      await addNotification(
        "review_dismissed",
        "レビュー却下",
        `${municipalityId}/${pagePathStr}のレビューが却下されました（誤検知）。`,
        {
          severity: "info",
          municipalityId,
          data: { pagePath: pagePathStr },
        }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      municipalityId,
      pagePath: pagePathStr,
    });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
