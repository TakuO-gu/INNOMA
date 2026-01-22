/**
 * Variable Priority Configuration
 * Defines which variables to fetch first and their importance
 */

import { VariableDefinition, VariablePriority, ServiceDefinition } from './types';

/**
 * High priority variables - fetched first for all municipalities
 */
export const highPriorityVariables: VariableDefinition[] = [
  // Basic contact info
  {
    name: 'city_hall_address',
    description: '役所住所',
    category: 'basic',
    priority: 'high',
  },
  {
    name: 'city_hall_hours',
    description: '開庁時間',
    category: 'basic',
    priority: 'high',
    examples: ['平日8:30-17:15'],
  },
  {
    name: 'city_hall_phone',
    description: '代表電話',
    category: 'basic',
    priority: 'high',
    validationPattern: '^\\d{2,5}-\\d{2,4}-\\d{4}$',
  },
  {
    name: 'city_hall_email',
    description: '代表メール',
    category: 'basic',
    priority: 'high',
    validationPattern: '^[\\w.-]+@[\\w.-]+\\.[a-z]{2,}$',
  },
  // Main department contacts
  {
    name: 'shimin_department',
    description: '市民課担当部署名',
    category: 'contact',
    priority: 'high',
  },
  {
    name: 'shimin_phone',
    description: '市民課電話番号',
    category: 'contact',
    priority: 'high',
  },
  // Certificate fees
  {
    name: 'juminhyo_fee',
    description: '住民票手数料',
    category: 'fee',
    priority: 'high',
    examples: ['300円'],
  },
  {
    name: 'koseki_fee',
    description: '戸籍謄本手数料',
    category: 'fee',
    priority: 'high',
    examples: ['450円'],
  },
  {
    name: 'inkan_shomei_fee',
    description: '印鑑証明手数料',
    category: 'fee',
    priority: 'high',
    examples: ['300円'],
  },
];

/**
 * Service definitions with associated variables and search keywords
 * テンプレート(_templates/services/)のカテゴリ構造に対応
 */
export const serviceDefinitions: ServiceDefinition[] = [
  // 届出・申請・証明書 (registration)
  {
    id: 'registration',
    name: 'Registration Services',
    nameJa: '届出・申請・証明書',
    variables: [
      'registration_department',
      'registration_email',
      'registration_phone',
      'registration_window',
      'shimin_department',
      'shimin_email',
      'shimin_phone',
      'mynumber_department',
      'mynumber_email',
      'mynumber_phone',
      'juminhyo_fee',
      'juminhyo_convenience_fee',
      'juminhyo_kisai_fee',
      'juminhyo_madoguchi',
      'jyuminhyo_fee',
      'jyuminhyo_form_url',
      'jyuminhyo_kisai_fee',
      'koseki_fee',
      'koseki_form_url',
      'kaisei_koseki_fee',
      'jokoseki_fee',
      'inkan_touroku_fee',
      'inkan_shomei_fee',
      'inkan_shomei_convenience_fee',
      'fuhyo_fee',
      'inin_form_url',
      'convenience_discount',
      'after_hours_shussei',
      'okuyami_madoguchi_description',
    ],
    searchKeywords: ['住民票', '戸籍', '印鑑証明', '転入届', '転出届', 'マイナンバー', '届出', '証明書'],
  },
  // 税金 (tax)
  {
    id: 'tax',
    name: 'Tax Services',
    nameJa: '税金',
    variables: [
      'tax_department',
      'tax_email',
      'tax_phone',
      'zeimu_department',
      'zeimu_email',
      'zeimu_phone',
      'shisanzei_department',
      'shisanzei_email',
      'shisanzei_phone',
      'juminzei_kinto_ken',
      'juminzei_kinto_shi',
      'keijidosha_kigen',
      'toshikeikaku_rate',
    ],
    searchKeywords: ['住民税', '固定資産税', '税務課', '納税', '軽自動車税'],
  },
  // 健康・医療 (health)
  {
    id: 'health',
    name: 'Health Services',
    nameJa: '健康・医療',
    variables: [
      'health_department',
      'health_email',
      'health_phone',
      'kenshin_department',
      'kenshin_email',
      'kenshin_period',
      'kenshin_phone',
      'yobosesshu_department',
      'yobosesshu_email',
      'yobosesshu_phone',
      'kokuho_address',
      'kokuho_department',
      'kokuho_email',
      'kokuho_hours',
      'kokuho_limit_care',
      'kokuho_limit_medical',
      'kokuho_limit_support',
      'kokuho_limit_total',
      'kokuho_phone',
      'kouki_department',
      'kouki_email',
      'kouki_kenshin_fee',
      'kouki_kinto_wari',
      'kouki_phone',
      'kouki_shotoku_wari_rate',
      'kouki_sousaihi',
      'tokutei_kenshin_fee',
      'gan_daicho_fee',
      'gan_hai_fee',
      'gan_i_naishikyo_fee',
      'gan_i_xray_fee',
      'gan_nyu_fee',
      'gan_shikyukei_fee',
      'haienkyukin_fee',
      'influenza_fee',
      'influenza_period',
      'taijohosin_inactivated_subsidy',
      'taijohosin_live_subsidy',
    ],
    searchKeywords: ['健康診査', '特定健診', '国民健康保険', '後期高齢者医療', 'がん検診', '予防接種'],
  },
  // 子育て・保育 (childcare)
  {
    id: 'childcare',
    name: 'Childcare Services',
    nameJa: '子育て・保育',
    variables: [
      'childcare_department',
      'childcare_email',
      'childcare_phone',
      'kosodate_department',
      'kosodate_email',
      'kosodate_phone',
      'boshi_department',
      'boshi_email',
      'boshi_madoguchi',
      'boshi_phone',
      'nursery_apply_deadline',
      'nursery_apply_department',
      'nursery_apply_email',
      'nursery_apply_month',
      'nursery_apply_notice',
      'nursery_apply_period',
      'nursery_apply_phone',
      'nursery_apply_year',
      'nursery_count',
      'nursery_department',
      'nursery_email',
      'nursery_form_application_url',
      'nursery_form_criteria_url',
      'nursery_form_employment_url',
      'nursery_form_guide_url',
      'nursery_online_apply_url',
      'nursery_phone',
      'nursery_result_notice',
      'ikuji_sodan_basho',
      'ikuji_sodan_schedule',
      'ikuji_sodan_yoyaku',
      'ninpu_kenshin_josei',
      'sango_care_fee',
    ],
    searchKeywords: ['保育所', '保育園', '子育て支援', '入所申込', '児童手当', '母子手帳'],
  },
  // 福祉 (welfare)
  {
    id: 'welfare',
    name: 'Welfare Services',
    nameJa: '福祉',
    variables: [
      'welfare_department',
      'welfare_email',
      'welfare_phone',
      'koureisha_department',
      'koureisha_email',
      'koureisha_phone',
      'kaigo_department',
      'kaigo_email',
      'kaigo_kijun_gaku',
      'kaigo_phone',
      'shogai_department',
      'shogai_email',
      'shogai_phone',
      'seikatsu_hogo_department',
      'seikatsu_hogo_email',
      'seikatsu_hogo_phone',
      'houkatsu_count',
      'houkatsu_department',
      'houkatsu_email',
      'houkatsu_list_url',
      'houkatsu_phone',
    ],
    searchKeywords: ['福祉課', '高齢者福祉', '介護保険', '障害福祉', '生活保護', '地域包括'],
  },
  // 環境・ごみ (environment)
  {
    id: 'environment',
    name: 'Environment Services',
    nameJa: '環境・ごみ',
    variables: [
      'environment_department',
      'environment_email',
      'environment_phone',
      'gomi_app_description',
      'gomi_calendar_url',
      'gomi_dashijikan',
      'kaden_hikitori_basho',
      'moenai_gomi_dashikata',
      'moenai_gomi_shushuhi',
      'moeru_gomi_dashikata',
      'shigen_gomi_shushuhi',
      'sodaigomi_fee_large',
      'sodaigomi_fee_medium',
      'sodaigomi_fee_small',
      'sodaigomi_fee_xlarge',
      'sodaigomi_online_url',
      'sodaigomi_phone',
      'sodaigomi_reception_hours',
    ],
    searchKeywords: ['粗大ごみ', 'ごみ収集', '環境課', 'リサイクル', '家電リサイクル'],
  },
  // 防災 (disaster)
  {
    id: 'disaster',
    name: 'Disaster Prevention',
    nameJa: '防災',
    variables: [
      'bosai_department',
      'bosai_email',
      'bosai_mail_address',
      'bosai_mail_touroku_url',
      'bosai_phone',
      'bosai_telephone',
      'disaster_department',
      'disaster_email',
      'disaster_phone',
      'dosha_hazard_map_url',
      'fukushi_hinanjo_count',
      'hazard_map_haifu_basho',
      'hinanjo_count',
      'hinanjo_map_url',
      'hinanjo_status_url',
      'jishin_hazard_map_url',
      'kinkyu_hinanbasho_count',
      'kozui_hazard_map_url',
      'kozui_soutei_uryou',
      'shitei_hinanjo_count',
    ],
    searchKeywords: ['防災', '避難所', 'ハザードマップ', '災害', '防災メール'],
  },
  // 住宅・建築 (housing)
  {
    id: 'housing',
    name: 'Housing Services',
    nameJa: '住宅・建築',
    variables: [
      'housing_department',
      'housing_email',
      'housing_phone',
      'building_department',
      'building_email',
      'building_phone',
      'housing_benefit_couple',
      'housing_benefit_single',
      'public_housing_rent_range',
      'public_housing_schedule',
      'reform_application_period',
      'reform_general_eligible',
      'reform_subsidy_max',
      'reform_subsidy_rate',
      'seismic_diagnosis_max',
      'seismic_diagnosis_rate',
      'seismic_retrofit_max',
      'seismic_retrofit_rate',
      'vacant_house_subsidy_max',
      'vacant_house_subsidy_rate',
    ],
    searchKeywords: ['住宅', '建築確認', '公営住宅', '耐震', 'リフォーム補助'],
  },
  // 雇用・労働 (employment)
  {
    id: 'employment',
    name: 'Employment Services',
    nameJa: '雇用・労働',
    variables: [
      'employment_department',
      'employment_email',
      'employment_phone',
      'disability_department',
      'disability_email',
      'disability_phone',
      'hello_work_address',
      'hello_work_name',
      'hello_work_phone',
      'labor_bureau',
      'labor_bureau_address',
      'labor_bureau_phone',
      'labor_standards_office',
      'labor_standards_office_address',
      'labor_standards_office_phone',
      'minimum_wage',
      'minimum_wage_effective_date',
      'silver_center_address',
      'silver_center_email',
      'silver_center_fee',
      'silver_center_phone',
    ],
    searchKeywords: ['ハローワーク', '雇用', '労働基準監督署', 'シルバー人材', '障害者雇用'],
  },
  // 運転・車 (driving)
  {
    id: 'driving',
    name: 'Driving Services',
    nameJa: '運転・車',
    variables: [
      'driving_department',
      'driving_email',
      'driving_phone',
      'driver_license_center',
      'driver_license_center_address',
      'driver_license_center_phone',
      'transport_branch',
      'transport_branch_address',
      'transport_branch_phone',
      'police_station',
      'police_station_address',
      'police_station_phone',
      'bicycle_parking_daily',
      'bicycle_parking_monthly',
      'childseat_subsidy_description',
      'municipal_parking_info',
      'traffic_accident_consultation_phone',
    ],
    searchKeywords: ['運転免許', '車検', '車庫証明', '駐車場', '自動車税'],
  },
  // 事業・産業 (business)
  {
    id: 'business',
    name: 'Business Services',
    nameJa: '事業・産業',
    variables: [
      'business_department',
      'business_email',
      'business_phone',
      'legal_affairs_bureau',
      'legal_affairs_bureau_address',
      'legal_affairs_bureau_phone',
      'local_business_subsidy_description',
      'pension_office',
      'pension_office_address',
      'pension_office_phone',
      'tax_office',
      'tax_office_address',
      'tax_office_phone',
    ],
    searchKeywords: ['起業', '法人設立', '補助金', '事業承継', '融資'],
  },
  // 土地・農林水産 (land)
  {
    id: 'land',
    name: 'Land & Agriculture Services',
    nameJa: '土地・農林水産',
    variables: [
      'land_department',
      'land_email',
      'land_phone',
      'agriculture_department',
      'agriculture_email',
      'agriculture_phone',
      'agricultural_commission',
      'agricultural_commission_email',
      'agricultural_commission_meeting_day',
      'agricultural_commission_phone',
      'development_department',
      'development_email',
      'development_phone',
      'fishery_department',
      'fishery_email',
      'fishery_phone',
      'forestry_department',
      'forestry_email',
      'forestry_phone',
      'urban_planning_department',
      'urban_planning_email',
      'urban_planning_phone',
      'wildlife_department',
      'wildlife_email',
      'wildlife_fence_application_period',
      'wildlife_fence_subsidy_rate',
      'wildlife_phone',
      'new_farmer_consultation',
      'new_farmer_support_program',
    ],
    searchKeywords: ['農地', '開発許可', '都市計画', '農業委員会', '林業', '水産'],
  },
  // 外国人・国籍 (nationality)
  {
    id: 'nationality',
    name: 'Nationality Services',
    nameJa: '外国人・国籍',
    variables: [
      'nationality_department',
      'nationality_email',
      'nationality_phone',
      'multicultural_department',
      'multicultural_email',
      'multicultural_phone',
      'immigration_bureau',
      'immigration_bureau_address',
      'immigration_bureau_phone',
      'international_association',
      'international_association_address',
      'international_association_email',
      'international_association_phone',
      'passport_office_address',
      'passport_office_name',
      'passport_office_phone',
      'koseki_department',
      'koseki_email',
      'koseki_phone',
      'resident_department',
      'resident_email',
      'resident_phone',
      'foreign_consultation_languages',
      'japanese_class_application',
      'japanese_class_fee',
      'japanese_class_location',
      'japanese_class_schedule',
      'multilingual_consultation_hours',
      'multilingual_languages',
    ],
    searchKeywords: ['パスポート', '在留カード', '帰化', '国際結婚', '外国人相談'],
  },
  // 市民参加・選挙 (civic)
  {
    id: 'civic',
    name: 'Civic Services',
    nameJa: '市民参加・選挙',
    variables: [
      'civic_department',
      'civic_email',
      'civic_phone',
      'election_commission',
      'election_commission_email',
      'election_commission_phone',
      'audit_commission',
      'audit_commission_email',
      'audit_commission_phone',
      'disclosure_department',
      'disclosure_email',
      'disclosure_phone',
      'planning_department',
      'planning_email',
      'planning_phone',
      'privacy_department',
      'privacy_email',
      'privacy_phone',
      'legal_department',
      'legal_email',
      'legal_phone',
      'legal_consultation_reservation',
      'legal_consultation_schedule',
      'victim_support_benefit',
      'victim_support_center_phone',
      'victim_support_department',
      'victim_support_email',
      'victim_support_phone',
    ],
    searchKeywords: ['選挙', '情報公開', '個人情報', '法律相談', '監査'],
  },
  // 年金・給付 (benefits)
  {
    id: 'benefits',
    name: 'Benefits Services',
    nameJa: '年金・給付',
    variables: [
      'benefits_department',
      'benefits_email',
      'benefits_phone',
      'nenkin_department',
      'nenkin_email',
      'nenkin_phone',
    ],
    searchKeywords: ['年金', '給付金', '国民年金', '厚生年金'],
  },
];

/**
 * Get variables by priority
 */
export function getVariablesByPriority(priority: VariablePriority): VariableDefinition[] {
  return highPriorityVariables.filter((v) => v.priority === priority);
}

/**
 * Get service definition by ID
 */
export function getServiceDefinition(serviceId: string): ServiceDefinition | undefined {
  return serviceDefinitions.find((s) => s.id === serviceId);
}

/**
 * Get all variables for a service
 */
export function getServiceVariables(serviceId: string): string[] {
  const service = getServiceDefinition(serviceId);
  return service?.variables || [];
}

/**
 * 全変数の説明マップ
 * LLMが適切な情報を抽出できるよう、変数の意味を明確に定義
 */
export const variableDescriptions: Record<string, { description: string; examples?: string[] }> = {
  // 環境・ごみ系
  environment_department: { description: '環境課の担当部署名', examples: ['環境政策課', '環境センター'] },
  environment_email: { description: '環境課のメールアドレス' },
  environment_phone: { description: '環境課の電話番号' },
  gomi_app_description: { description: 'ごみ分別アプリの説明・名称', examples: ['ごみ分別アプリ「〇〇」'] },
  gomi_calendar_url: { description: 'ごみ収集カレンダーのURL' },
  gomi_dashijikan: { description: 'ごみを出す時間（朝何時までに出すか）', examples: ['朝8時まで', '午前8時30分まで'] },
  kaden_hikitori_basho: { description: '家電リサイクルの引取場所', examples: ['〇〇電気店', '市指定引取場所'] },
  moenai_gomi_dashikata: { description: '燃やせないごみの出し方（袋の種類、縛り方など）', examples: ['透明の袋に入れて出す', '指定袋に入れて出す'] },
  moenai_gomi_shushuhi: { description: '燃やせないごみの収集頻度・曜日', examples: ['週1回', '毎週水曜日'] },
  moeru_gomi_dashikata: { description: '燃やせるごみの出し方（袋の種類、縛り方など）', examples: ['透明または半透明の袋に入れて出す', '市指定のごみ袋を使用'] },
  shigen_gomi_shushuhi: { description: '資源ごみの収集頻度・曜日', examples: ['週1回', '毎月第2・4火曜日'] },
  sodaigomi_fee_small: { description: '粗大ごみ処理手数料（小型品）', examples: ['200円', '300円'] },
  sodaigomi_fee_medium: { description: '粗大ごみ処理手数料（中型品）', examples: ['500円', '600円'] },
  sodaigomi_fee_large: { description: '粗大ごみ処理手数料（大型品）', examples: ['1,000円', '1,200円'] },
  sodaigomi_fee_xlarge: { description: '粗大ごみ処理手数料（特大品）', examples: ['1,500円', '2,000円'] },
  sodaigomi_online_url: { description: '粗大ごみのオンライン申込URL' },
  sodaigomi_phone: { description: '粗大ごみ受付の電話番号' },
  sodaigomi_reception_hours: { description: '粗大ごみ受付の受付時間', examples: ['平日8:30-17:00'] },

  // 防災系
  bosai_department: { description: '防災課の担当部署名' },
  bosai_email: { description: '防災課のメールアドレス' },
  bosai_mail_address: { description: '防災メール登録用アドレス' },
  bosai_mail_touroku_url: { description: '防災メール登録URL' },
  bosai_phone: { description: '防災課の電話番号' },
  bosai_telephone: { description: '防災専用ダイヤル' },
  disaster_department: { description: '災害対策課の担当部署名' },
  disaster_email: { description: '災害対策課のメールアドレス' },
  disaster_phone: { description: '災害対策課の電話番号' },
  dosha_hazard_map_url: { description: '土砂災害ハザードマップのURL' },
  fukushi_hinanjo_count: { description: '福祉避難所の数' },
  hazard_map_haifu_basho: { description: 'ハザードマップの配布場所', examples: ['市役所1階', '各支所'] },
  hinanjo_count: { description: '指定避難所の総数' },
  hinanjo_map_url: { description: '避難所マップのURL' },
  hinanjo_status_url: { description: '避難所の開設状況確認URL' },
  jishin_hazard_map_url: { description: '地震ハザードマップのURL' },
  kinkyu_hinanbasho_count: { description: '緊急避難場所の数' },
  kozui_hazard_map_url: { description: '洪水ハザードマップのURL' },
  kozui_soutei_uryou: { description: '洪水想定雨量', examples: ['1時間80mm', '24時間400mm'] },
  shitei_hinanjo_count: { description: '指定避難所の数' },

  // 住宅・建築系
  housing_department: { description: '住宅課の担当部署名' },
  housing_email: { description: '住宅課のメールアドレス' },
  housing_phone: { description: '住宅課の電話番号' },
  building_department: { description: '建築指導課の担当部署名' },
  building_email: { description: '建築指導課のメールアドレス' },
  building_phone: { description: '建築指導課の電話番号' },
  housing_benefit_couple: { description: '新婚世帯向け住宅補助金の上限額', examples: ['30万円', '60万円'] },
  housing_benefit_single: { description: '単身者向け住宅補助金の上限額', examples: ['15万円', '30万円'] },
  public_housing_rent_range: { description: '公営住宅の家賃範囲', examples: ['1万円〜5万円'] },
  public_housing_schedule: { description: '公営住宅の募集時期', examples: ['年2回（4月・10月）'] },
  reform_application_period: { description: 'リフォーム補助金の申請期間' },
  reform_general_eligible: { description: 'リフォーム補助金の対象条件' },
  reform_subsidy_max: { description: 'リフォーム補助金の上限額', examples: ['50万円', '100万円'] },
  reform_subsidy_rate: { description: 'リフォーム補助金の補助率', examples: ['1/3', '1/2'] },
  seismic_diagnosis_max: { description: '耐震診断補助金の上限額', examples: ['5万円', '10万円'] },
  seismic_diagnosis_rate: { description: '耐震診断補助金の補助率', examples: ['2/3', '全額'] },
  seismic_retrofit_max: { description: '耐震改修補助金の上限額', examples: ['100万円', '150万円'] },
  seismic_retrofit_rate: { description: '耐震改修補助金の補助率', examples: ['1/2', '2/3'] },
  vacant_house_subsidy_max: { description: '空き家活用補助金の上限額', examples: ['50万円', '100万円'] },
  vacant_house_subsidy_rate: { description: '空き家活用補助金の補助率', examples: ['1/2', '2/3'] },

  // 雇用・労働系
  employment_department: { description: '雇用対策課の担当部署名' },
  employment_email: { description: '雇用対策課のメールアドレス' },
  employment_phone: { description: '雇用対策課の電話番号' },
  disability_department: { description: '障害者雇用支援の担当部署名' },
  disability_email: { description: '障害者雇用支援のメールアドレス' },
  disability_phone: { description: '障害者雇用支援の電話番号' },
  hello_work_address: { description: 'ハローワークの住所' },
  hello_work_name: { description: 'ハローワークの名称', examples: ['ハローワーク〇〇'] },
  hello_work_phone: { description: 'ハローワークの電話番号' },
  labor_bureau: { description: '労働局の名称', examples: ['〇〇労働局'] },
  labor_bureau_address: { description: '労働局の住所' },
  labor_bureau_phone: { description: '労働局の電話番号' },
  labor_standards_office: { description: '労働基準監督署の名称', examples: ['〇〇労働基準監督署'] },
  labor_standards_office_address: { description: '労働基準監督署の住所' },
  labor_standards_office_phone: { description: '労働基準監督署の電話番号' },
  minimum_wage: { description: '地域別最低賃金', examples: ['1,000円', '1,050円'] },
  minimum_wage_effective_date: { description: '最低賃金の発効日', examples: ['10月1日'] },
  silver_center_address: { description: 'シルバー人材センターの住所' },
  silver_center_email: { description: 'シルバー人材センターのメールアドレス' },
  silver_center_fee: { description: 'シルバー人材センターの入会費', examples: ['年会費2,000円'] },
  silver_center_phone: { description: 'シルバー人材センターの電話番号' },

  // 運転・車系
  driving_department: { description: '交通政策課の担当部署名' },
  driving_email: { description: '交通政策課のメールアドレス' },
  driving_phone: { description: '交通政策課の電話番号' },
  driver_license_center: { description: '運転免許センターの名称', examples: ['〇〇運転免許センター'] },
  driver_license_center_address: { description: '運転免許センターの住所' },
  driver_license_center_phone: { description: '運転免許センターの電話番号' },
  transport_branch: { description: '運輸支局の名称', examples: ['〇〇運輸支局'] },
  transport_branch_address: { description: '運輸支局の住所' },
  transport_branch_phone: { description: '運輸支局の電話番号' },
  police_station: { description: '警察署の名称', examples: ['〇〇警察署'] },
  police_station_address: { description: '警察署の住所' },
  police_station_phone: { description: '警察署の電話番号' },
  bicycle_parking_daily: { description: '市営駐輪場の1日料金', examples: ['100円', '150円'] },
  bicycle_parking_monthly: { description: '市営駐輪場の月極料金', examples: ['1,500円', '2,000円'] },
  childseat_subsidy_description: { description: 'チャイルドシート補助制度の説明' },
  municipal_parking_info: { description: '市営駐車場の案内' },
  traffic_accident_consultation_phone: { description: '交通事故相談の電話番号' },

  // 事業・産業系
  business_department: { description: '産業振興課の担当部署名' },
  business_email: { description: '産業振興課のメールアドレス' },
  business_phone: { description: '産業振興課の電話番号' },
  legal_affairs_bureau: { description: '法務局の名称', examples: ['〇〇法務局'] },
  legal_affairs_bureau_address: { description: '法務局の住所' },
  legal_affairs_bureau_phone: { description: '法務局の電話番号' },
  local_business_subsidy_description: { description: '地域事業者向け補助金の説明' },
  pension_office: { description: '年金事務所の名称', examples: ['〇〇年金事務所'] },
  pension_office_address: { description: '年金事務所の住所' },
  pension_office_phone: { description: '年金事務所の電話番号' },
  tax_office: { description: '税務署の名称', examples: ['〇〇税務署'] },
  tax_office_address: { description: '税務署の住所' },
  tax_office_phone: { description: '税務署の電話番号' },

  // 土地・農林水産系
  land_department: { description: '土地管理課の担当部署名' },
  land_email: { description: '土地管理課のメールアドレス' },
  land_phone: { description: '土地管理課の電話番号' },
  agriculture_department: { description: '農政課の担当部署名' },
  agriculture_email: { description: '農政課のメールアドレス' },
  agriculture_phone: { description: '農政課の電話番号' },
  agricultural_commission: { description: '農業委員会の名称' },
  agricultural_commission_email: { description: '農業委員会のメールアドレス' },
  agricultural_commission_meeting_day: { description: '農業委員会の定例会議日', examples: ['毎月25日'] },
  agricultural_commission_phone: { description: '農業委員会の電話番号' },
  development_department: { description: '開発指導課の担当部署名' },
  development_email: { description: '開発指導課のメールアドレス' },
  development_phone: { description: '開発指導課の電話番号' },
  fishery_department: { description: '水産課の担当部署名' },
  fishery_email: { description: '水産課のメールアドレス' },
  fishery_phone: { description: '水産課の電話番号' },
  forestry_department: { description: '林業課の担当部署名' },
  forestry_email: { description: '林業課のメールアドレス' },
  forestry_phone: { description: '林業課の電話番号' },
  urban_planning_department: { description: '都市計画課の担当部署名' },
  urban_planning_email: { description: '都市計画課のメールアドレス' },
  urban_planning_phone: { description: '都市計画課の電話番号' },
  wildlife_department: { description: '鳥獣対策課の担当部署名' },
  wildlife_email: { description: '鳥獣対策課のメールアドレス' },
  wildlife_fence_application_period: { description: '獣害防護柵補助金の申請期間' },
  wildlife_fence_subsidy_rate: { description: '獣害防護柵補助金の補助率', examples: ['1/2', '2/3'] },
  wildlife_phone: { description: '鳥獣対策課の電話番号' },
  new_farmer_consultation: { description: '新規就農相談窓口' },
  new_farmer_support_program: { description: '新規就農支援制度の説明' },

  // 外国人・国籍系
  nationality_department: { description: '戸籍住民課の担当部署名' },
  nationality_email: { description: '戸籍住民課のメールアドレス' },
  nationality_phone: { description: '戸籍住民課の電話番号' },
  multicultural_department: { description: '多文化共生課の担当部署名' },
  multicultural_email: { description: '多文化共生課のメールアドレス' },
  multicultural_phone: { description: '多文化共生課の電話番号' },
  immigration_bureau: { description: '入国管理局の名称', examples: ['〇〇入国管理局'] },
  immigration_bureau_address: { description: '入国管理局の住所' },
  immigration_bureau_phone: { description: '入国管理局の電話番号' },
  international_association: { description: '国際交流協会の名称', examples: ['〇〇国際交流協会'] },
  international_association_address: { description: '国際交流協会の住所' },
  international_association_email: { description: '国際交流協会のメールアドレス' },
  international_association_phone: { description: '国際交流協会の電話番号' },
  passport_office_address: { description: 'パスポートセンターの住所' },
  passport_office_name: { description: 'パスポートセンターの名称', examples: ['〇〇パスポートセンター'] },
  passport_office_phone: { description: 'パスポートセンターの電話番号' },
  koseki_department: { description: '戸籍係の担当部署名' },
  koseki_email: { description: '戸籍係のメールアドレス' },
  koseki_phone: { description: '戸籍係の電話番号' },
  resident_department: { description: '住民登録係の担当部署名' },
  resident_email: { description: '住民登録係のメールアドレス' },
  resident_phone: { description: '住民登録係の電話番号' },
  foreign_consultation_languages: { description: '外国人相談対応言語', examples: ['英語、中国語、韓国語'] },
  japanese_class_application: { description: '日本語教室の申込方法' },
  japanese_class_fee: { description: '日本語教室の受講料', examples: ['無料', '月500円'] },
  japanese_class_location: { description: '日本語教室の開催場所' },
  japanese_class_schedule: { description: '日本語教室の開催スケジュール', examples: ['毎週水曜日19:00〜'] },
  multilingual_consultation_hours: { description: '多言語相談窓口の受付時間' },
  multilingual_languages: { description: '多言語相談窓口の対応言語', examples: ['英語、中国語、ベトナム語'] },

  // 市民参加・選挙系
  civic_department: { description: '市民協働課の担当部署名' },
  civic_email: { description: '市民協働課のメールアドレス' },
  civic_phone: { description: '市民協働課の電話番号' },
  election_commission: { description: '選挙管理委員会の名称' },
  election_commission_email: { description: '選挙管理委員会のメールアドレス' },
  election_commission_phone: { description: '選挙管理委員会の電話番号' },
  audit_commission: { description: '監査委員会の名称' },
  audit_commission_email: { description: '監査委員会のメールアドレス' },
  audit_commission_phone: { description: '監査委員会の電話番号' },
  disclosure_department: { description: '情報公開課の担当部署名' },
  disclosure_email: { description: '情報公開課のメールアドレス' },
  disclosure_phone: { description: '情報公開課の電話番号' },
  planning_department: { description: '企画政策課の担当部署名' },
  planning_email: { description: '企画政策課のメールアドレス' },
  planning_phone: { description: '企画政策課の電話番号' },
  privacy_department: { description: '個人情報保護係の担当部署名' },
  privacy_email: { description: '個人情報保護係のメールアドレス' },
  privacy_phone: { description: '個人情報保護係の電話番号' },
  legal_department: { description: '法務課の担当部署名' },
  legal_email: { description: '法務課のメールアドレス' },
  legal_phone: { description: '法務課の電話番号' },
  legal_consultation_reservation: { description: '法律相談の予約方法' },
  legal_consultation_schedule: { description: '法律相談の開催スケジュール', examples: ['毎月第2・4木曜日'] },
  victim_support_benefit: { description: '犯罪被害者支援給付金の内容' },
  victim_support_center_phone: { description: '被害者支援センターの電話番号' },
  victim_support_department: { description: '被害者支援課の担当部署名' },
  victim_support_email: { description: '被害者支援課のメールアドレス' },
  victim_support_phone: { description: '被害者支援課の電話番号' },

  // 年金・給付系
  benefits_department: { description: '給付金担当課の担当部署名' },
  benefits_email: { description: '給付金担当課のメールアドレス' },
  benefits_phone: { description: '給付金担当課の電話番号' },
  nenkin_department: { description: '国民年金係の担当部署名' },
  nenkin_email: { description: '国民年金係のメールアドレス' },
  nenkin_phone: { description: '国民年金係の電話番号' },
};

/**
 * Get variable definition by name
 * highPriorityVariablesとvariableDescriptionsの両方を参照
 */
export function getVariableDefinition(name: string): VariableDefinition | undefined {
  // まずhighPriorityVariablesを検索
  const highPriority = highPriorityVariables.find((v) => v.name === name);
  if (highPriority) {
    return highPriority;
  }

  // variableDescriptionsから説明を取得
  const desc = variableDescriptions[name];
  if (desc) {
    return {
      name,
      description: desc.description,
      category: 'general',
      priority: 'medium',
      examples: desc.examples,
    };
  }

  return undefined;
}

/**
 * Determine which services are relevant for a set of variables
 */
export function getServicesForVariables(variableNames: string[]): ServiceDefinition[] {
  const serviceSet = new Set<string>();

  for (const varName of variableNames) {
    for (const service of serviceDefinitions) {
      if (service.variables.includes(varName)) {
        serviceSet.add(service.id);
      }
    }
  }

  return Array.from(serviceSet).map((id) => getServiceDefinition(id)!).filter(Boolean);
}

/**
 * Get recommended fetch order for services
 */
export function getServiceFetchOrder(): string[] {
  // Order by general importance/frequency of use
  return [
    'registration',  // 届出・申請・証明書（最重要）
    'tax',           // 税金
    'health',        // 健康・医療
    'childcare',     // 子育て・保育
    'welfare',       // 福祉
    'environment',   // 環境・ごみ
    'disaster',      // 防災
    'housing',       // 住宅・建築
    'employment',    // 雇用・労働
    'driving',       // 運転・車
    'business',      // 事業・産業
    'land',          // 土地・農林水産
    'nationality',   // 外国人・国籍
    'civic',         // 市民参加・選挙
    'benefits',      // 年金・給付
  ];
}

/**
 * Get all unique variables across all services
 * 全サービスのユニークな変数名を取得
 */
export function getAllServiceVariables(): string[] {
  const allVars = new Set<string>();
  for (const service of serviceDefinitions) {
    for (const variable of service.variables) {
      allVars.add(variable);
    }
  }
  return Array.from(allVars).sort();
}

/**
 * Get total count of unique variables across all services
 * 全サービスのユニーク変数数を取得
 */
export function getTotalServiceVariableCount(): number {
  return getAllServiceVariables().length;
}
