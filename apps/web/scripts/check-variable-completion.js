#!/usr/bin/env node
/**
 * 自治体の変数実装率をチェックするスクリプト
 *
 * 使用方法:
 *   node check-variable-completion.js [municipalityId]
 *
 * 引数なしの場合は全自治体をチェック
 */

const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../data/artifacts');

/**
 * JSONファイル内の未実装変数を検出
 * @param {object} obj - JSONオブジェクト
 * @param {string} currentPath - 現在のパス（デバッグ用）
 * @returns {string[]} 未実装変数のリスト
 */
function findUnimplementedVariables(obj, currentPath = '') {
  const variables = [];

  if (typeof obj === 'string') {
    // {{variable_name}} パターンを検出
    const matches = obj.match(/\{\{[^}]+\}\}/g);
    if (matches) {
      variables.push(...matches);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      variables.push(...findUnimplementedVariables(item, `${currentPath}[${index}]`));
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      variables.push(...findUnimplementedVariables(value, `${currentPath}.${key}`));
    });
  }

  return variables;
}

/**
 * 自治体の定義済み変数を取得
 * @param {string} municipalityId - 自治体ID
 * @returns {Set<string>} 定義済み変数名のセット
 */
function getDefinedVariables(municipalityId) {
  const definedVariables = new Set();
  const municipalityDir = path.join(artifactsDir, municipalityId);

  // variables/core.jsonをチェック
  const coreVarsPath = path.join(municipalityDir, 'variables', 'core.json');
  if (fs.existsSync(coreVarsPath)) {
    try {
      const coreVars = JSON.parse(fs.readFileSync(coreVarsPath, 'utf-8'));
      Object.keys(coreVars).forEach(varName => {
        if (coreVars[varName] && coreVars[varName].value) {
          definedVariables.add(`{{${varName}}}`);
        }
      });
    } catch (error) {
      // エラーは無視
    }
  }

  // variables.jsonをチェック（単一ファイル構造の場合）
  const varsPath = path.join(municipalityDir, 'variables.json');
  if (fs.existsSync(varsPath)) {
    try {
      const vars = JSON.parse(fs.readFileSync(varsPath, 'utf-8'));
      Object.keys(vars).forEach(varName => {
        if (vars[varName] && vars[varName].value) {
          definedVariables.add(`{{${varName}}}`);
        }
      });
    } catch (error) {
      // エラーは無視
    }
  }

  return definedVariables;
}

/**
 * 自治体の変数実装率をチェック
 * @param {string} municipalityId - 自治体ID
 * @returns {object} チェック結果
 */
function checkMunicipality(municipalityId) {
  const municipalityDir = path.join(artifactsDir, municipalityId);

  if (!fs.existsSync(municipalityDir)) {
    return {
      municipalityId,
      error: 'Directory not found',
      exists: false
    };
  }

  // 定義済み変数を取得
  const definedVariables = getDefinedVariables(municipalityId);

  const files = fs.readdirSync(municipalityDir)
    .filter(file => file.endsWith('.json') && file !== 'meta.json');

  let totalVariables = 0;
  const fileResults = {};

  files.forEach(file => {
    const filePath = path.join(municipalityDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const variables = findUnimplementedVariables(content);

      if (variables.length > 0) {
        // 重複を除去し、定義済み変数を除外
        const uniqueVariables = [...new Set(variables)].filter(
          v => !definedVariables.has(v)
        );

        if (uniqueVariables.length > 0) {
          fileResults[file] = uniqueVariables;
          totalVariables += uniqueVariables.length;
        }
      }
    } catch (error) {
      fileResults[file] = { error: error.message };
    }
  });

  return {
    municipalityId,
    exists: true,
    totalFiles: files.length,
    filesWithUnimplementedVariables: Object.keys(fileResults).length,
    totalUnimplementedVariables: totalVariables,
    completionRate: files.length > 0
      ? ((files.length - Object.keys(fileResults).length) / files.length * 100).toFixed(1)
      : 0,
    details: fileResults
  };
}

/**
 * 結果を表示
 */
function displayResults(results, showDetails = false) {
  if (results.error) {
    console.log(`❌ ${results.municipalityId}: ${results.error}`);
    return;
  }

  const isComplete = results.filesWithUnimplementedVariables === 0;
  const icon = isComplete ? '✅' : '⚠️';

  console.log(`\n${icon} ${results.municipalityId}`);
  console.log(`   ファイル数: ${results.totalFiles}`);
  console.log(`   実装率: ${results.completionRate}%`);
  console.log(`   未実装変数を含むファイル: ${results.filesWithUnimplementedVariables}`);
  console.log(`   未実装変数の総数: ${results.totalUnimplementedVariables}`);

  if (showDetails && results.filesWithUnimplementedVariables > 0) {
    console.log('\n   詳細:');
    Object.entries(results.details).forEach(([file, variables]) => {
      if (variables.error) {
        console.log(`     ${file}: エラー - ${variables.error}`);
      } else {
        console.log(`     ${file}: ${variables.length}個の未実装変数`);
        variables.forEach(v => console.log(`       - ${v}`));
      }
    });
  }
}

// メイン処理
const args = process.argv.slice(2);
const targetMunicipality = args[0];
const showDetails = args.includes('--details') || args.includes('-d');

if (targetMunicipality && targetMunicipality !== '--details' && targetMunicipality !== '-d') {
  // 特定の自治体をチェック
  const result = checkMunicipality(targetMunicipality);
  displayResults(result, true); // 特定の自治体の場合は常に詳細表示
} else {
  // 全自治体をチェック
  const municipalities = fs.readdirSync(artifactsDir)
    .filter(item => {
      const itemPath = path.join(artifactsDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

  console.log(`🔍 ${municipalities.length}自治体の変数実装状況をチェック中...\n`);

  const allResults = municipalities.map(checkMunicipality);

  // 完全実装とそうでないものに分類
  const complete = allResults.filter(r => r.exists && r.filesWithUnimplementedVariables === 0);
  const incomplete = allResults.filter(r => r.exists && r.filesWithUnimplementedVariables > 0);
  const errors = allResults.filter(r => !r.exists);

  // サマリー表示
  console.log('='.repeat(60));
  console.log('📊 サマリー');
  console.log('='.repeat(60));
  console.log(`✅ 完全実装: ${complete.length}自治体`);
  console.log(`⚠️  未実装あり: ${incomplete.length}自治体`);
  if (errors.length > 0) {
    console.log(`❌ エラー: ${errors.length}自治体`);
  }

  if (complete.length > 0) {
    console.log('\n✅ 完全実装済み:');
    complete.forEach(r => console.log(`   - ${r.municipalityId}`));
  }

  if (incomplete.length > 0) {
    console.log('\n⚠️  未実装変数あり:');
    incomplete
      .sort((a, b) => b.totalUnimplementedVariables - a.totalUnimplementedVariables)
      .forEach(result => {
        displayResults(result, showDetails);
      });
  }

  if (errors.length > 0) {
    console.log('\n❌ エラー:');
    errors.forEach(displayResults);
  }

  console.log('\n='.repeat(60));
  console.log(`完了: ${allResults.length}自治体をチェック`);
  console.log('\n💡 詳細を表示する場合: node check-variable-completion.js --details');
  console.log('💡 特定の自治体をチェック: node check-variable-completion.js <municipalityId>');
}
