#!/usr/bin/env npx tsx
/**
 * Taxonomy Overview Generator
 *
 * page-registry.json と taxonomy-classifier.ts から
 * TAXONOMY_OVERVIEW.md を自動生成するスクリプト
 *
 * Usage:
 *   npx tsx scripts/generate-taxonomy-overview.ts
 *   npm run generate:taxonomy
 */

import fs from "node:fs/promises";
import path from "node:path";

// page-registry.json の型定義
interface PageRegistryEntry {
  filePath: string;
  categories: string[];
  type?: "topic";
}

type PageRegistry = Record<string, PageRegistryEntry>;

// taxonomy-classifier.ts の型定義（抽出用）
interface TaxonomyDefinition {
  name: string;
  nameEn: string;
  description: string;
  keywords: string[];
  subtopics: string[];
}

type TaxonomyMap = Record<string, TaxonomyDefinition>;

// ファイルパス
const PAGE_REGISTRY_PATH = path.join(
  __dirname,
  "../data/artifacts/_templates/page-registry.json"
);
const TAXONOMY_CLASSIFIER_PATH = path.join(
  __dirname,
  "../lib/llm/prompts/taxonomy-classifier.ts"
);
const OUTPUT_PATH = path.join(__dirname, "../../../docs/TAXONOMY_OVERVIEW.md");

/**
 * page-registry.json を読み込む
 */
async function loadPageRegistry(): Promise<PageRegistry> {
  const content = await fs.readFile(PAGE_REGISTRY_PATH, "utf-8");
  return JSON.parse(content) as PageRegistry;
}

/**
 * taxonomy-classifier.ts から INNOMA_TAXONOMY を抽出
 * （正規表現で簡易パース）
 */
async function loadTaxonomyDefinitions(): Promise<TaxonomyMap> {
  const content = await fs.readFile(TAXONOMY_CLASSIFIER_PATH, "utf-8");

  // INNOMA_TAXONOMY オブジェクトを抽出
  const taxonomyMatch = content.match(
    /export const INNOMA_TAXONOMY = \{([\s\S]*?)\} as const;/
  );
  if (!taxonomyMatch) {
    throw new Error("INNOMA_TAXONOMY not found in taxonomy-classifier.ts");
  }

  const taxonomyStr = taxonomyMatch[1];
  const result: TaxonomyMap = {};

  // 各カテゴリを抽出
  const categoryRegex =
    /(\w+):\s*\{[^}]*name:\s*"([^"]+)"[^}]*nameEn:\s*"([^"]+)"[^}]*description:\s*"([^"]+)"[^}]*keywords:\s*\[([^\]]+)\][^}]*subtopics:\s*\[([^\]]+)\]/g;

  let match;
  while ((match = categoryRegex.exec(taxonomyStr)) !== null) {
    const [, id, name, nameEn, description, keywordsStr, subtopicsStr] = match;
    result[id] = {
      name,
      nameEn,
      description,
      keywords: keywordsStr
        .split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean),
      subtopics: subtopicsStr
        .split(",")
        .map((s) => s.trim().replace(/"/g, ""))
        .filter(Boolean),
    };
  }

  return result;
}

/**
 * カテゴリ別にページをグループ化
 */
function groupPagesByCategory(
  registry: PageRegistry
): Record<string, Array<{ slug: string; entry: PageRegistryEntry }>> {
  const grouped: Record<
    string,
    Array<{ slug: string; entry: PageRegistryEntry }>
  > = {};

  for (const [slug, entry] of Object.entries(registry)) {
    const primaryCategory = entry.categories[0] || "uncategorized";
    if (!grouped[primaryCategory]) {
      grouped[primaryCategory] = [];
    }
    grouped[primaryCategory].push({ slug, entry });
  }

  // 各カテゴリ内でスラッグ順にソート
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.slug.localeCompare(b.slug));
  }

  return grouped;
}

/**
 * マーメイドダイアグラムを生成
 */
function generateMermaidDiagram(
  grouped: Record<string, Array<{ slug: string; entry: PageRegistryEntry }>>,
  taxonomy: TaxonomyMap
): string {
  const lines: string[] = ["```mermaid", "graph TD"];

  // カテゴリ順にソート
  const sortedCategories = Object.keys(grouped).sort();

  for (const category of sortedCategories) {
    const pages = grouped[category];
    const taxDef = taxonomy[category];
    const categoryName = taxDef?.name || category;

    lines.push(`    subgraph "${categoryName} (${category})"`);
    lines.push(`        ${category}[${category}]`);

    for (const { slug, entry } of pages) {
      if (entry.type === "topic") continue; // Topic自体は親ノードとして表示済み

      // スラッグからページ名を推測（スラッグをそのまま使用）
      const nodeId = slug.replace(/-/g, "_");
      lines.push(`        ${category} --> ${nodeId}[${slug}]`);
    }

    lines.push("    end");
    lines.push("");
  }

  lines.push("```");
  return lines.join("\n");
}

/**
 * カテゴリ別テーブルを生成
 */
function generateCategoryTables(
  grouped: Record<string, Array<{ slug: string; entry: PageRegistryEntry }>>,
  taxonomy: TaxonomyMap
): string {
  const lines: string[] = [];
  const sortedCategories = Object.keys(grouped).sort();

  for (const category of sortedCategories) {
    const pages = grouped[category];
    const taxDef = taxonomy[category];
    const categoryName = taxDef?.name || category;

    lines.push(`### ${category} (${categoryName})`);
    lines.push("");
    lines.push("| スラッグ | ファイルパス | タイプ |");
    lines.push("|---------|-------------|--------|");

    for (const { slug, entry } of pages) {
      const pageType = entry.type === "topic" ? "topic" : "content";
      lines.push(`| ${slug} | ${entry.filePath} | ${pageType} |`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * タクソノミー定義テーブルを生成
 */
function generateTaxonomyTable(taxonomy: TaxonomyMap): string {
  const lines: string[] = [
    "| カテゴリID | 日本語名 | 説明 | キーワード |",
    "|-----------|---------|------|-----------|",
  ];

  const sortedCategories = Object.keys(taxonomy).sort();
  for (const id of sortedCategories) {
    const def = taxonomy[id];
    lines.push(
      `| ${id} | ${def.name} | ${def.description} | ${def.keywords.join(", ")} |`
    );
  }

  return lines.join("\n");
}

/**
 * 統計情報を計算
 */
function calculateStats(
  registry: PageRegistry,
  taxonomy: TaxonomyMap
): {
  categoryCount: number;
  contentCount: number;
  topicCount: number;
  totalCount: number;
} {
  let contentCount = 0;
  let topicCount = 0;

  for (const entry of Object.values(registry)) {
    if (entry.type === "topic") {
      topicCount++;
    } else {
      contentCount++;
    }
  }

  return {
    categoryCount: Object.keys(taxonomy).length,
    contentCount,
    topicCount,
    totalCount: contentCount + topicCount,
  };
}

/**
 * TAXONOMY_OVERVIEW.md を生成
 */
async function generateTaxonomyOverview(): Promise<void> {
  console.log("Loading page-registry.json...");
  const registry = await loadPageRegistry();

  console.log("Loading taxonomy definitions...");
  const taxonomy = await loadTaxonomyDefinitions();

  console.log("Grouping pages by category...");
  const grouped = groupPagesByCategory(registry);

  console.log("Calculating statistics...");
  const stats = calculateStats(registry, taxonomy);

  console.log("Generating markdown...");
  const timestamp = new Date().toISOString();

  const content = `# INNOMA タクソノミー・URL・ディレクトリ構造一覧

> **自動生成ファイル**: このファイルは \`npm run generate:taxonomy\` で自動更新されます。
> 手動編集しないでください。

**最終更新**: ${timestamp}

## 概要

| 項目 | 数 |
|------|-----|
| カテゴリ数 | ${stats.categoryCount} |
| Content Item数 | ${stats.contentCount} |
| Topic数 | ${stats.topicCount} |
| 総ページ数 | ${stats.totalCount} |

---

## タクソノミー構造（マーメイド）

${generateMermaidDiagram(grouped, taxonomy)}

---

## カテゴリ別ページ一覧

${generateCategoryTables(grouped, taxonomy)}

---

## タクソノミー定義

${generateTaxonomyTable(taxonomy)}

---

## ソースファイル

- **page-registry.json**: \`apps/web/data/artifacts/_templates/page-registry.json\`
- **taxonomy-classifier.ts**: \`apps/web/lib/llm/prompts/taxonomy-classifier.ts\`
- **page-registry.ts**: \`apps/web/lib/artifact/page-registry.ts\`
`;

  console.log(`Writing to ${OUTPUT_PATH}...`);
  await fs.writeFile(OUTPUT_PATH, content, "utf-8");

  console.log("\nTaxonomy Overview generated successfully!");
  console.log(`  Categories: ${stats.categoryCount}`);
  console.log(`  Content Items: ${stats.contentCount}`);
  console.log(`  Topics: ${stats.topicCount}`);
  console.log(`  Total Pages: ${stats.totalCount}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

// メイン実行
generateTaxonomyOverview().catch((err) => {
  console.error("Error generating taxonomy overview:", err);
  process.exit(1);
});
