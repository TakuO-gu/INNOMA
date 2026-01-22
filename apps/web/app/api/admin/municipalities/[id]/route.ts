/**
 * 自治体詳細・更新・削除 API
 *
 * GET    /api/admin/municipalities/[id] - 自治体詳細取得
 * PUT    /api/admin/municipalities/[id] - 自治体更新
 * DELETE /api/admin/municipalities/[id] - 自治体削除
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getMunicipality,
  getMunicipalityMeta,
  getVariableStore,
  updateMunicipalityMeta,
  updateVariableStore,
  deleteMunicipality,
  updateMunicipalityStatus,
} from "@/lib/template";
import type { MunicipalityStatus } from "@/lib/template/types";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * 自治体詳細を取得
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const summary = await getMunicipality(id);

    if (!summary) {
      return NextResponse.json(
        { error: "自治体が見つかりません" },
        { status: 404 }
      );
    }

    const meta = await getMunicipalityMeta(id);
    const variables = await getVariableStore(id);

    return NextResponse.json({
      ...summary,
      officialUrl: meta?.officialUrl,
      createdAt: meta?.createdAt,
      lastFetchAt: meta?.lastFetchAt,
      settings: meta?.settings,
      variables,
    });
  } catch (error) {
    console.error("Failed to get municipality:", error);
    return NextResponse.json(
      { error: "自治体の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 自治体を更新
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const meta = await getMunicipalityMeta(id);
    if (!meta) {
      return NextResponse.json(
        { error: "自治体が見つかりません" },
        { status: 404 }
      );
    }

    // ステータスの更新
    if (body.status) {
      const validStatuses: MunicipalityStatus[] = [
        "draft",
        "published",
        "fetching",
        "pending_review",
        "error",
      ];
      if (validStatuses.includes(body.status)) {
        await updateMunicipalityStatus(id, body.status);
      }
    }

    // メタデータの更新
    if (body.name || body.prefecture || body.officialUrl || body.settings) {
      await updateMunicipalityMeta(id, {
        name: body.name,
        prefecture: body.prefecture,
        officialUrl: body.officialUrl,
        settings: body.settings,
      });
    }

    // 変数の更新
    if (body.variables && typeof body.variables === "object") {
      await updateVariableStore(id, body.variables);
    }

    const updated = await getMunicipality(id);
    return NextResponse.json({
      success: true,
      municipality: updated,
    });
  } catch (error) {
    console.error("Failed to update municipality:", error);
    return NextResponse.json(
      { error: "自治体の更新に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 自治体を削除
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // sampleは削除不可
    if (id === "sample") {
      return NextResponse.json(
        { error: "sampleテンプレートは削除できません" },
        { status: 400 }
      );
    }

    await deleteMunicipality(id);

    return NextResponse.json({
      success: true,
      message: `自治体 "${id}" を削除しました`,
    });
  } catch (error) {
    console.error("Failed to delete municipality:", error);

    if (error instanceof Error && error.message.includes("見つかりません")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "自治体の削除に失敗しました" },
      { status: 500 }
    );
  }
}
