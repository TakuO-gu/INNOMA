#!/usr/bin/env npx tsx
/**
 * GOV.UK方式フラットURL移行スクリプト
 *
 * 実行方法:
 *   npx tsx scripts/migrate-flat-urls.ts
 *   npx tsx scripts/migrate-flat-urls.ts --dry-run  # プレビューのみ
 *
 * 処理内容:
 * 1. 全テンプレート・自治体データのhref参照をフラット化
 *    - /services/health/kokuho → /kokuho
 *    - /topics/health → /health
 * 2. path フィールドの更新
 * 3. Breadcrumbsの更新（/services/health → /health）
 */

import * as fs from "fs";
import * as path from "path";

const ARTIFACTS_DIR = path.join(__dirname, "../apps/web/data/artifacts");
const DRY_RUN = process.argv.includes("--dry-run");

interface MigrationStats {
  filesProcessed: number;
  hrefsUpdated: number;
  pathsUpdated: number;
  breadcrumbsUpdated: number;
  topicsUpdated: number;
  errors: string[];
}

const stats: MigrationStats = {
  filesProcessed: 0,
  hrefsUpdated: 0,
  pathsUpdated: 0,
  breadcrumbsUpdated: 0,
  topicsUpdated: 0,
  errors: [],
};

/**
 * /services/category/page → /page に変換
 */
function flattenServiceHref(href: string): string {
  // /services/category/page → /page
  const match = href.match(/^\/services\/[^/]+\/(.+)$/);
  if (match) {
    return `/${match[1]}`;
  }
  return href;
}

/**
 * /services/category → /category に変換（Breadcrumbs用）
 */
function convertServiceCategoryToFlat(href: string): string {
  // /services/category → /category
  const match = href.match(/^\/services\/([^/]+)$/);
  if (match) {
    return `/${match[1]}`;
  }
  return href;
}

/**
 * /topics/category → /category に変換
 */
function flattenTopicHref(href: string): string {
  // /topics/category → /category
  const match = href.match(/^\/topics\/([^/]+)$/);
  if (match) {
    return `/${match[1]}`;
  }
  return href;
}

/**
 * JSON内のhref参照を再帰的に更新
 */
function updateHrefs(obj: unknown, context: string): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) => updateHrefs(item, `${context}[${i}]`));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === "href" && typeof value === "string") {
        const original = value;
        let updated = value;

        // /services/category/page → /page
        if (value.match(/^\/services\/[^/]+\/[^/]+$/)) {
          updated = flattenServiceHref(value);
          if (updated !== original) {
            stats.hrefsUpdated++;
            console.log(`  href: ${original} → ${updated}`);
          }
        }
        // Breadcrumbs用: /services/category → /category
        else if (value.match(/^\/services\/[^/]+$/)) {
          updated = convertServiceCategoryToFlat(value);
          if (updated !== original) {
            stats.breadcrumbsUpdated++;
            console.log(`  breadcrumb: ${original} → ${updated}`);
          }
        }
        // /topics/category → /category
        else if (value.match(/^\/topics\/[^/]+$/)) {
          updated = flattenTopicHref(value);
          if (updated !== original) {
            stats.topicsUpdated++;
            console.log(`  topic: ${original} → ${updated}`);
          }
        }

        result[key] = updated;
      } else if (key === "path" && typeof value === "string") {
        // pathフィールドも更新
        const original = value;
        let updated = value;

        if (value.match(/^\/services\/[^/]+\/[^/]+$/)) {
          updated = flattenServiceHref(value);
          if (updated !== original) {
            stats.pathsUpdated++;
            console.log(`  path: ${original} → ${updated}`);
          }
        }

        result[key] = updated;
      } else {
        result[key] = updateHrefs(value, `${context}.${key}`);
      }
    }
    return result;
  }

  return obj;
}

/**
 * JSONファイルを処理
 */
function processJsonFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(content);

    const relativePath = path.relative(ARTIFACTS_DIR, filePath);
    console.log(`\nProcessing: ${relativePath}`);

    const updated = updateHrefs(json, "root");
    stats.filesProcessed++;

    if (!DRY_RUN) {
      const newContent = JSON.stringify(updated, null, 2) + "\n";
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`  ✓ Updated`);
      }
    }
  } catch (error) {
    const message = `Error processing ${filePath}: ${error}`;
    stats.errors.push(message);
    console.error(`  ✗ ${message}`);
  }
}

/**
 * ディレクトリを再帰的に処理
 */
function processDirectory(dirPath: string): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // スキップするディレクトリ
    if (entry.isDirectory()) {
      // variablesディレクトリはスキップ
      if (entry.name === "variables" || entry.name === "history" || entry.name === "data") {
        continue;
      }
      // _drafts, _jobs はスキップ
      if (entry.name.startsWith("_") && entry.name !== "_templates") {
        continue;
      }
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      // meta.json, page-registry.json はスキップ
      if (entry.name === "meta.json" || entry.name === "page-registry.json") {
        continue;
      }
      processJsonFile(fullPath);
    }
  }
}

/**
 * メイン処理
 */
function main(): void {
  console.log("=".repeat(60));
  console.log("GOV.UK方式フラットURL移行スクリプト");
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN モード - ファイルは変更されません\n");
  }

  // テンプレートを処理
  const templatesDir = path.join(ARTIFACTS_DIR, "_templates");
  if (fs.existsSync(templatesDir)) {
    console.log("\n--- Processing _templates ---");
    processDirectory(templatesDir);
  }

  // 各自治体ディレクトリを処理
  const entries = fs.readdirSync(ARTIFACTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith("_")) {
      console.log(`\n--- Processing ${entry.name} ---`);
      processDirectory(path.join(ARTIFACTS_DIR, entry.name));
    }
  }

  // 結果サマリー
  console.log("\n" + "=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Files processed:     ${stats.filesProcessed}`);
  console.log(`hrefs updated:       ${stats.hrefsUpdated}`);
  console.log(`paths updated:       ${stats.pathsUpdated}`);
  console.log(`breadcrumbs updated: ${stats.breadcrumbsUpdated}`);
  console.log(`topics updated:      ${stats.topicsUpdated}`);
  console.log(`Errors:              ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\nErrors:");
    stats.errors.forEach((err) => console.log(`  - ${err}`));
  }

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN完了 - 実際に変更するには --dry-run を外して再実行");
  } else {
    console.log("\n✓ Migration completed!");
  }
}

main();
