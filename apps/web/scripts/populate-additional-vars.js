#!/usr/bin/env node
/**
 * 6自治体の追加変数（passport, visa, silver center）を設定するスクリプト
 */

const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../data/artifacts');
const now = new Date().toISOString();

const municipalityVars = {
  "kusatsu": {
    "passport_office_name": "草津町役場住民課",
    "passport_office_phone": "0279-88-7192",
    "passport_office_address": "〒377-1792 群馬県吾妻郡草津町草津28番地",
    "immigration_bureau": "東京出入国在留管理局高崎出張所",
    "immigration_bureau_phone": "027-328-1154",
    "immigration_bureau_address": "〒370-0829 群馬県高崎市高松町26-5 高崎法務総合庁舎1階"
  },
  "hakone": {
    "passport_office_name": "神奈川県パスポートセンター",
    "passport_office_phone": "045-222-0022",
    "passport_office_address": "〒231-0005 神奈川県横浜市中区本町6-50-10 横浜市庁舎1階",
    "immigration_bureau": "東京出入国在留管理局横浜支局",
    "immigration_bureau_phone": "0570-045259",
    "immigration_bureau_address": "〒236-0002 神奈川県横浜市金沢区鳥浜町10-7",
    "silver_center_phone": "0460-82-5115",
    "silver_center_address": "〒250-0408 神奈川県足柄下郡箱根町強羅1320-185"
  },
  "yoshino": {
    "passport_office_name": "奈良県旅券事務所",
    "passport_office_phone": "0742-20-0100",
    "passport_office_address": "〒630-8213 奈良県奈良市登大路町30 奈良県庁",
    "immigration_bureau": "大阪出入国在留管理局奈良出張所",
    "immigration_bureau_phone": "0742-23-6501",
    "immigration_bureau_address": "〒630-8301 奈良県奈良市東紀寺町3-4-1 奈良第二法務総合庁舎",
    "silver_center_fee": "年会費2,000円",
    "silver_center_phone": "0746-32-3800",
    "silver_center_address": "〒639-3107 奈良県吉野郡吉野町大字佐々羅174"
  },
  "sotogahama": {
    "passport_office_name": "青森県パスポートセンター",
    "passport_office_phone": "017-734-9176",
    "passport_office_address": "〒030-8570 青森県青森市長島1-1-1 青森県庁北棟1階",
    "immigration_bureau": "仙台出入国在留管理局青森出張所",
    "immigration_bureau_phone": "017-777-2939",
    "immigration_bureau_address": "〒030-0861 青森県青森市長島1-3-5 青森第二合同庁舎"
  },
  "nanmoku": {
    "passport_office_name": "群馬県パスポートセンター",
    "passport_office_phone": "027-226-2644",
    "passport_office_address": "〒371-0026 群馬県前橋市大手町2-1-1 群馬県庁2階",
    "immigration_bureau": "東京出入国在留管理局高崎出張所",
    "immigration_bureau_phone": "027-328-1154",
    "immigration_bureau_address": "〒370-0829 群馬県高崎市高松町26-5 高崎法務総合庁舎1階",
    "silver_center_phone": "0274-87-2676",
    "silver_center_address": "〒370-2804 群馬県甘楽郡南牧村磐戸207"
  },
  "hayakawa": {
    "passport_office_name": "山梨県パスポートセンター",
    "passport_office_phone": "055-223-1754",
    "passport_office_address": "〒400-8501 山梨県甲府市丸の内1-6-1 山梨県庁別館2階",
    "immigration_bureau": "東京出入国在留管理局甲府出張所",
    "immigration_bureau_phone": "055-255-3350",
    "immigration_bureau_address": "〒400-0031 山梨県甲府市丸の内1-1-18 甲府合同庁舎9階",
    "silver_center_phone": "0556-22-8701",
    "silver_center_address": "〒400-0601 山梨県南巨摩郡富士川町鰍沢655-8"
  }
};

Object.entries(municipalityVars).forEach(([municipalityId, vars]) => {
  const variablesDir = path.join(artifactsDir, municipalityId, 'variables');
  const singleFilePath = path.join(artifactsDir, municipalityId, 'variables.json');

  let targetFile;
  let variables = {};

  if (fs.existsSync(variablesDir)) {
    targetFile = path.join(variablesDir, 'core.json');
    if (fs.existsSync(targetFile)) {
      variables = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    }
  } else if (fs.existsSync(singleFilePath)) {
    targetFile = singleFilePath;
    variables = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
  } else {
    console.log(`⚠️  ${municipalityId}: variables.json or variables/ not found`);
    return;
  }

  let updated = 0;
  Object.entries(vars).forEach(([key, value]) => {
    if (!variables[key] || variables[key].value !== value) {
      variables[key] = {
        value,
        source: 'llm',
        updatedAt: now,
      };
      updated++;
    }
  });

  if (updated > 0) {
    fs.writeFileSync(targetFile, JSON.stringify(variables, null, 2));
    console.log(`✅ ${municipalityId}: ${updated}件の変数を更新`);
  } else {
    console.log(`✓  ${municipalityId}: 変数は既に最新`);
  }
});

console.log('\n完了');
