/**
 * Artifact Loader
 *
 * キャッシュキー設計:
 *   {municipality_id}/{path}
 *   例: tokyo-shibuya/procedures/juminhyo.json
 *
 * キャッシュポリシー:
 *   - 通常コンテンツ: TTL 5分 + React cache (リクエスト単位)
 *   - Emergency系: TTL 30秒 or キャッシュ無効
 *   - 手動パージ: revalidate webhook経由
 */

import { cache } from "react";
import { getDefaultStorageAdapter } from "@/lib/storage";
import { safeValidateArtifact, type InnomaArtifactValidated } from "./schema";
import {
  getFromCache,
  setInCache,
  getTTLForArtifact,
  makeCacheKey,
  invalidateCache,
  invalidateCacheByPrefix,
  hasEmergencyContent,
} from "./cache";
import { artifactLogger } from "./logger";
import { getVariableStore, variableStoreToMapForJson, replaceVariables } from "@/lib/template";

export type { InnomaArtifactValidated };
export { invalidateCache, invalidateCacheByPrefix, makeCacheKey };

/**
 * Artifact読み込み結果
 */
export type ArtifactLoadResult =
  | { success: true; artifact: InnomaArtifactValidated; cached: boolean }
  | { success: false; error: "not_found" | "invalid_json" | "validation_failed" | "timeout"; message: string };

/**
 * ロードオプション
 */
export interface LoadOptions {
  /** キャッシュをスキップするか */
  skipCache?: boolean;
  /** タイムアウト（ミリ秒） */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10000; // 10秒

/**
 * Artifactを読み込む（キャッシュ対応）
 */
async function loadArtifactInternal(
  key: string,
  options: LoadOptions = {}
): Promise<ArtifactLoadResult> {
  const { skipCache = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const startTime = Date.now();

  // キャッシュチェック
  if (!skipCache) {
    const cached = getFromCache<InnomaArtifactValidated>(key);
    if (cached) {
      artifactLogger.debug("cache_hit", { key });
      return { success: true, artifact: cached, cached: true };
    }
  }

  const storage = getDefaultStorageAdapter();

  try {
    // タイムアウト付きfetch
    const fetchPromise = storage.get(key);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    );

    let data: string | null;
    try {
      data = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      if ((e as Error).message === "Timeout") {
        artifactLogger.error("load_timeout", { key, timeoutMs });
        return {
          success: false,
          error: "timeout",
          message: `Artifact load timeout: ${key} (${timeoutMs}ms)`,
        };
      }
      throw e;
    }

    if (data === null) {
      artifactLogger.warn("not_found", { key });
      return {
        success: false,
        error: "not_found",
        message: `Artifact not found: ${key}`,
      };
    }

    // Extract municipality ID from key (e.g., "takaoka/services/environment/gomi.json" -> "takaoka")
    const municipalityId = key.split("/")[0];

    // Load variable store for this municipality (with JSON-safe escaping)
    let variableMap: Record<string, string> = {};
    try {
      const variableStore = await getVariableStore(municipalityId);
      variableMap = variableStoreToMapForJson(variableStore);
    } catch (e) {
      // Variable store may not exist for some municipalities, continue without it
      artifactLogger.debug("variable_store_not_found", { municipalityId, error: (e as Error).message });
    }

    // Replace variables in the raw JSON string before parsing
    let processedData = data;
    if (Object.keys(variableMap).length > 0) {
      const replaceResult = replaceVariables(data, variableMap);
      processedData = replaceResult.content;
      if (replaceResult.unreplacedVariables.length > 0) {
        artifactLogger.debug("unreplaced_variables", {
          key,
          unreplaced: replaceResult.unreplacedVariables,
        });
      }
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(processedData);
    } catch (e) {
      artifactLogger.error("invalid_json", { key, error: (e as Error).message });
      return {
        success: false,
        error: "invalid_json",
        message: `Invalid JSON in artifact: ${key}`,
      };
    }

    const result = safeValidateArtifact(parsed);
    if (!result.success) {
      artifactLogger.error("validation_failed", {
        key,
        issues: result.error?.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      return {
        success: false,
        error: "validation_failed",
        message: `Schema validation failed for ${key}: ${result.error?.message}`,
      };
    }

    const artifact = result.data!;

    // TTLを決定してキャッシュに保存
    const ttl = getTTLForArtifact(artifact);
    if (ttl > 0 && !skipCache) {
      setInCache(key, artifact, ttl);
    }

    const loadTimeMs = Date.now() - startTime;
    artifactLogger.info("load_success", {
      key,
      loadTimeMs,
      hasEmergency: hasEmergencyContent(artifact),
      ttl,
    });

    return { success: true, artifact, cached: false };
  } catch (e) {
    artifactLogger.error("load_error", { key, error: (e as Error).message });
    throw new Error(`Failed to load artifact ${key}: ${(e as Error).message}`);
  }
}

/**
 * Artifactを読み込む（React cacheでリクエスト単位キャッシュ）
 * Next.js App Router向け
 */
export const loadArtifact = cache(
  (key: string, options?: LoadOptions) => loadArtifactInternal(key, options)
);

/**
 * Artifactを読み込んで、見つからない場合はthrow（notFound用）
 */
export async function loadArtifactOrThrow(
  key: string,
  options?: LoadOptions
): Promise<InnomaArtifactValidated> {
  const result = await loadArtifact(key, options);

  if (!result.success) {
    if (result.error === "not_found") {
      throw new ArtifactNotFoundError(result.message);
    }
    throw new ArtifactValidationError(result.message);
  }

  return result.artifact;
}

/**
 * 複数のArtifactを並列読み込み
 */
export async function loadArtifacts(
  keys: string[],
  options?: LoadOptions
): Promise<Map<string, ArtifactLoadResult>> {
  const results = await Promise.all(
    keys.map(async (key) => [key, await loadArtifact(key, options)] as const)
  );
  return new Map(results);
}

/**
 * Artifact一覧を取得
 */
export async function listArtifacts(prefix: string = ""): Promise<string[]> {
  const storage = getDefaultStorageAdapter();
  const keys = await storage.list(prefix);
  return keys.filter((k) => k.endsWith(".json"));
}

// Custom Errors
export class ArtifactNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArtifactNotFoundError";
  }
}

export class ArtifactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArtifactValidationError";
  }
}
