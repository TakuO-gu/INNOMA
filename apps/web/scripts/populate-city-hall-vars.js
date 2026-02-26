#!/usr/bin/env node
/**
 * 新規公開自治体の市役所基本情報変数を設定するスクリプト
 */

const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../data/artifacts');

// 新規公開した自治体とその市役所情報
const municipalities = [
  {
    id: 'hakone',
    name: '箱根町',
    vars: {
      city_hall_department: '総務課',
      city_hall_phone: '0460-85-7111',
      city_hall_email: '',
      city_hall_hours: '平日 8:30〜17:15（土日祝日・年末年始を除く）',
      city_hall_address: '〒250-0398 神奈川県足柄下郡箱根町湯本256',
    }
  },
  {
    id: 'kusatsu',
    name: '草津町',
    vars: {
      city_hall_department: '住民課',
      city_hall_phone: '0279-88-0001',
      city_hall_email: '',
      city_hall_hours: '平日 8:30〜17:15（土日祝日・年末年始を除く）',
      city_hall_address: '〒377-1792 群馬県吾妻郡草津町大字草津28番地',
    }
  },
  {
    id: 'yoshino',
    name: '吉野町',
    vars: {
      city_hall_department: '総務課',
      city_hall_phone: '0746-32-3081',
      city_hall_email: '',
      city_hall_hours: '平日 8:30〜17:15（土日祝日・年末年始を除く）',
      city_hall_address: '〒639-3192 奈良県吉野郡吉野町大字上市80番地の1',
    }
  },
  {
    id: 'sotogahama',
    name: '外ヶ浜町',
    vars: {
      city_hall_department: '総務課',
      city_hall_phone: '0174-31-1111',
      city_hall_email: '',
      city_hall_hours: '平日 8:15〜17:00（土日祝日・年末年始を除く）',
      city_hall_address: '〒030-1303 青森県東津軽郡外ヶ浜町字蟹田高銅屋44-2',
    }
  },
  {
    id: 'nanmoku',
    name: '南牧村',
    vars: {
      city_hall_department: '総務課',
      city_hall_phone: '0274-87-2011',
      city_hall_email: '',
      city_hall_hours: '平日 8:30〜17:15（土日祝日・年末年始を除く）',
      city_hall_address: '〒370-2806 群馬県甘楽郡南牧村大字大日向1098',
    }
  },
  {
    id: 'hayakawa',
    name: '早川町',
    vars: {
      city_hall_department: '総務課',
      city_hall_phone: '0556-45-2511',
      city_hall_email: '',
      city_hall_hours: '平日 8:30〜17:15（土日祝日・年末年始を除く）',
      city_hall_address: '〒409-2732 山梨県南巨摩郡早川町高住758',
    }
  },
];

const now = new Date().toISOString();

municipalities.forEach(({ id, name, vars }) => {
  // 分割ファイル構造をチェック
  const variablesDir = path.join(artifactsDir, id, 'variables');
  const singleFilePath = path.join(artifactsDir, id, 'variables.json');

  let targetFile;
  let variables = {};

  if (fs.existsSync(variablesDir)) {
    // 分割ファイル構造の場合、core.jsonに追加
    targetFile = path.join(variablesDir, 'core.json');
    if (fs.existsSync(targetFile)) {
      variables = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    }
  } else if (fs.existsSync(singleFilePath)) {
    // 単一ファイル構造
    targetFile = singleFilePath;
    variables = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
  } else {
    console.log(`⚠️  ${name}: variables.json or variables/ not found`);
    return;
  }

  // 変数を追加・更新
  let updated = 0;
  Object.entries(vars).forEach(([key, value]) => {
    if (!variables[key] || variables[key].value !== value) {
      variables[key] = {
        value,
        source: 'manual',
        updatedAt: now,
      };
      updated++;
    }
  });

  if (updated > 0) {
    fs.writeFileSync(targetFile, JSON.stringify(variables, null, 2));
    console.log(`✅ ${name}: ${updated}件の変数を更新`);
  } else {
    console.log(`✓  ${name}: 変数は既に最新`);
  }
});

console.log('\n完了');
