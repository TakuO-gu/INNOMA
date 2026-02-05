/**
 * Content-Item 公開設定のストレージ操作
 */

import { promises as fs } from "fs";
import path from "path";
import type {
  VisibilityConfig,
  PageInfo,
} from "./types";

const ARTIFACTS_DIR = path.join(process.cwd(), "data/artifacts");
const CONFIG_DIR = path.join(ARTIFACTS_DIR, "_config");
const VISIBILITY_FILE = path.join(CONFIG_DIR, "visibility.json");
const PAGE_REGISTRY_FILE = path.join(ARTIFACTS_DIR, "_templates/page-registry.json");

/**
 * デフォルトの公開設定
 */
const DEFAULT_CONFIG: VisibilityConfig = {
  updatedAt: new Date().toISOString(),
  pages: {},
  defaultVisibility: true,
};

/**
 * 公開設定を読み込む
 */
export async function getVisibilityConfig(): Promise<VisibilityConfig> {
  try {
    const content = await fs.readFile(VISIBILITY_FILE, "utf-8");
    return JSON.parse(content) as VisibilityConfig;
  } catch {
    // ファイルが存在しない場合はデフォルト設定を返す
    return DEFAULT_CONFIG;
  }
}

/**
 * 公開設定を保存する
 */
export async function saveVisibilityConfig(
  config: VisibilityConfig
): Promise<void> {
  // ディレクトリがなければ作成
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  config.updatedAt = new Date().toISOString();
  await fs.writeFile(
    VISIBILITY_FILE,
    JSON.stringify(config, null, 2),
    "utf-8"
  );
}

/**
 * ページの公開状態を取得する
 */
export function isPageVisible(
  config: VisibilityConfig,
  slug: string
): boolean {
  const pageConfig = config.pages[slug];
  if (pageConfig !== undefined) {
    return pageConfig.visible;
  }
  return config.defaultVisibility;
}

/**
 * 複数ページの公開設定を更新する
 */
export async function updatePagesVisibility(
  pages: Record<string, { visible: boolean }>
): Promise<VisibilityConfig> {
  const config = await getVisibilityConfig();

  for (const [slug, { visible }] of Object.entries(pages)) {
    config.pages[slug] = { visible };
  }

  await saveVisibilityConfig(config);
  return config;
}

/**
 * カテゴリ内の全ページの公開設定を更新する
 */
export async function updateCategoryVisibility(
  category: string,
  visible: boolean
): Promise<{ config: VisibilityConfig; updatedPages: string[] }> {
  const config = await getVisibilityConfig();
  const registry = await getPageRegistry();

  const updatedPages: string[] = [];

  for (const [slug, entry] of Object.entries(registry)) {
    if (entry.categories?.includes(category)) {
      config.pages[slug] = { visible };
      updatedPages.push(slug);
    }
  }

  await saveVisibilityConfig(config);
  return { config, updatedPages };
}

/**
 * page-registry.json を読み込む
 */
interface PageRegistryEntry {
  filePath: string;
  categories?: string[];
  type?: "topic";
}

type PageRegistry = Record<string, PageRegistryEntry>;

export async function getPageRegistry(): Promise<PageRegistry> {
  const content = await fs.readFile(PAGE_REGISTRY_FILE, "utf-8");
  return JSON.parse(content) as PageRegistry;
}

/**
 * 全ページ情報を公開設定付きで取得する
 */
export async function getAllPagesWithVisibility(): Promise<PageInfo[]> {
  const config = await getVisibilityConfig();
  const registry = await getPageRegistry();

  const pages: PageInfo[] = [];

  for (const [slug, entry] of Object.entries(registry)) {
    pages.push({
      slug,
      categories: entry.categories ?? [],
      type: entry.type,
      visible: isPageVisible(config, slug),
    });
  }

  // スラッグでソート
  pages.sort((a, b) => a.slug.localeCompare(b.slug));

  return pages;
}

/**
 * 全カテゴリを取得する
 */
export async function getAllCategories(): Promise<string[]> {
  const registry = await getPageRegistry();
  const categoriesSet = new Set<string>();

  for (const entry of Object.values(registry)) {
    for (const category of entry.categories ?? []) {
      categoriesSet.add(category);
    }
  }

  return Array.from(categoriesSet).sort();
}

/**
 * 統計情報を取得する
 */
export async function getVisibilityStats(): Promise<{
  total: number;
  visible: number;
  hidden: number;
}> {
  const pages = await getAllPagesWithVisibility();
  const visible = pages.filter((p) => p.visible).length;

  return {
    total: pages.length,
    visible,
    hidden: pages.length - visible,
  };
}
