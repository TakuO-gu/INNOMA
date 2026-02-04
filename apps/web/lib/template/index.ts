/**
 * テンプレートシステム エントリーポイント
 *
 * 自治体サイト生成のためのテンプレート複製・変数置換機能
 */

// 型定義
export * from "./types";

// 複製機能
export {
  cloneTemplate,
  extractTemplateVariables,
  getMunicipalityPageCount,
  deleteMunicipality,
  getTotalVariableCount,
  getAllTemplateVariableNames,
} from "./clone";

// 変数置換機能
export {
  replaceVariables,
  replaceVariablesWithSources,
  replaceVariablesWithSourceRefs,
  variableStoreToMap,
  variableStoreToMapForJson,
  escapeForJson,
  extractVariables,
  hasUnreplacedVariables,
  validators,
  inferValidator,
  validateVariableValue,
} from "./replace";

export type {
  VariableSourceInfo,
  ReplaceResultWithSources,
  ReplaceResultWithSourcesAndRefs,
} from "./replace";

// 自治体データ操作
export {
  getMunicipalities,
  getMunicipality,
  getMunicipalityMeta,
  getVariableStore,
  updateVariableStore,
  updateMunicipalityMeta,
  updateMunicipalityStatus,
} from "./storage";
