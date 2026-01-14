/**
 * Artifact 更新通知 Webhook
 *
 * 使用方法:
 *   POST /api/revalidate
 *   Headers:
 *     Authorization: Bearer <REVALIDATE_SECRET>
 *   Body:
 *     { "paths": ["/tokyo-shibuya/procedures/juminhyo", "/tokyo-shibuya/emergency"] }
 *
 * 環境変数:
 *   REVALIDATE_SECRET: Webhookの認証用シークレット
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { invalidateCache, invalidateCacheByPrefix } from "@/lib/artifact/loader";
import { artifactLogger } from "@/lib/artifact/logger";

// リクエストボディの型
interface RevalidateRequest {
  /** 再検証するパス（URLパス） */
  paths?: string[];
  /** 再検証するArtifactキー（ストレージキー） */
  keys?: string[];
  /** プレフィックスで一括再検証（自治体ID等） */
  prefix?: string;
}

/**
 * POST /api/revalidate
 */
export async function POST(request: NextRequest) {
  // 認証チェック
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    artifactLogger.error("revalidate_config_error", { reason: "REVALIDATE_SECRET not configured" });
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    artifactLogger.warn("revalidate_unauthorized", { reason: "Missing Authorization header" });
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7); // "Bearer " を除去
  if (token !== secret) {
    artifactLogger.warn("revalidate_unauthorized", { reason: "Invalid token" });
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // リクエストボディをパース
  let body: RevalidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { paths, keys, prefix } = body;

  if (!paths && !keys && !prefix) {
    return NextResponse.json(
      { error: "At least one of 'paths', 'keys', or 'prefix' is required" },
      { status: 400 }
    );
  }

  const results: {
    revalidatedPaths: string[];
    invalidatedKeys: string[];
    invalidatedByPrefix: number;
  } = {
    revalidatedPaths: [],
    invalidatedKeys: [],
    invalidatedByPrefix: 0,
  };

  // URLパスの再検証（Next.js ISRキャッシュ）
  if (paths && paths.length > 0) {
    for (const path of paths) {
      try {
        revalidatePath(path);
        results.revalidatedPaths.push(path);
        artifactLogger.info("revalidate_path", { path });
      } catch (e) {
        artifactLogger.error("revalidate_path_failed", { path, error: (e as Error).message });
      }
    }
  }

  // Artifactキーのキャッシュ無効化（インメモリキャッシュ）
  if (keys && keys.length > 0) {
    for (const key of keys) {
      const invalidated = invalidateCache(key);
      if (invalidated) {
        results.invalidatedKeys.push(key);
        artifactLogger.info("invalidate_key", { key });
      }
    }
  }

  // プレフィックスによる一括無効化
  if (prefix) {
    const count = invalidateCacheByPrefix(prefix);
    results.invalidatedByPrefix = count;
    artifactLogger.info("invalidate_prefix", { prefix, count });
  }

  artifactLogger.info("revalidate_complete", {
    pathCount: results.revalidatedPaths.length,
    keyCount: results.invalidatedKeys.length,
    prefixCount: results.invalidatedByPrefix,
  });

  return NextResponse.json({
    success: true,
    ...results,
  });
}

/**
 * GET /api/revalidate - ヘルスチェック用
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/revalidate",
    methods: ["POST"],
    usage: {
      paths: "Array of URL paths to revalidate (Next.js ISR)",
      keys: "Array of artifact keys to invalidate (in-memory cache)",
      prefix: "Prefix string to invalidate all matching keys",
    },
  });
}
