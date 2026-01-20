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
 */
export const serviceDefinitions: ServiceDefinition[] = [
  {
    id: 'shimin',
    name: 'Citizen Services',
    nameJa: '市民課・住民票',
    variables: [
      'shimin_department',
      'shimin_phone',
      'shimin_email',
      'juminhyo_fee',
      'juminhyo_convenience_fee',
      'koseki_fee',
      'inkan_touroku_fee',
      'inkan_shomei_fee',
    ],
    searchKeywords: ['住民票', '戸籍', '印鑑証明', '市民課', '窓口'],
  },
  {
    id: 'kokuho',
    name: 'National Health Insurance',
    nameJa: '国民健康保険',
    variables: [
      'kokuho_department',
      'kokuho_phone',
      'kokuho_email',
    ],
    searchKeywords: ['国民健康保険', '国保', '保険料', '保険証'],
  },
  {
    id: 'kouki',
    name: 'Late-stage Elderly Medical',
    nameJa: '後期高齢者医療',
    variables: [
      'kouki_department',
      'kouki_phone',
      'kouki_email',
      'kouki_shotoku_wari_rate',
      'kouki_kinto_wari',
    ],
    searchKeywords: ['後期高齢者医療', '75歳以上', '保険料率'],
  },
  {
    id: 'tax',
    name: 'Tax Services',
    nameJa: '税務',
    variables: [
      'tax_department',
      'tax_phone',
      'tax_email',
      'juminzei_kigen_1',
      'juminzei_kigen_2',
      'juminzei_kigen_3',
      'juminzei_kigen_4',
    ],
    searchKeywords: ['住民税', '固定資産税', '税務課', '納税'],
  },
  {
    id: 'childcare',
    name: 'Childcare Services',
    nameJa: '子育て・保育',
    variables: [
      'childcare_department',
      'childcare_phone',
      'childcare_email',
      'nursery_count',
      'nursery_apply_period',
      'nursery_apply_deadline',
    ],
    searchKeywords: ['保育所', '保育園', '子育て支援', '入所申込'],
  },
  {
    id: 'welfare',
    name: 'Welfare Services',
    nameJa: '福祉',
    variables: [
      'welfare_department',
      'welfare_phone',
      'welfare_email',
      'koureisha_department',
      'koureisha_phone',
      'kaigo_department',
      'kaigo_phone',
    ],
    searchKeywords: ['福祉課', '高齢者福祉', '介護保険', '障害福祉'],
  },
  {
    id: 'health',
    name: 'Health Services',
    nameJa: '健康・健診',
    variables: [
      'health_department',
      'health_phone',
      'health_email',
      'tokutei_kenshin_fee',
      'kenshin_period',
    ],
    searchKeywords: ['健康診査', '特定健診', '健康課', 'がん検診'],
  },
  {
    id: 'environment',
    name: 'Environment Services',
    nameJa: '環境・ごみ',
    variables: [
      'environment_department',
      'environment_phone',
      'environment_email',
      'sodaigomi_fee_small',
      'sodaigomi_fee_medium',
      'sodaigomi_fee_large',
    ],
    searchKeywords: ['粗大ごみ', 'ごみ収集', '環境課', 'リサイクル'],
  },
  {
    id: 'disaster',
    name: 'Disaster Prevention',
    nameJa: '防災',
    variables: [
      'bosai_department',
      'bosai_phone',
      'bosai_email',
      'hinanjo_count',
      'hazard_map_kozui_url',
    ],
    searchKeywords: ['防災', '避難所', 'ハザードマップ', '災害'],
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
 * Get variable definition by name
 */
export function getVariableDefinition(name: string): VariableDefinition | undefined {
  return highPriorityVariables.find((v) => v.name === name);
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
  return ['shimin', 'kokuho', 'tax', 'childcare', 'welfare', 'health', 'environment', 'kouki', 'disaster'];
}
