/**
 * 自治体一覧・追加 API
 *
 * GET  /api/admin/municipalities - 自治体一覧取得
 * POST /api/admin/municipalities - 新規自治体追加
 */

import { NextRequest, NextResponse } from "next/server";
import { getMunicipalities, cloneTemplate } from "@/lib/template";
import type { CreateMunicipalityInput } from "@/lib/template";

/**
 * 自治体一覧を取得
 */
export async function GET() {
  try {
    const municipalities = await getMunicipalities();
    return NextResponse.json({ municipalities });
  } catch (error) {
    console.error("Failed to get municipalities:", error);
    return NextResponse.json(
      { error: "自治体一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * 新規自治体を追加
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 入力の検証
    const { id, name, prefecture, officialUrl, startFetch } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "自治体IDは必須です" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "自治体名は必須です" },
        { status: 400 }
      );
    }

    if (!prefecture || typeof prefecture !== "string") {
      return NextResponse.json(
        { error: "都道府県は必須です" },
        { status: 400 }
      );
    }

    // 自治体IDの形式チェック
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { error: "自治体IDは英小文字、数字、ハイフンのみ使用できます" },
        { status: 400 }
      );
    }

    const input: CreateMunicipalityInput = {
      id,
      name,
      prefecture,
      officialUrl: officialUrl || undefined,
      startFetch: startFetch ?? false,
    };

    // テンプレートを複製
    const meta = await cloneTemplate(input);

    return NextResponse.json({
      success: true,
      municipality: {
        id: meta.id,
        name: meta.name,
        prefecture: meta.prefecture,
        status: meta.status,
        createdAt: meta.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to create municipality:", error);

    if (error instanceof Error) {
      // 既知のエラーメッセージはそのまま返す
      if (
        error.message.includes("既に存在") ||
        error.message.includes("英小文字") ||
        error.message.includes("見つかりません")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "自治体の追加に失敗しました" },
      { status: 500 }
    );
  }
}
