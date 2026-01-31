/**
 * PDF OCR管理API
 *
 * POST: PDFのOCRを実行してキャッシュに保存
 * GET: キャッシュの状態を確認
 */

import { NextRequest, NextResponse } from "next/server";
import {
  extractTextFromBase64Image,
  getCachedOcr,
  setCachedOcr,
  hasCachedOcr,
} from "@/lib/pdf";
import { validateExternalUrl } from "@/lib/security/ssrf";

/**
 * POST: PDFのOCRを実行
 *
 * Body:
 * - url: string (必須) - PDFまたは画像のURL
 * - base64?: string - Base64エンコードされた画像（urlの代わりに使用可能）
 * - force?: boolean - キャッシュを無視して再実行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, base64, force = false } = body;

    if (!url && !base64) {
      return NextResponse.json(
        { success: false, error: "url or base64 is required" },
        { status: 400 }
      );
    }

    let safeUrl: string | null = null;
    if (url) {
      const allowedDomains = (process.env.OCR_ALLOWED_DOMAINS || "")
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const validated = await validateExternalUrl(url, {
        allowedDomains,
      });
      if (!validated.ok) {
        return NextResponse.json(
          { success: false, error: validated.error },
          { status: 400 }
        );
      }
      safeUrl = validated.url;
    }

    // キャッシュ確認（forceでない場合）
    if (!force && safeUrl) {
      const cached = await getCachedOcr(safeUrl);
      if (cached) {
        return NextResponse.json({
          success: true,
          text: cached.text,
          cached: true,
          cachedAt: cached.cachedAt,
        });
      }
    }

    // OCR実行
    let text = "";

    if (base64) {
      // Base64画像からOCR
      const result = await extractTextFromBase64Image(base64);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      text = result.text;
    } else if (url) {
      // URLから画像を取得してOCR
      const response = await fetch(safeUrl as string);
      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch URL: ${response.status}`,
          },
          { status: 400 }
        );
      }

      const contentType = response.headers.get("content-type") || "";

      // PDFは直接処理できないので注意
      if (contentType.includes("pdf")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Direct PDF OCR is not supported. Convert PDF pages to images first.",
          },
          { status: 400 }
        );
      }

      // 画像をBase64に変換
      const buffer = await response.arrayBuffer();
      const imageBase64 = Buffer.from(buffer).toString("base64");

      const result = await extractTextFromBase64Image(imageBase64);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      text = result.text;
    }

    // キャッシュに保存
    if (safeUrl) {
      await setCachedOcr(safeUrl, text);
    }

    return NextResponse.json({
      success: true,
      text,
      cached: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET: キャッシュの状態を確認
 *
 * Query:
 * - url: string - 確認するURL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { success: false, error: "url parameter is required" },
      { status: 400 }
    );
  }

  const hasCached = await hasCachedOcr(url);

  if (hasCached) {
    const cached = await getCachedOcr(url);
    return NextResponse.json({
      success: true,
      cached: true,
      cachedAt: cached?.cachedAt,
      textLength: cached?.text.length,
    });
  }

  return NextResponse.json({
    success: true,
    cached: false,
  });
}
