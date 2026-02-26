#!/usr/bin/env node
/**
 * フラットURL → カテゴリベースURL マイグレーションスクリプト
 *
 * JSON artifact内の "href": "/slug" を "href": "/category/slug" に変換する。
 * トピックページ（type: "topic"）のhrefは変更しない。
 *
 * Usage: node scripts/migrate-hrefs-to-category-urls.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const ARTIFACTS_DIR = path.join(__dirname, "..", "data", "artifacts");
const REGISTRY_FILE = path.join(ARTIFACTS_DIR, "_templates", "page-registry.json");

const isDryRun = process.argv.includes("--dry-run");

// page-registry.json を読み込み
const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf-8"));

// 非topicページの slug → /category/slug マッピングを構築
const slugToNewPath = new Map();
for (const [slug, entry] of Object.entries(registry)) {
  if (entry.type === "topic") continue;
  const category = entry.categories?.[0];
  if (category) {
    slugToNewPath.set(slug, `/${category}/${slug}`);
  }
}

console.log(`Registry loaded: ${Object.keys(registry).length} entries`);
console.log(`Content pages to migrate: ${slugToNewPath.size} slugs`);
if (isDryRun) console.log("DRY RUN - no files will be modified\n");

// 統計
let filesScanned = 0;
let filesModified = 0;
let hrefsChanged = 0;
const unknownSlugs = new Set();

/**
 * JSONファイル内のhrefを変換
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  let modified = false;
  let changeCount = 0;

  const newContent = content.replace(
    /"href":\s*"\/([a-z0-9][a-z0-9-]*)"/g,
    (match, slug) => {
      const newPath = slugToNewPath.get(slug);
      if (newPath) {
        modified = true;
        changeCount++;
        return `"href": "${newPath}"`;
      }
      // slugがregistryに存在するかチェック（topicページは変更不要）
      if (!registry[slug] && slug !== "index") {
        unknownSlugs.add(slug);
      }
      return match;
    }
  );

  // RichText内のマークダウンリンク href も処理
  // "link": { "href": "/slug" } パターン
  const newContent2 = newContent.replace(
    /"link":\s*\{\s*"href":\s*"\/([a-z0-9][a-z0-9-]*)"/g,
    (match, slug) => {
      const newPath = slugToNewPath.get(slug);
      if (newPath) {
        if (!modified) modified = true;
        changeCount++;
        return `"link": { "href": "${newPath}"`;
      }
      return match;
    }
  );

  filesScanned++;

  if (modified) {
    filesModified++;
    hrefsChanged += changeCount;
    if (!isDryRun) {
      fs.writeFileSync(filePath, newContent2, "utf-8");
    }
    console.log(`  ${isDryRun ? "[DRY] " : ""}Modified: ${path.relative(ARTIFACTS_DIR, filePath)} (${changeCount} hrefs)`);
  }
}

/**
 * ディレクトリを再帰的に走査してJSONファイルを処理
 */
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // variables/ ディレクトリはスキップ
      if (entry.name === "variables") continue;
      walkDir(fullPath);
    } else if (entry.name.endsWith(".json") && entry.name !== "page-registry.json") {
      processFile(fullPath);
    }
  }
}

// 全artifact ディレクトリを処理
console.log("\nProcessing artifacts...\n");
walkDir(ARTIFACTS_DIR);

// レポート
console.log("\n--- Migration Report ---");
console.log(`Files scanned: ${filesScanned}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Hrefs changed: ${hrefsChanged}`);

if (unknownSlugs.size > 0) {
  console.log(`\nUnknown slugs (not in page-registry, not topic):`);
  for (const slug of [...unknownSlugs].sort()) {
    console.log(`  - ${slug}`);
  }
}

if (isDryRun) {
  console.log("\nDRY RUN complete. Run without --dry-run to apply changes.");
}
