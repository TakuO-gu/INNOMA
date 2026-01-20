/**
 * 検索機能
 *
 * Artifactを直接走査して検索を実行
 * 将来的にはsearch.jsonlインデックスを使用可能
 */

import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import type { InnomaArtifact } from "../artifact/types";

const ARTIFACTS_DIR = join(process.cwd(), "data/artifacts");

export interface SearchResult {
  /** ページID: {municipality}/{path} */
  id: string;
  /** ページタイトル */
  title: string;
  /** 概要テキスト */
  summary: string;
  /** URL */
  url: string;
  /** コンテンツタイプ */
  type: "page" | "procedure" | "emergency" | "info";
  /** マッチしたキーワード */
  matchedKeywords?: string[];
  /** 関連度スコア */
  score: number;
}

export interface SearchOptions {
  /** 検索対象の自治体ID（指定しない場合は全自治体） */
  municipalityId?: string;
  /** 最大結果数 */
  limit?: number;
  /** コンテンツタイプでフィルタ */
  type?: SearchResult["type"];
}

/**
 * ディレクトリが存在するか確認
 */
async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * RichTextContentからプレーンテキストを抽出
 */
function extractPlainText(content: unknown): string {
  if (typeof content !== "string") return "";
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Artifactからタイトルを抽出
 */
function extractTitle(artifact: InnomaArtifact): string {
  // v2形式: artifact.title
  if (artifact.title) return artifact.title;

  // v1形式: Titleブロックから
  const titleBlock = artifact.blocks.find((b) => b.type === "Title");
  if (titleBlock && titleBlock.type === "Title") {
    const props = titleBlock.props as { text?: string; title?: string };
    return props.text || props.title || "無題";
  }
  return "無題";
}

/**
 * Artifactから概要を抽出
 */
function extractSummary(artifact: InnomaArtifact, maxLength = 200): string {
  // v2形式: artifact.search.summary
  if (artifact.search?.summary) {
    return artifact.search.summary.slice(0, maxLength);
  }

  // ブロックから抽出
  const textParts: string[] = [];

  for (const block of artifact.blocks) {
    const props = block.props as Record<string, unknown>;

    switch (block.type) {
      case "RichText":
        textParts.push(extractPlainText(props.content));
        break;
      case "Callout":
      case "NotificationBanner":
        if (props.title) textParts.push(String(props.title));
        textParts.push(extractPlainText(props.content));
        break;
      case "Summary":
        if (props.text) textParts.push(String(props.text));
        break;
      case "InfoTable":
      case "Table":
        if (Array.isArray(props.rows)) {
          for (const row of props.rows as Array<{ label: string; value: unknown }>) {
            textParts.push(`${row.label}: ${extractPlainText(row.value)}`);
          }
        }
        break;
    }

    if (textParts.join(" ").length >= maxLength) break;
  }

  const combined = textParts.join(" ").slice(0, maxLength);
  return combined.length === maxLength ? combined + "..." : combined;
}

/**
 * Artifactのコンテンツタイプを推定
 */
function inferContentType(artifact: InnomaArtifact): SearchResult["type"] {
  if (artifact.blocks.some((b) => b.type === "Emergency")) {
    return "emergency";
  }
  if (artifact.blocks.some((b) => b.type === "ProcedureSteps" || b.type === "StepNavigation")) {
    return "procedure";
  }
  return "page";
}

/**
 * Artifactから検索可能なテキストを生成
 */
function extractSearchableText(artifact: InnomaArtifact): string {
  const parts: string[] = [];

  // タイトル
  parts.push(extractTitle(artifact));

  // キーワード
  if (artifact.search?.keywords) {
    parts.push(...artifact.search.keywords);
  }

  // プレーンテキスト
  if (artifact.search?.plain_text) {
    parts.push(artifact.search.plain_text);
  }

  // ブロックからテキスト抽出
  for (const block of artifact.blocks) {
    const props = block.props as Record<string, unknown>;

    switch (block.type) {
      case "Title":
        parts.push(String((props as { text?: string; title?: string }).text || (props as { title?: string }).title || ""));
        break;
      case "RichText":
        parts.push(extractPlainText(props.content));
        break;
      case "Callout":
      case "NotificationBanner":
        if (props.title) parts.push(String(props.title));
        parts.push(extractPlainText(props.content));
        break;
      case "Summary":
        if (props.text) parts.push(String(props.text));
        break;
      case "InfoTable":
      case "Table":
        if (Array.isArray(props.rows)) {
          for (const row of props.rows as Array<{ label: string; value: unknown }>) {
            parts.push(row.label);
            parts.push(extractPlainText(row.value));
          }
        }
        break;
      case "ProcedureSteps":
      case "StepNavigation":
        if (Array.isArray(props.steps)) {
          for (const step of props.steps as Array<{ title: string; content?: string }>) {
            parts.push(step.title);
            if (step.content) parts.push(extractPlainText(step.content));
          }
        }
        break;
      case "Breadcrumbs":
        if (Array.isArray(props.items)) {
          for (const item of props.items as Array<{ label: string }>) {
            parts.push(item.label);
          }
        }
        break;
      case "RelatedLinks":
      case "ResourceList":
        if (Array.isArray(props.items)) {
          for (const item of props.items as Array<{ title: string; description?: string }>) {
            parts.push(item.title);
            if (item.description) parts.push(item.description);
          }
        }
        break;
    }
  }

  return parts.join(" ").toLowerCase();
}

/**
 * 検索スコアを計算
 */
function calculateScore(searchableText: string, title: string, query: string): number {
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  let score = 0;

  // タイトルに完全一致
  if (titleLower === queryLower) {
    score += 100;
  }
  // タイトルに含まれる
  else if (titleLower.includes(queryLower)) {
    score += 50;
  }

  // 本文に含まれる回数
  const matches = (searchableText.match(new RegExp(queryLower, "g")) || []).length;
  score += Math.min(matches * 5, 30);

  // クエリの各単語がマッチするか
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0);
  for (const word of queryWords) {
    if (titleLower.includes(word)) {
      score += 20;
    }
    if (searchableText.includes(word)) {
      score += 5;
    }
  }

  return score;
}

/**
 * JSONファイルを再帰的に検索
 */
async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // _で始まるディレクトリはスキップ
        if (!entry.name.startsWith("_")) {
          const subFiles = await findJsonFiles(fullPath);
          files.push(...subFiles);
        }
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // meta.json, variables.jsonはスキップ
        if (entry.name !== "meta.json" && entry.name !== "variables.json") {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // ディレクトリが存在しない場合は空配列
  }

  return files;
}

/**
 * 自治体内検索を実行
 */
export async function searchMunicipality(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { municipalityId, limit = 50, type } = options;

  if (!query.trim()) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();

  // 検索対象ディレクトリを決定
  const searchDir = municipalityId
    ? join(ARTIFACTS_DIR, municipalityId)
    : ARTIFACTS_DIR;

  if (!(await exists(searchDir))) {
    return [];
  }

  const files = await findJsonFiles(searchDir);
  const results: SearchResult[] = [];

  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      const artifact: InnomaArtifact = JSON.parse(content);

      // コンテンツタイプフィルタ
      const contentType = inferContentType(artifact);
      if (type && contentType !== type) {
        continue;
      }

      // 検索可能テキストを生成
      const searchableText = extractSearchableText(artifact);
      const title = extractTitle(artifact);

      // クエリがマッチするか確認
      if (!searchableText.includes(queryLower)) {
        continue;
      }

      // スコアを計算
      const score = calculateScore(searchableText, title, query);

      // 相対パスからURLを生成
      const relativePath = file
        .replace(ARTIFACTS_DIR + "/", "")
        .replace(/\.json$/, "");
      const pathParts = relativePath.split("/");
      const muni = pathParts[0];
      const pagePath = pathParts.slice(1).join("/");

      results.push({
        id: relativePath,
        title,
        summary: extractSummary(artifact),
        url: pagePath ? `/${muni}/${pagePath}` : `/${muni}`,
        type: contentType,
        score,
      });
    } catch {
      // パースエラーはスキップ
    }
  }

  // スコアでソート
  results.sort((a, b) => b.score - a.score);

  // 上限数で切り取り
  return results.slice(0, limit);
}

/**
 * 検索候補を取得（オートコンプリート用）
 */
export async function getSearchSuggestions(
  query: string,
  municipalityId?: string,
  limit = 5
): Promise<string[]> {
  const results = await searchMunicipality(query, { municipalityId, limit });
  return results.map((r) => r.title);
}
