#!/usr/bin/env node
/**
 * 全自治体に欠落している住民票関連変数を追加するスクリプト
 *
 * 追加する変数:
 * - juminhyo_fee (窓口手数料)
 * - juminhyo_convenience_fee (コンビニ交付手数料)
 * - juminhyo_kisai_fee (記載事項証明書手数料)
 * - city_hall_hours (市役所営業時間)
 * - shimin_email (問い合わせ先メール)
 */

const fs = require('fs');
const path = require('path');

// 自治体データのベースディレクトリ
const ARTIFACTS_DIR = path.join(__dirname, '../data/artifacts');

// 一般的な値（自治体ごとに要確認）
const DEFAULT_VALUES = {
  juminhyo_fee: {
    value: '300円',
    source: 'default',
    confidence: 0.5,
    notes: 'デフォルト値。自治体の公式サイトで要確認。'
  },
  juminhyo_convenience_fee: {
    value: '200円',
    source: 'default',
    confidence: 0.5,
    notes: 'デフォルト値（通常は窓口より100円安い）。自治体の公式サイトで要確認。'
  },
  juminhyo_kisai_fee: {
    value: '300円',
    source: 'default',
    confidence: 0.5,
    notes: 'デフォルト値（通常は住民票と同額）。自治体の公式サイトで要確認。'
  },
  city_hall_hours: {
    value: '平日 8:30～17:15',
    source: 'default',
    confidence: 0.5,
    notes: 'デフォルト値。自治体の公式サイトで要確認。'
  },
  shimin_email: {
    value: '担当窓口にお問い合わせください',
    source: 'default',
    confidence: 0.5,
    notes: 'デフォルト値。自治体の公式サイトで要確認。'
  }
};

/**
 * 自治体ディレクトリを取得
 */
function getMunicipalityDirs() {
  const dirs = fs.readdirSync(ARTIFACTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !name.startsWith('_') && name !== 'sample');

  return dirs;
}

/**
 * 変数ファイルが存在するか確認
 */
function hasVariablesDir(municipalityDir) {
  const variablesPath = path.join(ARTIFACTS_DIR, municipalityDir, 'variables');
  return fs.existsSync(variablesPath);
}

/**
 * core.json に変数を追加
 */
function addToCoreJson(municipalityDir) {
  const corePath = path.join(ARTIFACTS_DIR, municipalityDir, 'variables', 'core.json');

  if (!fs.existsSync(corePath)) {
    console.log(`  ⚠️  core.json が存在しません: ${municipalityDir}`);
    return { added: [], skipped: ['city_hall_hours', 'shimin_email'] };
  }

  const coreData = JSON.parse(fs.readFileSync(corePath, 'utf-8'));
  const added = [];
  const skipped = [];

  // city_hall_hours を追加
  if (!coreData.city_hall_hours) {
    coreData.city_hall_hours = {
      ...DEFAULT_VALUES.city_hall_hours,
      updatedAt: new Date().toISOString()
    };
    added.push('city_hall_hours');
  } else {
    skipped.push('city_hall_hours');
  }

  // shimin_email を追加
  if (!coreData.shimin_email) {
    coreData.shimin_email = {
      ...DEFAULT_VALUES.shimin_email,
      updatedAt: new Date().toISOString()
    };
    added.push('shimin_email');
  } else {
    skipped.push('shimin_email');
  }

  if (added.length > 0) {
    fs.writeFileSync(corePath, JSON.stringify(coreData, null, 2) + '\n', 'utf-8');
  }

  return { added, skipped };
}

/**
 * misc.json に変数を追加（存在しない場合は作成）
 */
function addToMiscJson(municipalityDir) {
  const variablesDir = path.join(ARTIFACTS_DIR, municipalityDir, 'variables');
  const miscPath = path.join(variablesDir, 'misc.json');

  let miscData = {};
  if (fs.existsSync(miscPath)) {
    miscData = JSON.parse(fs.readFileSync(miscPath, 'utf-8'));
  }

  const added = [];
  const skipped = [];

  // juminhyo_fee を追加
  if (!miscData.juminhyo_fee) {
    miscData.juminhyo_fee = {
      ...DEFAULT_VALUES.juminhyo_fee,
      updatedAt: new Date().toISOString()
    };
    added.push('juminhyo_fee');
  } else {
    skipped.push('juminhyo_fee');
  }

  // juminhyo_convenience_fee を追加
  if (!miscData.juminhyo_convenience_fee) {
    miscData.juminhyo_convenience_fee = {
      ...DEFAULT_VALUES.juminhyo_convenience_fee,
      updatedAt: new Date().toISOString()
    };
    added.push('juminhyo_convenience_fee');
  } else {
    skipped.push('juminhyo_convenience_fee');
  }

  // juminhyo_kisai_fee を追加
  if (!miscData.juminhyo_kisai_fee) {
    miscData.juminhyo_kisai_fee = {
      ...DEFAULT_VALUES.juminhyo_kisai_fee,
      updatedAt: new Date().toISOString()
    };
    added.push('juminhyo_kisai_fee');
  } else {
    skipped.push('juminhyo_kisai_fee');
  }

  if (added.length > 0) {
    fs.writeFileSync(miscPath, JSON.stringify(miscData, null, 2) + '\n', 'utf-8');
  }

  return { added, skipped };
}

/**
 * メイン処理
 */
function main() {
  console.log('🚀 全自治体に住民票関連変数を追加します...\n');

  const municipalities = getMunicipalityDirs();
  console.log(`📍 対象自治体数: ${municipalities.length}\n`);

  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    totalAdded: 0
  };

  municipalities.forEach(municipality => {
    try {
      console.log(`📂 ${municipality}`);

      if (!hasVariablesDir(municipality)) {
        console.log(`  ⚠️  variables ディレクトリが存在しません`);
        results.skipped++;
        return;
      }

      // core.json に追加
      const coreResult = addToCoreJson(municipality);
      if (coreResult.added.length > 0) {
        console.log(`  ✅ core.json に追加: ${coreResult.added.join(', ')}`);
      }
      if (coreResult.skipped.length > 0) {
        console.log(`  ⏭️  core.json にスキップ（既存）: ${coreResult.skipped.join(', ')}`);
      }

      // misc.json に追加
      const miscResult = addToMiscJson(municipality);
      if (miscResult.added.length > 0) {
        console.log(`  ✅ misc.json に追加: ${miscResult.added.join(', ')}`);
      }
      if (miscResult.skipped.length > 0) {
        console.log(`  ⏭️  misc.json にスキップ（既存）: ${miscResult.skipped.join(', ')}`);
      }

      const totalAdded = coreResult.added.length + miscResult.added.length;
      results.totalAdded += totalAdded;
      results.processed++;

      console.log('');
    } catch (error) {
      console.error(`  ❌ エラー: ${error.message}`);
      results.errors++;
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 処理結果サマリー');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 処理完了: ${results.processed} 自治体`);
  console.log(`⚠️  スキップ: ${results.skipped} 自治体`);
  console.log(`❌ エラー: ${results.errors} 自治体`);
  console.log(`📝 追加した変数: ${results.totalAdded} 個`);
  console.log('');
  console.log('⚠️  注意: 追加された変数はデフォルト値です。');
  console.log('   各自治体の公式サイトで正確な値を確認し、更新してください。');
}

main();
