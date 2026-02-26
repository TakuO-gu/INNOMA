#!/usr/bin/env node
/**
 * デフォルト値で追加された変数を削除するスクリプト
 * confidence: 0.5 かつ source: "default" の変数を削除
 */

const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, '../data/artifacts');

function getMunicipalityDirs() {
  const dirs = fs.readdirSync(ARTIFACTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !name.startsWith('_') && name !== 'sample');

  return dirs;
}

function removeDefaultVariables(municipalityDir) {
  const variablesDir = path.join(ARTIFACTS_DIR, municipalityDir, 'variables');

  if (!fs.existsSync(variablesDir)) {
    return { removed: 0, skipped: true };
  }

  let totalRemoved = 0;

  // core.json からデフォルト変数を削除
  const corePath = path.join(variablesDir, 'core.json');
  if (fs.existsSync(corePath)) {
    const coreData = JSON.parse(fs.readFileSync(corePath, 'utf-8'));
    let coreModified = false;

    ['city_hall_hours', 'shimin_email'].forEach(key => {
      if (coreData[key] && coreData[key].source === 'default' && coreData[key].confidence === 0.5) {
        delete coreData[key];
        totalRemoved++;
        coreModified = true;
        console.log(`    🗑️  core.json から削除: ${key}`);
      }
    });

    if (coreModified) {
      fs.writeFileSync(corePath, JSON.stringify(coreData, null, 2) + '\n', 'utf-8');
    }
  }

  // misc.json からデフォルト変数を削除
  const miscPath = path.join(variablesDir, 'misc.json');
  if (fs.existsSync(miscPath)) {
    const miscData = JSON.parse(fs.readFileSync(miscPath, 'utf-8'));
    let miscModified = false;

    ['juminhyo_fee', 'juminhyo_convenience_fee', 'juminhyo_kisai_fee'].forEach(key => {
      if (miscData[key] && miscData[key].source === 'default' && miscData[key].confidence === 0.5) {
        delete miscData[key];
        totalRemoved++;
        miscModified = true;
        console.log(`    🗑️  misc.json から削除: ${key}`);
      }
    });

    if (miscModified) {
      fs.writeFileSync(miscPath, JSON.stringify(miscData, null, 2) + '\n', 'utf-8');
    }
  }

  return { removed: totalRemoved, skipped: false };
}

function main() {
  console.log('🧹 デフォルト値の変数を削除します...\n');

  const municipalities = getMunicipalityDirs();
  console.log(`📍 対象自治体数: ${municipalities.length}\n`);

  let totalRemoved = 0;
  let processed = 0;

  municipalities.forEach(municipality => {
    console.log(`📂 ${municipality}`);
    const result = removeDefaultVariables(municipality);

    if (result.skipped) {
      console.log(`  ⏭️  スキップ（variablesディレクトリなし）`);
    } else if (result.removed === 0) {
      console.log(`  ✅ 削除対象なし`);
    } else {
      totalRemoved += result.removed;
      processed++;
    }

    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 削除結果サマリー');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🗑️  削除した変数: ${totalRemoved} 個`);
  console.log(`📝 処理した自治体: ${processed} 自治体`);
  console.log('');
  console.log('✅ デフォルト値の削除が完了しました。');
}

main();
