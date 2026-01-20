/**
 * Artifact キャッシュ戦略
 *
 * キーフォーマット: {municipality_id}/{path}
 *   例: tokyo-shibuya/procedures/住民票.json
 *
 * キャッシュポリシー:
 *   - 通常コンテンツ: TTL 5分（ISRと連動）
 *   - Emergency系: TTL 30秒 or キャッシュ無効
 */

import type { InnomaArtifactValidated } from "./schema";

// 汎用Artifact型（v1/v2両対応）
type AnyArtifact = InnomaArtifactValidated;

// キャッシュ設定
export const CACHE_CONFIG = {
  /** 通常コンテンツのTTL（ミリ秒） */
  DEFAULT_TTL_MS: 5 * 60 * 1000, // 5分

  /** Emergency系コンテンツのTTL（ミリ秒） */
  EMERGENCY_TTL_MS: 30 * 1000, // 30秒

  /** 最大キャッシュエントリ数 */
  MAX_ENTRIES: 1000,
} as const;

// キャッシュエントリ
interface CacheEntry<T> {
  data: T;
  createdAt: number;
  ttlMs: number;
}

// インメモリキャッシュ（Edgeランタイム対応）
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Artifactにemergencyブロックが含まれているか判定
 */
export function hasEmergencyContent(artifact: AnyArtifact): boolean {
  return artifact.blocks.some((block: { type: string }) =>
    block.type === "Emergency" || block.type === "EmergencyBanner"
  );
}

/**
 * Artifactに高優先度（critical/high）のemergencyがあるか判定
 */
export function hasHighPriorityEmergency(artifact: AnyArtifact): boolean {
  return artifact.blocks.some(
    (block: { type: string; props: Record<string, unknown> }) =>
      (block.type === "Emergency" || block.type === "EmergencyBanner") &&
      (block.props.severity === "critical" ||
       block.props.severity === "high")
  );
}

/**
 * Artifactに基づいて適切なTTLを決定
 */
export function getTTLForArtifact(artifact: AnyArtifact): number {
  if (hasHighPriorityEmergency(artifact)) {
    return 0; // キャッシュ無効
  }
  if (hasEmergencyContent(artifact)) {
    return CACHE_CONFIG.EMERGENCY_TTL_MS;
  }
  return CACHE_CONFIG.DEFAULT_TTL_MS;
}

/**
 * キャッシュキーを生成
 * @param municipalityId 自治体ID
 * @param path パス（オプション）
 */
export function makeCacheKey(municipalityId: string, path?: string): string {
  if (path) {
    return `${municipalityId}/${path}`;
  }
  return municipalityId;
}

/**
 * キャッシュからデータを取得
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  // TTL チェック
  const now = Date.now();
  if (now - entry.createdAt > entry.ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * キャッシュにデータを保存
 */
export function setInCache<T>(key: string, data: T, ttlMs: number = CACHE_CONFIG.DEFAULT_TTL_MS): void {
  // TTL が 0 以下ならキャッシュしない
  if (ttlMs <= 0) {
    return;
  }

  // 最大エントリ数チェック（LRUではなく単純削除）
  if (cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
    // 最も古いエントリを削除
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [k, v] of cache.entries()) {
      if (v.createdAt < oldestTime) {
        oldestTime = v.createdAt;
        oldestKey = k;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    data,
    createdAt: Date.now(),
    ttlMs,
  });
}

/**
 * 特定キーのキャッシュを無効化（手動パージ）
 */
export function invalidateCache(key: string): boolean {
  return cache.delete(key);
}

/**
 * プレフィックスに一致するキャッシュを一括無効化
 */
export function invalidateCacheByPrefix(prefix: string): number {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}

/**
 * 全キャッシュをクリア
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * キャッシュ統計を取得
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  keys: string[];
} {
  return {
    size: cache.size,
    maxSize: CACHE_CONFIG.MAX_ENTRIES,
    keys: Array.from(cache.keys()),
  };
}

/**
 * 期限切れエントリをクリーンアップ
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let count = 0;

  for (const [key, entry] of cache.entries()) {
    if (now - entry.createdAt > entry.ttlMs) {
      cache.delete(key);
      count++;
    }
  }

  return count;
}
