#!/usr/bin/env npx tsx
/**
 * 検索インデックス生成スクリプト
 *
 * Artifactを走査してsearch.jsonlを生成
 *
 * Usage:
 *   npx tsx scripts/build-search-index.ts [input-dir] [output-file]
 *   npm run build:search-index
 *
 * 出力形式 (JSONL):
 *   {"id": "tokyo-shibuya/procedures/juminhyo", "municipality": "渋谷区", "title": "住民票", "content": "...", "type": "procedure", "keywords": [...]}
 *
 * インデックスキー設計:
 *   - id: {municipality_id}/{path} （グローバルユニーク）
 *   - municipality: 自治体名（自治体内検索用）
 *   - type: コンテンツタイプ（フィルタ用）
 *   - keywords: 検索用キーワード（将来の全文検索用）
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { InnomaArtifact, InnomaBlock } from "../lib/artifact/types";

// 検索インデックスエントリの型
interface SearchIndexEntry {
  /** グローバルユニークID: {municipality_id}/{path} */
  id: string;
  /** 自治体名（自治体内検索用） */
  municipality: string;
  /** 都道府県（横断検索用） */
  prefecture?: string;
  /** タイトル */
  title: string;
  /** 概要テキスト */
  content: string;
  /** コンテンツタイプ */
  type: "page" | "procedure" | "emergency" | "info";
  /** 検索用キーワード */
  keywords: string[];
  /** 最終更新日 */
  lastModified?: string;
  /** Emergency優先度 */
  priority?: "critical" | "high" | "medium" | "low";
}

/**
 * RichTextContentからプレーンテキストを抽出
 */
function extractPlainText(content: string): string {
  // HTMLタグを除去
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ブロックからタイトルを抽出
 */
function extractTitle(blocks: InnomaBlock[]): string {
  const titleBlock = blocks.find((b) => b.type === "Title");
  if (titleBlock && titleBlock.type === "Title") {
    // v2: props.text, v1: props.title
    const props = titleBlock.props as { text?: string; title?: string };
    return props.text || props.title || "無題";
  }
  return "無題";
}

/**
 * ブロックからコンテンツタイプを推定
 */
function inferContentType(blocks: InnomaBlock[]): SearchIndexEntry["type"] {
  if (blocks.some((b) => b.type === "Emergency")) {
    return "emergency";
  }
  if (blocks.some((b) => b.type === "ProcedureSteps")) {
    return "procedure";
  }
  return "page";
}

/**
 * ブロックから概要テキストを生成
 */
function extractSummary(blocks: InnomaBlock[], maxLength = 200): string {
  const textParts: string[] = [];

  for (const block of blocks) {
    const props = block.props as Record<string, unknown>;
    switch (block.type) {
      case "RichText":
        textParts.push(extractPlainText(props.content as string));
        break;
      case "Callout":
      case "NotificationBanner":
        if (props.title) {
          textParts.push(props.title as string);
        }
        textParts.push(extractPlainText(props.content as string));
        break;
      case "InfoTable":
      case "Table":
        if (Array.isArray(props.rows)) {
          for (const row of props.rows as Array<{ label: string; value: unknown }>) {
            textParts.push(`${row.label}: ${extractPlainText(row.value as string)}`);
          }
        }
        break;
      case "ProcedureSteps":
      case "StepNavigation":
        if (Array.isArray(props.steps)) {
          for (const step of props.steps as Array<{ title: string; content?: string; body?: unknown }>) {
            textParts.push(step.title);
            if (step.content) textParts.push(extractPlainText(step.content));
          }
        }
        break;
      case "Emergency":
        if (props.title) textParts.push(props.title as string);
        if (props.content) textParts.push(extractPlainText(props.content as string));
        break;
      case "Summary":
        if (props.text) textParts.push(props.text as string);
        break;
    }
  }

  const combined = textParts.join(" ").slice(0, maxLength);
  return combined.length === maxLength ? combined + "..." : combined;
}

/**
 * ブロックからキーワードを抽出
 */
function extractKeywords(blocks: InnomaBlock[]): string[] {
  const keywords = new Set<string>();

  for (const block of blocks) {
    const props = block.props as Record<string, unknown>;
    switch (block.type) {
      case "Title": {
        // v2: props.text, v1: props.title
        const title = (props.text as string) || (props.title as string);
        if (title) keywords.add(title);
        break;
      }
      case "Breadcrumbs":
        if (Array.isArray(props.items)) {
          for (const item of props.items as Array<{ label: string }>) {
            keywords.add(item.label);
          }
        }
        break;
      case "RelatedLinks":
      case "ResourceList":
        if (Array.isArray(props.items)) {
          for (const item of props.items as Array<{ title: string }>) {
            keywords.add(item.title);
          }
        }
        break;
      case "ProcedureSteps":
      case "StepNavigation":
        if (Array.isArray(props.steps)) {
          for (const step of props.steps as Array<{ title: string; checklist?: string[] }>) {
            keywords.add(step.title);
            if (step.checklist) {
              for (const item of step.checklist) {
                keywords.add(item);
              }
            }
          }
        }
        break;
      case "Emergency":
        if (props.title) keywords.add(props.title as string);
        if (props.type) keywords.add(props.type as string);
        if (Array.isArray(props.affectedAreas)) {
          for (const area of props.affectedAreas as string[]) {
            keywords.add(area);
          }
        }
        break;
    }
  }

  return Array.from(keywords);
}

/**
 * Emergency優先度を取得
 */
function getEmergencyPriority(blocks: InnomaBlock[]): SearchIndexEntry["priority"] {
  const emergencyBlock = blocks.find((b) => b.type === "Emergency");
  if (emergencyBlock && emergencyBlock.type === "Emergency") {
    const props = emergencyBlock.props as { severity?: "critical" | "high" | "medium" | "low" };
    return props.severity;
  }
  return undefined;
}

/**
 * JSONファイルを再帰的に検索
 */
async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findJsonFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return files;
}

/**
 * Artifactファイルからインデックスエントリを生成
 */
async function processArtifact(
  filePath: string,
  baseDir: string
): Promise<SearchIndexEntry | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const artifact: InnomaArtifact = JSON.parse(content);

    // IDを生成（ベースディレクトリからの相対パス、拡張子なし）
    const relativePath = path.relative(baseDir, filePath);
    const id = relativePath.replace(/\.json$/, "");

    // 自治体IDを抽出（最初のディレクトリ名）
    const municipalityId = id.split("/")[0];

    // v2: artifact直下のフィールド、v1: metadataフィールド
    const artifactAny = artifact as Record<string, unknown>;
    const metadata = artifactAny.metadata as Record<string, string> | undefined;

    const entry: SearchIndexEntry = {
      id,
      municipality: artifact.title || metadata?.municipality || municipalityId,
      prefecture: metadata?.prefecture,
      title: artifact.title || extractTitle(artifact.blocks),
      content: artifact.search?.summary || extractSummary(artifact.blocks),
      type: inferContentType(artifact.blocks),
      keywords: artifact.search?.keywords || extractKeywords(artifact.blocks),
      lastModified: artifact.source?.fetched_at || metadata?.lastModified,
      priority: getEmergencyPriority(artifact.blocks),
    };

    return entry;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, (error as Error).message);
    return null;
  }
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  const inputDir = process.argv[2] || "./data/artifacts";
  const outputFile = process.argv[3] || "./data/search.jsonl";

  console.log(`\n🔍 Building search index from: ${inputDir}\n`);

  const files = await findJsonFiles(inputDir);

  if (files.length === 0) {
    console.log("No artifact files found.");
    return;
  }

  console.log(`Found ${files.length} artifact files.`);

  const entries: SearchIndexEntry[] = [];

  for (const file of files) {
    const entry = await processArtifact(file, inputDir);
    if (entry) {
      entries.push(entry);
      console.log(`✅ ${entry.id} (${entry.type})`);
    }
  }

  // 出力ディレクトリを作成
  await fs.mkdir(path.dirname(outputFile), { recursive: true });

  // JSONL形式で出力
  const jsonlContent = entries.map((e) => JSON.stringify(e)).join("\n");
  await fs.writeFile(outputFile, jsonlContent + "\n", "utf-8");

  console.log(`\n📊 Results:`);
  console.log(`  Total entries: ${entries.length}`);
  console.log(`  By type:`);

  const byType = entries.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  for (const [type, count] of Object.entries(byType)) {
    console.log(`    ${type}: ${count}`);
  }

  console.log(`\n✅ Search index written to: ${outputFile}\n`);
}

main().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
