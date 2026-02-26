#!/usr/bin/env node
/**
 * 5自治体の外部機関変数を設定するスクリプト
 */

const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../data/artifacts');
const now = new Date().toISOString();

const municipalityVars = {
  "hakone": {
    "prefecture_name": "神奈川県",
    "traffic_accident_consultation_phone": "045-201-1881",
    "hello_work_name": "ハローワーク小田原",
    "hello_work_phone": "0465-23-8609",
    "hello_work_address": "〒250-0011 小田原市栄町1-1-15 ミナカ小田原9階",
    "police_station": "小田原警察署",
    "police_station_phone": "0465-32-0110",
    "police_station_address": "〒250-0042 神奈川県小田原市荻窪350-1",
    "labor_bureau": "神奈川労働局",
    "labor_bureau_phone": "045-211-7358",
    "labor_bureau_address": "〒231-8434 神奈川県横浜市中区北仲通5-57 横浜第2合同庁舎",
    "driver_license_center": "神奈川県警察運転免許センター",
    "driver_license_center_phone": "045-365-3111",
    "driver_license_center_address": "〒241-0815 神奈川県横浜市旭区中尾1丁目1-1",
    "legal_affairs_bureau": "横浜地方法務局",
    "legal_affairs_bureau_phone": "045-641-7461",
    "legal_affairs_bureau_address": "〒231-8411 横浜市中区北仲通5丁目57番地 横浜第2合同庁舎",
    "transport_branch": "神奈川運輸支局",
    "transport_branch_phone": "050-5540-2035",
    "transport_branch_address": "〒224-0053 神奈川県横浜市都筑区池辺町3540",
    "tax_office": "小田原税務署",
    "tax_office_phone": "0465-35-4511",
    "tax_office_address": "〒250-8511 小田原市荻窪440番地"
  },
  "yoshino": {
    "prefecture_name": "奈良県",
    "traffic_accident_consultation_phone": "0742-27-8731",
    "hello_work_name": "ハローワーク下市",
    "hello_work_phone": "0747-52-3867",
    "hello_work_address": "〒638-0041 奈良県吉野郡下市町下市2772-1",
    "police_station": "吉野警察署",
    "police_station_phone": "0747-53-0110",
    "police_station_address": "〒638-0821 奈良県吉野郡大淀町大字下渕389番地の1",
    "labor_bureau": "奈良労働局",
    "labor_bureau_phone": "0742-32-0208",
    "labor_bureau_address": "〒630-8570 奈良県奈良市法蓮町387 奈良第3地方合同庁舎",
    "driver_license_center": "奈良県警察運転免許センター",
    "driver_license_center_phone": "0744-22-5541",
    "driver_license_center_address": "〒634-0007 奈良県橿原市葛本町120番地の3",
    "legal_affairs_bureau": "奈良地方法務局",
    "legal_affairs_bureau_phone": "0742-23-5534",
    "legal_affairs_bureau_address": "〒630-8301 奈良市高畑町552",
    "transport_branch": "奈良運輸支局",
    "transport_branch_phone": "0743-59-2151",
    "transport_branch_address": "〒639-1037 奈良県大和郡山市小泉町2104-16",
    "tax_office": "吉野税務署",
    "tax_office_phone": "0746-32-3385",
    "tax_office_address": "〒639-3194 吉野郡吉野町丹治200-1"
  },
  "sotogahama": {
    "prefecture_name": "青森県",
    "traffic_accident_consultation_phone": "017-734-9235",
    "hello_work_name": "ハローワーク青森",
    "hello_work_phone": "017-776-1561",
    "hello_work_address": "〒030-0822 青森市中央2-10-10",
    "police_station": "外ヶ浜警察署",
    "police_station_phone": "0174-22-2211",
    "police_station_address": "〒030-1393 青森県東津軽郡外ヶ浜町字蟹田中師苗代沢3",
    "labor_bureau": "青森労働局",
    "labor_bureau_phone": "017-734-4111",
    "labor_bureau_address": "〒030-8558 青森市新町2-4-25 青森合同庁舎",
    "driver_license_center": "青森県運転免許センター",
    "driver_license_center_phone": "017-782-0081",
    "driver_license_center_address": "〒038-0031 青森県青森市三内丸山198-4",
    "legal_affairs_bureau": "青森地方法務局",
    "legal_affairs_bureau_phone": "017-776-6231",
    "legal_affairs_bureau_address": "〒030-8511 青森市長島1丁目3番5号 青森第2合同庁舎",
    "transport_branch": "青森運輸支局",
    "transport_branch_phone": "017-739-1501",
    "transport_branch_address": "〒030-0843 青森県青森市大字浜田字豊田139-13",
    "tax_office": "青森税務署",
    "tax_office_phone": "017-776-4241",
    "tax_office_address": "〒030-0861 青森市長島1丁目3番5号 青森第二合同庁舎"
  },
  "nanmoku": {
    "prefecture_name": "群馬県",
    "traffic_accident_consultation_phone": "027-223-1111",
    "hello_work_name": "ハローワーク富岡",
    "hello_work_phone": "0274-62-8609",
    "hello_work_address": "〒370-2316 富岡市富岡1414-14",
    "police_station": "富岡警察署",
    "police_station_phone": "0274-62-0110",
    "police_station_address": "〒370-2316 富岡市富岡1198",
    "labor_bureau": "群馬労働局",
    "labor_bureau_phone": "027-896-4734",
    "labor_bureau_address": "〒371-8567 群馬県前橋市大手町2-3-1 前橋地方合同庁舎8・9階",
    "driver_license_center": "群馬県総合交通センター",
    "driver_license_center_phone": "027-253-9300",
    "driver_license_center_address": "〒371-0846 群馬県前橋市元総社町80-4",
    "legal_affairs_bureau": "前橋地方法務局富岡支局",
    "legal_affairs_bureau_phone": "0274-62-0404",
    "legal_affairs_bureau_address": "〒370-2316 群馬県富岡市富岡1383-6",
    "transport_branch": "群馬運輸支局",
    "transport_branch_phone": "027-263-4440",
    "transport_branch_address": "〒371-0007 群馬県前橋市上泉町399番地の1",
    "tax_office": "富岡税務署",
    "tax_office_phone": "0274-63-2235",
    "tax_office_address": "〒370-2391 富岡市富岡2741番地の1"
  },
  "hayakawa": {
    "prefecture_name": "山梨県",
    "traffic_accident_consultation_phone": "055-223-1471",
    "hello_work_name": "ハローワーク鰍沢",
    "hello_work_phone": "0556-22-8689",
    "hello_work_address": "〒400-0601 山梨県南巨摩郡富士川町鰍沢1760-1",
    "police_station": "南部警察署",
    "police_station_phone": "0556-64-0110",
    "police_station_address": "〒409-2212 南巨摩郡南部町南部9335-1",
    "labor_bureau": "山梨労働局",
    "labor_bureau_phone": "055-225-2858",
    "labor_bureau_address": "〒400-8577 山梨県甲府市丸の内1丁目1番11号",
    "driver_license_center": "山梨県総合交通センター",
    "driver_license_center_phone": "055-285-0533",
    "driver_license_center_address": "〒400-0202 山梨県南アルプス市下高砂825",
    "legal_affairs_bureau": "甲府地方法務局鰍沢支局",
    "legal_affairs_bureau_phone": "0556-22-0148",
    "legal_affairs_bureau_address": "〒400-0601 南巨摩郡富士川町鰍沢1760番地1",
    "transport_branch": "山梨運輸支局",
    "transport_branch_phone": "055-261-0880",
    "transport_branch_address": "〒406-0034 山梨県笛吹市石和町唐柏1000-9",
    "tax_office": "鰍沢税務署",
    "tax_office_phone": "0570-00-5901",
    "tax_office_address": "〒400-8541 甲府市丸の内1丁目1番18号 甲府合同庁舎"
  }
};

Object.entries(municipalityVars).forEach(([municipalityId, vars]) => {
  const variablesDir = path.join(artifactsDir, municipalityId, 'variables');
  const singleFilePath = path.join(artifactsDir, municipalityId, 'variables.json');

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
    console.log(`⚠️  ${municipalityId}: variables.json or variables/ not found`);
    return;
  }

  // 変数を追加・更新
  let updated = 0;
  Object.entries(vars).forEach(([key, value]) => {
    // prefecture_nameは既に存在する可能性があるのでスキップ
    if (key === 'prefecture_name' && variables[key]) {
      return;
    }

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
