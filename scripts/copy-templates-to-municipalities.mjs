#!/usr/bin/env node
/**
 * テンプレートから各自治体にコンテンツをコピーするスクリプト
 *
 * Usage: node scripts/copy-templates-to-municipalities.mjs [municipality-id]
 *
 * Examples:
 *   node scripts/copy-templates-to-municipalities.mjs        # 全自治体
 *   node scripts/copy-templates-to-municipalities.mjs atami  # 熱海市のみ
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = path.join(__dirname, '../apps/web/data/artifacts');
const TEMPLATES_DIR = path.join(ARTIFACTS_DIR, '_templates');

// 不完全な自治体リスト（meta.jsonを持つもの）
const MUNICIPALITIES = {
  atami: '熱海市',
  choshi: '銚子市',
  hakone: '箱根町',
  hayakawa: '早川町',
  higashiyoshino: '東吉野村',
  ide: '井手町',
  kamikitayama: '上北山村',
  kanna: '神流町',
  kawachi: '河内町',
  'kawasaki-miyagi': '川崎町',
  kitagawa: '北川村',
  kusatsu: '草津町',
  nanmoku: '南牧村',
  nosegawa: '野迫川村',
  otaki: '王滝村',
  shimoichi: '下市町',
  sotogahama: '外ヶ浜町',
  tobetsu: '当別町',
  toyono: '豊能町',
  utashinai: '歌志内市',
  yoshimi: '吉見町',
  yoshino: '吉野町',
};

// テンプレートファイルから出力ファイル名へのマッピング
function getOutputFileName(templatePath) {
  // services/xxx/yyy.json → yyy.json
  // topics/xxx.json → xxx.json
  // index.json → index.json
  return path.basename(templatePath);
}

// テンプレート内容を自治体向けに変換
function transformTemplate(content, municipalityId, municipalityName) {
  const now = new Date().toISOString();

  let result = content
    // municipality_id を置換
    .replace(/"municipality_id":\s*"sample"/g, `"municipality_id": "${municipalityId}"`)
    // page_id を置換 (sample-xxx → municipality-xxx)
    .replace(/"page_id":\s*"sample-/g, `"page_id": "${municipalityId}-`)
    // {{municipality_name}} を置換
    .replace(/\{\{municipality_name\}\}/g, municipalityName)
    // {{generated_at}} を置換
    .replace(/\{\{generated_at\}\}/g, now)
    // source_url の sample を置換
    .replace(/template:\/\/sample\//g, `template://${municipalityId}/`);

  return result;
}

// テンプレートファイル一覧を取得
function getTemplateFiles() {
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.json') && entry.name !== 'page-registry.json') {
        files.push(fullPath);
      }
    }
  }

  walk(TEMPLATES_DIR);
  return files;
}

// 自治体にテンプレートをコピー
function copyTemplatesToMunicipality(municipalityId, municipalityName) {
  const outputDir = path.join(ARTIFACTS_DIR, municipalityId);
  const templateFiles = getTemplateFiles();

  console.log(`\n📁 ${municipalityName} (${municipalityId}) にコピー中...`);

  let copied = 0;
  let skipped = 0;

  for (const templatePath of templateFiles) {
    const outputFileName = getOutputFileName(templatePath);
    const outputPath = path.join(outputDir, outputFileName);

    // 既存ファイルがある場合はスキップ
    if (fs.existsSync(outputPath)) {
      skipped++;
      continue;
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const transformedContent = transformTemplate(templateContent, municipalityId, municipalityName);

    fs.writeFileSync(outputPath, transformedContent, 'utf-8');
    copied++;
  }

  console.log(`  ✅ ${copied} ファイルをコピー, ${skipped} ファイルをスキップ`);
  return { copied, skipped };
}

// メイン処理
function main() {
  const targetMunicipality = process.argv[2];

  let total = { copied: 0, skipped: 0 };

  if (targetMunicipality) {
    // 特定の自治体のみ
    if (!MUNICIPALITIES[targetMunicipality]) {
      console.error(`❌ 不明な自治体ID: ${targetMunicipality}`);
      console.log('有効な自治体ID:', Object.keys(MUNICIPALITIES).join(', '));
      process.exit(1);
    }
    const result = copyTemplatesToMunicipality(targetMunicipality, MUNICIPALITIES[targetMunicipality]);
    total.copied += result.copied;
    total.skipped += result.skipped;
  } else {
    // 全自治体
    console.log('🚀 全自治体にテンプレートをコピーします...\n');

    for (const [id, name] of Object.entries(MUNICIPALITIES)) {
      const result = copyTemplatesToMunicipality(id, name);
      total.copied += result.copied;
      total.skipped += result.skipped;
    }
  }

  console.log(`\n📊 完了: ${total.copied} ファイルをコピー, ${total.skipped} ファイルをスキップ`);
}

main();
