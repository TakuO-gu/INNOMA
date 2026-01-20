/**
 * sampleディレクトリの変数をデモ用デフォルト値に展開するスクリプト
 *
 * 実行: npx tsx scripts/expand-sample-variables.ts
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const ARTIFACTS_DIR = join(process.cwd(), "data/artifacts");
const SAMPLE_DIR = join(ARTIFACTS_DIR, "sample");

// デモ用デフォルト値
const DEMO_VARIABLES: Record<string, string> = {
  // 基本情報
  municipality_name: "サンプル市",
  prefecture_name: "東京都",
  generated_at: "2026-01-20",

  // 市役所基本情報
  city_hall_address: "〒100-0001 東京都サンプル市中央1-1-1",
  city_hall_hours: "平日 8:30〜17:15（土日祝日・年末年始を除く）",
  city_hall_phone: "03-1234-5678",
  city_hall_email: "info@sample-city.lg.jp",
  city_hall_department: "総務課",

  // 市民課・届出
  shimin_department: "市民課",
  shimin_phone: "03-1234-5679",
  shimin_email: "shimin@sample-city.lg.jp",
  registration_department: "市民課 届出窓口",
  registration_phone: "03-1234-5680",
  registration_email: "todokede@sample-city.lg.jp",
  registration_window: "市役所1階 市民課窓口",
  resident_department: "市民課",
  resident_phone: "03-1234-5681",
  resident_email: "jumin@sample-city.lg.jp",
  koseki_department: "市民課 戸籍係",
  koseki_phone: "03-1234-5682",
  koseki_email: "koseki@sample-city.lg.jp",
  mynumber_department: "市民課 マイナンバー窓口",
  mynumber_phone: "03-1234-5683",
  mynumber_email: "mynumber@sample-city.lg.jp",

  // 税務
  tax_department: "税務課",
  tax_phone: "03-1234-5690",
  tax_email: "zeimu@sample-city.lg.jp",
  zeimu_department: "税務課",
  zeimu_phone: "03-1234-5691",
  zeimu_email: "zeimu@sample-city.lg.jp",
  shisanzei_department: "税務課 資産税係",
  shisanzei_phone: "03-1234-5692",
  shisanzei_email: "shisanzei@sample-city.lg.jp",

  // 保険・年金
  kokuho_department: "保険年金課 国保係",
  kokuho_phone: "03-1234-5700",
  kokuho_email: "kokuho@sample-city.lg.jp",
  kokuho_address: "市役所2階 保険年金課",
  kokuho_hours: "平日 8:30〜17:15",
  kouki_department: "保険年金課 後期高齢者係",
  kouki_phone: "03-1234-5701",
  kouki_email: "kouki@sample-city.lg.jp",
  nenkin_department: "保険年金課 年金係",
  nenkin_phone: "03-1234-5702",
  nenkin_email: "nenkin@sample-city.lg.jp",

  // 福祉
  welfare_department: "福祉課",
  welfare_phone: "03-1234-5710",
  welfare_email: "fukushi@sample-city.lg.jp",
  koureisha_department: "福祉課 高齢者支援係",
  koureisha_phone: "03-1234-5711",
  koureisha_email: "koureisha@sample-city.lg.jp",
  kaigo_department: "福祉課 介護保険係",
  kaigo_phone: "03-1234-5712",
  kaigo_email: "kaigo@sample-city.lg.jp",
  shogai_department: "福祉課 障害福祉係",
  shogai_phone: "03-1234-5713",
  shogai_email: "shogai@sample-city.lg.jp",
  disability_department: "福祉課 障害福祉係",
  disability_phone: "03-1234-5713",
  disability_email: "shogai@sample-city.lg.jp",
  seikatsu_hogo_department: "福祉課 生活保護係",
  seikatsu_hogo_phone: "03-1234-5714",
  seikatsu_hogo_email: "hogo@sample-city.lg.jp",
  houkatsu_department: "地域包括支援センター",
  houkatsu_phone: "03-1234-5715",
  houkatsu_email: "houkatsu@sample-city.lg.jp",
  houkatsu_count: "5か所",
  houkatsu_list_url: "https://www.sample-city.lg.jp/houkatsu/list",

  // 子育て
  childcare_department: "子育て支援課",
  childcare_phone: "03-1234-5720",
  childcare_email: "kosodate@sample-city.lg.jp",
  kosodate_department: "子育て支援課",
  kosodate_phone: "03-1234-5720",
  kosodate_email: "kosodate@sample-city.lg.jp",
  boshi_department: "子育て支援課 母子保健係",
  boshi_phone: "03-1234-5721",
  boshi_email: "boshi@sample-city.lg.jp",
  boshi_madoguchi: "保健センター",
  nursery_department: "子育て支援課 保育係",
  nursery_phone: "03-1234-5722",
  nursery_email: "hoiku@sample-city.lg.jp",
  nursery_apply_department: "子育て支援課 保育係",
  nursery_apply_phone: "03-1234-5722",
  nursery_apply_email: "hoiku@sample-city.lg.jp",
  nursery_count: "15か所",
  nursery_apply_period: "毎年11月1日〜11月30日",
  nursery_apply_deadline: "11月30日",
  nursery_apply_year: "令和8年度",
  nursery_apply_month: "11月",
  nursery_apply_notice: "令和8年度保育所入所申込みを受け付けます",
  nursery_result_notice: "2月中旬",
  nursery_online_apply_url: "https://www.sample-city.lg.jp/nursery/apply",
  nursery_form_application_url: "https://www.sample-city.lg.jp/forms/nursery-application.pdf",
  nursery_form_employment_url: "https://www.sample-city.lg.jp/forms/employment-certificate.pdf",
  nursery_form_criteria_url: "https://www.sample-city.lg.jp/forms/nursery-criteria.pdf",
  nursery_form_guide_url: "https://www.sample-city.lg.jp/forms/nursery-guide.pdf",

  // 健康
  health_department: "健康推進課",
  health_phone: "03-1234-5730",
  health_email: "kenko@sample-city.lg.jp",
  kenshin_department: "健康推進課 健診係",
  kenshin_phone: "03-1234-5731",
  kenshin_email: "kenshin@sample-city.lg.jp",
  kenshin_period: "6月〜11月",
  yobosesshu_department: "健康推進課 予防接種係",
  yobosesshu_phone: "03-1234-5732",
  yobosesshu_email: "yobo@sample-city.lg.jp",

  // 環境
  environment_department: "環境課",
  environment_phone: "03-1234-5740",
  environment_email: "kankyo@sample-city.lg.jp",
  gomi_calendar_url: "https://www.sample-city.lg.jp/gomi/calendar",
  gomi_dashijikan: "収集日の朝8:00まで",
  gomi_app_description: "スマートフォンアプリ「サンプル市ごみ分別アプリ」でも確認できます",
  moeru_gomi_dashikata: "指定ごみ袋に入れて出してください",
  moenai_gomi_dashikata: "指定ごみ袋に入れて出してください",
  moenai_gomi_shushuhi: "月2回（第2・4水曜日）",
  shigen_gomi_shushuhi: "毎週木曜日",
  sodaigomi_phone: "03-1234-5741",
  sodaigomi_online_url: "https://www.sample-city.lg.jp/sodaigomi/apply",
  sodaigomi_reception_hours: "平日 8:30〜17:00",
  sodaigomi_fee_small: "300円",
  sodaigomi_fee_medium: "500円",
  sodaigomi_fee_large: "1,000円",
  sodaigomi_fee_xlarge: "2,000円",
  kaden_hikitori_basho: "市内の家電量販店または郵便局",

  // 防災
  bosai_department: "危機管理課",
  bosai_phone: "03-1234-5750",
  bosai_email: "bosai@sample-city.lg.jp",
  bosai_telephone: "0120-xxx-xxx",
  bosai_mail_touroku_url: "https://www.sample-city.lg.jp/bosai/mail",
  bosai_mail_address: "bosai@sample-city.lg.jp",
  disaster_department: "危機管理課",
  disaster_phone: "03-1234-5750",
  disaster_email: "bosai@sample-city.lg.jp",
  hinanjo_count: "50か所",
  shitei_hinanjo_count: "30か所",
  kinkyu_hinanbasho_count: "20か所",
  fukushi_hinanjo_count: "10か所",
  hinanjo_map_url: "https://www.sample-city.lg.jp/bosai/hinanjo-map",
  hinanjo_status_url: "https://www.sample-city.lg.jp/bosai/hinanjo-status",
  kozui_hazard_map_url: "https://www.sample-city.lg.jp/bosai/hazard-kozui",
  jishin_hazard_map_url: "https://www.sample-city.lg.jp/bosai/hazard-jishin",
  dosha_hazard_map_url: "https://www.sample-city.lg.jp/bosai/hazard-dosha",
  kozui_soutei_uryou: "総雨量690mm（48時間）",
  hazard_map_haifu_basho: "市役所、各出張所、図書館",

  // 住宅・建築
  housing_department: "住宅課",
  housing_phone: "03-1234-5760",
  housing_email: "jutaku@sample-city.lg.jp",
  building_department: "建築指導課",
  building_phone: "03-1234-5761",
  building_email: "kenchiku@sample-city.lg.jp",
  urban_planning_department: "都市計画課",
  urban_planning_phone: "03-1234-5762",
  urban_planning_email: "toshikeikaku@sample-city.lg.jp",
  development_department: "開発指導課",
  development_phone: "03-1234-5763",
  development_email: "kaihatsu@sample-city.lg.jp",
  land_department: "用地課",
  land_phone: "03-1234-5764",
  land_email: "yochi@sample-city.lg.jp",
  public_housing_schedule: "毎年4月・10月に募集",
  public_housing_rent_range: "月額15,000円〜50,000円程度",
  reform_subsidy_max: "20万円",
  reform_subsidy_rate: "工事費の10%",
  reform_application_period: "4月1日〜翌年2月末日",
  reform_general_eligible: "市内に住宅を所有する方",
  seismic_diagnosis_max: "10万円",
  seismic_diagnosis_rate: "費用の2/3",
  seismic_retrofit_max: "100万円",
  seismic_retrofit_rate: "工事費の23%",
  vacant_house_subsidy_max: "50万円",
  vacant_house_subsidy_rate: "工事費の1/2",
  housing_benefit_single: "53,700円",
  housing_benefit_couple: "64,000円",

  // 産業・農林水産
  business_department: "産業振興課",
  business_phone: "03-1234-5770",
  business_email: "sangyo@sample-city.lg.jp",
  agriculture_department: "農業振興課",
  agriculture_phone: "03-1234-5771",
  agriculture_email: "nogyo@sample-city.lg.jp",
  forestry_department: "農業振興課 林業係",
  forestry_phone: "03-1234-5772",
  forestry_email: "ringyo@sample-city.lg.jp",
  fishery_department: "農業振興課 水産係",
  fishery_phone: "03-1234-5773",
  fishery_email: "suisan@sample-city.lg.jp",
  wildlife_department: "農業振興課 鳥獣対策係",
  wildlife_phone: "03-1234-5774",
  wildlife_email: "choju@sample-city.lg.jp",
  wildlife_fence_subsidy_rate: "費用の1/2（上限10万円）",
  wildlife_fence_application_period: "4月1日〜12月28日",
  new_farmer_support_program: "新規就農者支援事業",
  new_farmer_consultation: "就農相談は随時受付中",
  local_business_subsidy_description: "市内事業者向け各種補助金制度があります",

  // 雇用
  employment_department: "産業振興課 雇用対策係",
  employment_phone: "03-1234-5775",
  employment_email: "koyo@sample-city.lg.jp",
  minimum_wage: "1,163円",
  minimum_wage_effective_date: "令和7年10月1日",

  // 運転・車両
  driving_department: "市民課 届出窓口",
  driving_phone: "03-1234-5680",
  driving_email: "todokede@sample-city.lg.jp",
  municipal_parking_info: "市営駐車場は市役所周辺に3か所あります",
  bicycle_parking_daily: "100円",
  bicycle_parking_monthly: "2,000円",
  childseat_subsidy_description: "チャイルドシート購入費の1/2を補助（上限5,000円）",
  license_return_support_1: "運転経歴証明書の手数料補助（1,100円）",
  license_return_support_2: "公共交通機関の回数券贈呈（5,000円分）",

  // 国籍・外国人
  nationality_department: "市民課 戸籍係",
  nationality_phone: "03-1234-5682",
  nationality_email: "koseki@sample-city.lg.jp",
  multicultural_department: "市民協働課 多文化共生係",
  multicultural_phone: "03-1234-5780",
  multicultural_email: "tabunka@sample-city.lg.jp",
  multilingual_languages: "英語、中国語、韓国語、ベトナム語",
  multilingual_consultation_hours: "毎週水曜日 10:00〜16:00",
  foreign_consultation_languages: "英語、中国語、韓国語",
  japanese_class_schedule: "毎週土曜日 10:00〜12:00",
  japanese_class_location: "市民活動センター",
  japanese_class_fee: "無料（教材費実費）",
  japanese_class_application: "随時受付中",

  // 市民参加
  civic_department: "市民協働課",
  civic_phone: "03-1234-5781",
  civic_email: "kyodo@sample-city.lg.jp",
  election_commission: "選挙管理委員会",
  election_commission_phone: "03-1234-5782",
  election_commission_email: "senkyo@sample-city.lg.jp",
  audit_commission: "監査委員事務局",
  audit_commission_phone: "03-1234-5783",
  audit_commission_email: "kansa@sample-city.lg.jp",
  agricultural_commission: "農業委員会事務局",
  agricultural_commission_phone: "03-1234-5784",
  agricultural_commission_email: "noui@sample-city.lg.jp",
  agricultural_commission_meeting_day: "毎月第3金曜日",
  disclosure_department: "総務課 情報公開係",
  disclosure_phone: "03-1234-5785",
  disclosure_email: "joho@sample-city.lg.jp",
  privacy_department: "総務課 情報公開係",
  privacy_phone: "03-1234-5785",
  privacy_email: "joho@sample-city.lg.jp",
  planning_department: "企画課",
  planning_phone: "03-1234-5786",
  planning_email: "kikaku@sample-city.lg.jp",

  // 法務・支援
  legal_department: "総務課 法務係",
  legal_phone: "03-1234-5787",
  legal_email: "homu@sample-city.lg.jp",
  legal_consultation_schedule: "毎月第2・4火曜日 13:00〜16:00",
  legal_consultation_reservation: "要予約（電話または窓口にて）",
  victim_support_department: "福祉課 相談支援係",
  victim_support_phone: "03-1234-5788",
  victim_support_email: "sodan@sample-city.lg.jp",
  victim_support_center_phone: "0120-xxx-xxx",
  victim_support_benefit: "見舞金30万円〜100万円",
  benefits_department: "福祉課 給付係",
  benefits_phone: "03-1234-5789",
  benefits_email: "kyufu@sample-city.lg.jp",

  // 外部機関
  hello_work_name: "ハローワークサンプル",
  hello_work_address: "東京都サンプル市中央2-2-2",
  hello_work_phone: "03-2345-6789",
  pension_office: "サンプル年金事務所",
  pension_office_address: "東京都サンプル市中央3-3-3",
  pension_office_phone: "03-3456-7890",
  tax_office: "サンプル税務署",
  tax_office_address: "東京都サンプル市中央4-4-4",
  tax_office_phone: "03-4567-8901",
  legal_affairs_bureau: "東京法務局サンプル出張所",
  legal_affairs_bureau_address: "東京都サンプル市中央5-5-5",
  legal_affairs_bureau_phone: "03-5678-9012",
  labor_bureau: "東京労働局",
  labor_bureau_address: "東京都千代田区九段南1-2-1",
  labor_bureau_phone: "03-6789-0123",
  labor_standards_office: "サンプル労働基準監督署",
  labor_standards_office_address: "東京都サンプル市中央6-6-6",
  labor_standards_office_phone: "03-7890-1234",
  police_station: "サンプル警察署",
  police_station_address: "東京都サンプル市中央7-7-7",
  police_station_phone: "03-8901-2345",
  driver_license_center: "東京都運転免許センター",
  driver_license_center_address: "東京都府中市多磨町3-1-1",
  driver_license_center_phone: "03-9012-3456",
  transport_branch: "関東運輸局東京運輸支局",
  transport_branch_address: "東京都品川区東大井1-12-17",
  transport_branch_phone: "050-5540-2030",
  passport_office_name: "東京都パスポートセンター",
  passport_office_address: "東京都新宿区西新宿2-8-1",
  passport_office_phone: "03-5321-7711",
  immigration_bureau: "東京出入国在留管理局",
  immigration_bureau_address: "東京都港区港南5-5-30",
  immigration_bureau_phone: "0570-034259",
  international_association: "サンプル市国際交流協会",
  international_association_address: "東京都サンプル市中央1-1-2",
  international_association_phone: "03-1234-5800",
  international_association_email: "kokusai@sample-city.lg.jp",
  silver_center_address: "東京都サンプル市中央1-1-3",
  silver_center_phone: "03-1234-5801",
  silver_center_email: "silver@sample-city.lg.jp",
  silver_center_fee: "年会費2,000円",
  traffic_accident_consultation_phone: "03-1234-5802",

  // 料金・手数料
  juminhyo_fee: "300円",
  juminhyo_convenience_fee: "200円",
  juminhyo_kisai_fee: "300円",
  jyuminhyo_fee: "300円",
  jyuminhyo_form_url: "https://www.sample-city.lg.jp/forms/juminhyo.pdf",
  jyuminhyo_kisai_fee: "300円",
  juminhyo_madoguchi: "市役所1階 市民課窓口、各出張所",
  koseki_fee: "450円",
  kaisei_koseki_fee: "750円",
  jokoseki_fee: "750円",
  koseki_form_url: "https://www.sample-city.lg.jp/forms/koseki.pdf",
  inkan_touroku_fee: "300円",
  inkan_shomei_fee: "300円",
  inkan_shomei_convenience_fee: "200円",
  inin_form_url: "https://www.sample-city.lg.jp/forms/inin.pdf",
  fuhyo_fee: "300円",
  convenience_discount: "100円",

  // 健診・予防接種料金
  tokutei_kenshin_fee: "無料",
  kouki_kenshin_fee: "無料",
  gan_i_xray_fee: "1,000円",
  gan_i_naishikyo_fee: "3,000円",
  gan_hai_fee: "500円",
  gan_daicho_fee: "500円",
  gan_nyu_fee: "1,500円",
  gan_shikyukei_fee: "1,000円",
  influenza_fee: "2,500円",
  influenza_period: "10月1日〜翌年1月31日",
  haienkyukin_fee: "4,000円",
  taijohosin_live_subsidy: "10,800円",
  taijohosin_inactivated_subsidy: "10,800円",
  ninpu_kenshin_josei: "14回分（上限計98,000円）",
  sango_care_fee: "1日あたり2,500円（上限7日）",
  ikuji_sodan_schedule: "毎月第1・3水曜日",
  ikuji_sodan_basho: "保健センター",
  ikuji_sodan_yoyaku: "要予約",

  // 保険料率等
  kouki_shotoku_wari_rate: "9.49%",
  kouki_kinto_wari: "47,300円",
  kouki_sousaihi: "70,000円",
  kaigo_kijun_gaku: "6,800円",
  toshikeikaku_rate: "0.3%",

  // 税納期
  juminzei_kigen_1: "6月30日",
  juminzei_kigen_2: "8月31日",
  juminzei_kigen_3: "10月31日",
  juminzei_kigen_4: "翌年1月31日",
  juminzei_kinto_shi: "3,000円",
  juminzei_kinto_ken: "1,000円",
  kotei_kigen_1: "4月30日",
  kotei_kigen_2: "7月31日",
  kotei_kigen_3: "12月28日",
  kotei_kigen_4: "翌年2月末日",
  keijidosha_kigen: "5月31日",

  // その他
  okuyami_madoguchi_description: "ご遺族の手続きをワンストップでサポートします",
  after_hours_shussei: "夜間・休日の届出は宿直室で受付",
};

/**
 * ディレクトリ内のすべてのJSONファイルを再帰的に取得
 */
async function getAllJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllJsonFiles(fullPath)));
    } else if (entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 変数を置換
 */
function replaceVariables(content: string): { content: string; replaced: string[]; unreplaced: string[] } {
  const replaced: string[] = [];
  const unreplaced: string[] = [];
  const pattern = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;

  const result = content.replace(pattern, (match, varName) => {
    const normalizedName = varName.toLowerCase();
    if (normalizedName in DEMO_VARIABLES) {
      if (!replaced.includes(normalizedName)) {
        replaced.push(normalizedName);
      }
      return DEMO_VARIABLES[normalizedName];
    } else {
      if (!unreplaced.includes(normalizedName)) {
        unreplaced.push(normalizedName);
      }
      return match;
    }
  });

  return { content: result, replaced, unreplaced };
}

async function main() {
  console.log("sampleディレクトリの変数を展開します...\n");

  const files = await getAllJsonFiles(SAMPLE_DIR);
  const totalReplaced = new Set<string>();
  const totalUnreplaced = new Set<string>();

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const { content: newContent, replaced, unreplaced } = replaceVariables(content);

    replaced.forEach(v => totalReplaced.add(v));
    unreplaced.forEach(v => totalUnreplaced.add(v));

    if (replaced.length > 0) {
      await writeFile(file, newContent);
      console.log(`✓ ${file.replace(SAMPLE_DIR + "/", "")}`);
    }
  }

  console.log(`\n=== 完了 ===`);
  console.log(`処理ファイル数: ${files.length}`);
  console.log(`置換した変数: ${totalReplaced.size}種類`);

  if (totalUnreplaced.size > 0) {
    console.log(`\n⚠ 未定義の変数 (${totalUnreplaced.size}種類):`);
    Array.from(totalUnreplaced).sort().forEach(v => console.log(`  - {{${v}}}`));
  }
}

main().catch(console.error);
