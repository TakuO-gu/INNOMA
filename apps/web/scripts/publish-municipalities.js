#!/usr/bin/env node
/**
 * 自治体を公開状態に変更するスクリプト
 *
 * 使用方法:
 *   node publish-municipalities.js [--force]
 *
 * オプション:
 *   --force: 変数チェックをスキップして強制的に公開
 */

const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../data/artifacts');

// コマンドライン引数のチェック
const forcePublish = process.argv.includes('--force');

// 公開する自治体のリスト（既にpublishedの4つ + 追加する自治体）
const municipalitiesToPublish = [
  'atami',      // 熱海市（既にpublished）
  'choshi',     // 銚子市（既にpublished）
  'takaoka',    // 高岡市（既にpublished）
  'tsuru',      // 都留市（既にpublished）
  'hakone',     // 箱根町
  'kusatsu',    // 草津町
  'yoshino',    // 吉野町
  'sotogahama', // 外ヶ浜町
  'nanmoku',    // 南牧村
  'hayakawa',   // 早川町
];

/**
 * JSONファイル内の未実装変数を検出
 * @param {object} obj - JSONオブジェクト
 * @returns {string[]} 未実装変数のリスト
 */
function findUnimplementedVariables(obj) {
  const variables = [];

  if (typeof obj === 'string') {
    // {{variable_name}} パターンを検出
    const matches = obj.match(/\{\{[^}]+\}\}/g);
    if (matches) {
      variables.push(...matches);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => {
      variables.push(...findUnimplementedVariables(item));
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach((value) => {
      variables.push(...findUnimplementedVariables(value));
    });
  }

  return variables;
}

/**
 * 自治体の変数実装状況をチェック
 * @param {string} municipalityId - 自治体ID
 * @returns {object} チェック結果
 */
function checkVariableCompletion(municipalityId) {
  const municipalityDir = path.join(artifactsDir, municipalityId);

  const files = fs.readdirSync(municipalityDir)
    .filter(file => file.endsWith('.json') && file !== 'meta.json');

  let totalUnimplementedVariables = 0;
  const filesWithIssues = [];

  files.forEach(file => {
    const filePath = path.join(municipalityDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const variables = findUnimplementedVariables(content);

      if (variables.length > 0) {
        const uniqueVariables = [...new Set(variables)];
        filesWithIssues.push({ file, variables: uniqueVariables });
        totalUnimplementedVariables += uniqueVariables.length;
      }
    } catch (error) {
      filesWithIssues.push({ file, error: error.message });
    }
  });

  return {
    isComplete: filesWithIssues.length === 0,
    totalFiles: files.length,
    filesWithIssues,
    totalUnimplementedVariables
  };
}

let updated = 0;
let skipped = 0;
let blocked = 0;

console.log('🔍 変数実装状況をチェック中...\n');

municipalitiesToPublish.forEach(municipalityId => {
  const metaPath = path.join(artifactsDir, municipalityId, 'meta.json');

  if (!fs.existsSync(metaPath)) {
    console.log(`⚠️  ${municipalityId}: meta.json not found`);
    skipped++;
    return;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  if (meta.status === 'published') {
    console.log(`✓  ${municipalityId}: already published`);
    skipped++;
    return;
  }

  // 変数チェック（--forceオプションがない場合）
  if (!forcePublish) {
    const checkResult = checkVariableCompletion(municipalityId);

    if (!checkResult.isComplete) {
      console.log(`❌ ${municipalityId}: 未実装変数あり（${checkResult.totalUnimplementedVariables}個）`);
      console.log(`   未実装ファイル: ${checkResult.filesWithIssues.length}/${checkResult.totalFiles}`);

      // 最初の3ファイルの例を表示
      const exampleFiles = checkResult.filesWithIssues.slice(0, 3);
      exampleFiles.forEach(({ file, variables }) => {
        if (variables) {
          console.log(`   - ${file}: ${variables.slice(0, 3).join(', ')}${variables.length > 3 ? '...' : ''}`);
        }
      });

      console.log(`   詳細: node scripts/check-variable-completion.js ${municipalityId}`);
      blocked++;
      return;
    }
  }

  meta.status = 'published';
  meta.updatedAt = new Date().toISOString();

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`✅ ${municipalityId}: published${forcePublish ? ' (forced)' : ''}`);
  updated++;
});

console.log('\n' + '='.repeat(60));
console.log(`完了: ${updated}件を公開、${skipped}件をスキップ、${blocked}件をブロック`);

if (blocked > 0) {
  console.log('\n⚠️  未実装変数があるため公開がブロックされた自治体があります。');
  console.log('変数を実装するか、--forceオプションで強制公開してください。');
  console.log('\n例: node scripts/publish-municipalities.js --force');
  process.exit(1);
}
