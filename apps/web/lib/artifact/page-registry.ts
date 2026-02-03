/**
 * Page Registry - GOV.UK式フラットURL対応
 *
 * URLスラッグからファイルパスを解決するためのマッピング層
 * 例: "kokuho" → "services/health/kokuho"
 */

import { cache } from "react";
import pageRegistryData from "@/data/artifacts/_templates/page-registry.json";

/**
 * ページレジストリのエントリ
 */
export interface PageRegistryEntry {
  /** ファイルパス（.json拡張子なし）例: "services/health/kokuho" */
  filePath: string;
  /** 所属カテゴリ（複数可） */
  categories: string[];
}

/**
 * ページレジストリ全体の型
 */
export type PageRegistry = Record<string, PageRegistryEntry>;

/**
 * ページレジストリを取得（キャッシュ付き）
 */
export const getPageRegistry = cache((): PageRegistry => {
  return pageRegistryData as PageRegistry;
});

/**
 * フラットなページスラッグからファイルパスを解決
 *
 * @param slug - ページスラッグ（例: "kokuho"）
 * @returns ファイルパス（例: "services/health/kokuho"）、見つからない場合はnull
 */
export function resolvePagePath(slug: string): string | null {
  const registry = getPageRegistry();
  const entry = registry[slug];
  return entry?.filePath ?? null;
}

/**
 * ページスラッグがレジストリに存在するか確認
 *
 * @param slug - ページスラッグ
 * @returns 存在すればtrue
 */
export function isRegisteredPage(slug: string): boolean {
  const registry = getPageRegistry();
  return slug in registry;
}

/**
 * ページのカテゴリを取得
 *
 * @param slug - ページスラッグ
 * @returns カテゴリの配列、見つからない場合は空配列
 */
export function getPageCategories(slug: string): string[] {
  const registry = getPageRegistry();
  const entry = registry[slug];
  return entry?.categories ?? [];
}

/**
 * ファイルパスからスラッグを逆引き
 *
 * @param filePath - ファイルパス（例: "services/health/kokuho"）
 * @returns スラッグ（例: "kokuho"）、見つからない場合はnull
 */
export function getSlugFromFilePath(filePath: string): string | null {
  const registry = getPageRegistry();
  for (const [slug, entry] of Object.entries(registry)) {
    if (entry.filePath === filePath) {
      return slug;
    }
  }
  return null;
}

/**
 * URLパスをArtifactキーに変換
 *
 * GOV.UK式フラットURL対応:
 * - /kokuho → services/health/kokuho.json
 * - /health → topics/health.json（トピックもフラット）
 * - / → index.json
 *
 * @param pathSegments - URLのパスセグメント配列
 * @returns Artifactファイルパス（.json拡張子なし）
 */
export function resolveArtifactPath(pathSegments: string[]): string | null {
  // ホームページ
  if (pathSegments.length === 0) {
    return "index";
  }

  // 旧形式 /topics/* もサポート（後方互換性）
  if (pathSegments[0] === "topics" && pathSegments.length === 2) {
    return `topics/${pathSegments[1]}`;
  }

  // 旧形式 /services/* もサポート（後方互換性）
  if (pathSegments[0] === "services" && pathSegments.length === 3) {
    return `services/${pathSegments[1]}/${pathSegments[2]}`;
  }

  // フラットURL: /kokuho → services/health/kokuho, /health → topics/health
  if (pathSegments.length === 1) {
    const slug = pathSegments[0];
    const filePath = resolvePagePath(slug);
    if (filePath) {
      return filePath;
    }
    // レジストリにない場合はそのまま（将来の拡張用）
    return slug;
  }

  // その他のパスはそのまま結合
  return pathSegments.join("/");
}
