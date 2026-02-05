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
import { getVariableStore, replaceVariablesWithSourceRefs, type VariableSourceInfo } from "@/lib/template";
import type { Source } from "./innoma-artifact-schema.v2";
import { getSlugFromFilePath } from "./page-registry";
import { getVisibilityConfig, isPageVisible } from "@/lib/visibility";

export type { InnomaArtifactValidated };
export { invalidateCache, invalidateCacheByPrefix, makeCacheKey };

/**
 * Artifact読み込み結果
 */
export type ArtifactLoadResult =
  | { success: true; artifact: InnomaArtifactValidated; cached: boolean; unreplacedVariables: string[]; sources: Source[] }
  | { success: false; error: "not_found" | "invalid_json" | "validation_failed" | "timeout" | "page_not_visible"; message: string };

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
/**
 * Artifactキーからページスラッグを抽出
 * 例: "takaoka/services/health/kokuho.json" → "kokuho"
 *     "takaoka/topics/health.json" → "health"
 */
function getSlugFromArtifactKey(key: string): string | null {
  // keyからファイルパスを抽出: "takaoka/services/health/kokuho.json" -> "services/health/kokuho"
  const parts = key.split("/");
  if (parts.length < 2) return null;

  const filePath = parts.slice(1).join("/").replace(/\.json$/, "");

  // page-registryから逆引き
  const slug = getSlugFromFilePath(filePath);
  if (slug) return slug;

  // レジストリにない場合はファイル名をスラッグとして使用
  const fileName = filePath.split("/").pop();
  return fileName ?? null;
}

async function loadArtifactInternal(
  key: string,
  options: LoadOptions = {}
): Promise<ArtifactLoadResult> {
  const { skipCache = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const startTime = Date.now();

  // Extract municipality ID from key (e.g., "takaoka/services/health/kokuho.json" -> "takaoka")
  const municipalityId = key.split("/")[0];

  // グローバル公開設定のチェック（_templates, sample は除外）
  if (!municipalityId.startsWith("_") && municipalityId !== "sample") {
    const slug = getSlugFromArtifactKey(key);
    if (slug) {
      const visibilityConfig = await getVisibilityConfig();
      if (!isPageVisible(visibilityConfig, slug)) {
        artifactLogger.debug("page_not_visible", { key, slug });
        return {
          success: false,
          error: "page_not_visible",
          message: `Page "${slug}" is not visible globally`,
        };
      }
    }
  }

  // キャッシュチェック
  if (!skipCache) {
    const cached = getFromCache<InnomaArtifactValidated>(key);
    if (cached) {
      artifactLogger.debug("cache_hit", { key });
      return { success: true, artifact: cached, cached: true, unreplacedVariables: [], sources: [] };
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

    // Load variable store for this municipality
    let processedData = data;
    let unreplacedVariables: string[] = [];
    let variableSources: VariableSourceInfo[] = [];

    try {
      const variableStore = await getVariableStore(municipalityId);
      if (Object.keys(variableStore).length > 0) {
        // 参照番号付きで変数を置換（⟦N⟧形式でマーキング）
        const replaceResult = replaceVariablesWithSourceRefs(data, variableStore, true, true);
        processedData = replaceResult.content;
        unreplacedVariables = replaceResult.unreplacedVariables;
        variableSources = replaceResult.variableSources;
        if (unreplacedVariables.length > 0) {
          artifactLogger.debug("unreplaced_variables", {
            key,
            unreplaced: unreplacedVariables,
          });
        }
      }
    } catch (e) {
      // Variable store may not exist for some municipalities, continue without it
      artifactLogger.debug("variable_store_not_found", { municipalityId, error: (e as Error).message });
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

    // 変数ソース情報をSource配列に変換
    const sources = buildSourcesFromVariables(variableSources);

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
      sourcesCount: sources.length,
    });

    return { success: true, artifact, cached: false, unreplacedVariables, sources };
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
 * Artifactではない特殊ファイルのパターン
 * これらは別スキーマで管理されるためArtifactとして読み込まない
 */
const NON_ARTIFACT_FILES = [
  "meta.json",
  "variables.json",
  "districts.json",
  "history/", // historyディレクトリ内のファイル
  "variables/", // variablesディレクトリ内のファイル
  "data/", // dataディレクトリ内のファイル（shelters.json, hazard-maps.json等）
];

/**
 * Artifact一覧を取得
 * meta.json, variables.json, districts.json などの特殊ファイルは除外
 */
export async function listArtifacts(prefix: string = ""): Promise<string[]> {
  const storage = getDefaultStorageAdapter();
  const keys = await storage.list(prefix);
  return keys.filter((k) => {
    if (!k.endsWith(".json")) return false;
    // 特殊ファイルを除外
    for (const pattern of NON_ARTIFACT_FILES) {
      if (k.endsWith(pattern) || k.includes(pattern)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 完成済みページのパス一覧を取得
 * 未取得変数がないページのみを返す
 *
 * GOV.UK方式フラットURL対応:
 *   - services/health/kokuho.json → /kokuho（page-registry経由）
 *   - topics/health.json → /health（フラット化）
 *   - index.json → /
 */
export const getCompletedPages = cache(async (municipalityId: string): Promise<Set<string>> => {
  const completedPages = new Set<string>();

  try {
    const allKeys = await listArtifacts(`${municipalityId}/`);

    // 並列で全ページをチェック
    const results = await Promise.all(
      allKeys.map(async (key) => {
        const result = await loadArtifact(key, { skipCache: false });
        if (!result.success) {
          return null;
        }

        // keyからファイルパスを抽出: "takaoka/services/health/kokuho.json" -> "services/health/kokuho"
        const filePath = key
          .replace(`${municipalityId}/`, "")
          .replace(/\.json$/, "");

        // トピックページ（ディレクトリ）は変数チェックを緩和
        // content_type: "directory" のページは未置換変数があっても完成とみなす
        const isDirectoryPage = result.artifact.content_type === "directory";

        // 通常ページは未置換変数があれば除外
        if (!isDirectoryPage && result.unreplacedVariables.length > 0) {
          return null;
        }

        // index.json → /
        if (filePath === "index") {
          return "/";
        }

        // topics/category → /category (フラットURL)
        if (filePath.startsWith("topics/")) {
          const slug = getSlugFromFilePath(filePath);
          if (slug) {
            return `/${slug}`;
          }
          // レジストリにない場合はtopics/以降をスラッグとして使用
          const parts = filePath.split("/");
          if (parts.length === 2) {
            return `/${parts[1]}`;
          }
        }

        // services/category/page → /page (フラットURL)
        if (filePath.startsWith("services/")) {
          const slug = getSlugFromFilePath(filePath);
          if (slug) {
            return `/${slug}`;
          }
          // レジストリにない場合はファイル名をスラッグとして使用
          const parts = filePath.split("/");
          if (parts.length === 3) {
            return `/${parts[2]}`;
          }
        }

        // その他はそのまま
        return `/${filePath}`;
      })
    );

    results.forEach((path) => {
      if (path !== null) {
        completedPages.add(path);
      }
    });
  } catch (e) {
    artifactLogger.error("get_completed_pages_error", { municipalityId, error: (e as Error).message });
  }

  return completedPages;
});

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

/**
 * 変数ソース情報をSource配列に変換
 * 同じURLからの変数はグループ化
 */
function buildSourcesFromVariables(variableSources: VariableSourceInfo[]): Source[] {
  // URLでグループ化
  const sourcesByUrl = new Map<string, { variables: string[]; accessedAt?: string }>();

  for (const vs of variableSources) {
    if (!vs.sourceUrl) continue;

    const existing = sourcesByUrl.get(vs.sourceUrl);
    if (existing) {
      if (!existing.variables.includes(vs.variableName)) {
        existing.variables.push(vs.variableName);
      }
    } else {
      sourcesByUrl.set(vs.sourceUrl, {
        variables: [vs.variableName],
        accessedAt: new Date().toISOString(),
      });
    }
  }

  // Source配列に変換（番号を付与）
  const sources: Source[] = [];
  let id = 1;

  for (const [url, data] of sourcesByUrl.entries()) {
    // URLからドメインとパスでタイトルを生成
    let title: string;
    try {
      const urlObj = new URL(url);
      title = urlObj.hostname + (urlObj.pathname !== "/" ? urlObj.pathname : "");
    } catch {
      title = url;
    }

    sources.push({
      id,
      url,
      title,
      accessedAt: data.accessedAt,
      variables: data.variables,
    });
    id++;
  }

  return sources;
}
