/**
 * 変数→ページマッピング
 *
 * 各変数がどのページで使用されているかを管理
 */

import { promises as fs } from "fs";
import path from "path";
import { VariablePageMap } from "./types";

const ARTIFACTS_PATH =
  process.env.STORAGE_BASE_PATH || "./data/artifacts";
const TEMPLATES_PATH = path.join(ARTIFACTS_PATH, "_templates");
const MAP_FILE_PATH = path.join(TEMPLATES_PATH, "variable-page-map.json");

/**
 * キャッシュされたマッピング
 */
let cachedMap: VariablePageMap | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1時間

/**
 * 変数→ページマッピングを取得
 */
export async function getVariablePageMap(): Promise<VariablePageMap> {
  // キャッシュが有効な場合はキャッシュを返す
  if (cachedMap && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedMap;
  }

  try {
    const content = await fs.readFile(MAP_FILE_PATH, "utf-8");
    cachedMap = JSON.parse(content) as VariablePageMap;
    cacheTimestamp = Date.now();
    return cachedMap;
  } catch {
    // ファイルがない場合は生成
    cachedMap = await generateVariablePageMap();
    cacheTimestamp = Date.now();
    return cachedMap;
  }
}

/**
 * 変数→ページマッピングを生成
 */
export async function generateVariablePageMap(): Promise<VariablePageMap> {
  const map: VariablePageMap = {};

  // テンプレートディレクトリからJSONファイルを再帰的に検索
  await scanDirectory(TEMPLATES_PATH, "", map);

  // マッピングを保存
  await saveVariablePageMap(map);

  return map;
}

/**
 * ディレクトリを再帰的にスキャン
 */
async function scanDirectory(
  basePath: string,
  relativePath: string,
  map: VariablePageMap
): Promise<void> {
  const currentPath = path.join(basePath, relativePath);

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      // 変数ディレクトリはスキップ
      if (entry.name === "variables" || entry.name === "variable-page-map.json") {
        continue;
      }

      const entryRelativePath = relativePath
        ? path.join(relativePath, entry.name)
        : entry.name;

      if (entry.isDirectory()) {
        await scanDirectory(basePath, entryRelativePath, map);
      } else if (entry.name.endsWith(".json")) {
        await scanJsonFile(basePath, entryRelativePath, map);
      }
    }
  } catch {
    // ディレクトリが存在しない場合は無視
  }
}

/**
 * JSONファイルをスキャンして変数を抽出
 */
async function scanJsonFile(
  basePath: string,
  relativePath: string,
  map: VariablePageMap
): Promise<void> {
  const filePath = path.join(basePath, relativePath);

  try {
    const content = await fs.readFile(filePath, "utf-8");

    // {{variable_name}} 形式の変数を抽出
    const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1];

      // ページパスを計算（.jsonを除去し、index.jsonの場合はディレクトリパスを使用）
      let pagePath = relativePath.replace(/\.json$/, "");
      if (pagePath.endsWith("/index")) {
        pagePath = pagePath.slice(0, -6) || "/";
      }

      // マッピングに追加
      if (!map[variableName]) {
        map[variableName] = [];
      }

      if (!map[variableName].includes(pagePath)) {
        map[variableName].push(pagePath);
      }
    }
  } catch {
    // ファイル読み込みエラーは無視
  }
}

/**
 * 変数→ページマッピングを保存
 */
export async function saveVariablePageMap(map: VariablePageMap): Promise<void> {
  // ディレクトリが存在しない場合は作成
  await fs.mkdir(path.dirname(MAP_FILE_PATH), { recursive: true });

  // 変数名でソートして保存
  const sortedMap: VariablePageMap = {};
  const sortedKeys = Object.keys(map).sort();
  for (const key of sortedKeys) {
    sortedMap[key] = map[key].sort();
  }

  await fs.writeFile(MAP_FILE_PATH, JSON.stringify(sortedMap, null, 2), "utf-8");
}

/**
 * キャッシュをクリア
 */
export function clearVariablePageMapCache(): void {
  cachedMap = null;
  cacheTimestamp = 0;
}

/**
 * 特定の変数を使用しているページを取得
 */
export async function getPagesUsingVariable(
  variableName: string
): Promise<string[]> {
  const map = await getVariablePageMap();
  return map[variableName] || [];
}

/**
 * 特定のページで使用されている変数を取得
 */
export async function getVariablesInPage(pagePath: string): Promise<string[]> {
  const map = await getVariablePageMap();
  const variables: string[] = [];

  for (const [variableName, pages] of Object.entries(map)) {
    if (pages.includes(pagePath)) {
      variables.push(variableName);
    }
  }

  return variables;
}
