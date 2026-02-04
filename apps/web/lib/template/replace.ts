/**
 * 変数置換機能
 *
 * テンプレート内の {{variable_name}} 形式の変数を実際の値に置換する
 */

import type { ReplaceResult, VariableStore, VariableValue } from "./types";

/**
 * 変数のソース情報
 */
export interface VariableSourceInfo {
  /** 変数名 */
  variableName: string;
  /** ソースURL */
  sourceUrl?: string;
  /** 信頼度 */
  confidence?: number;
  /** ソースタイプ */
  source: "manual" | "llm" | "default";
}

/**
 * ソース情報付き置換結果
 */
export interface ReplaceResultWithSources extends ReplaceResult {
  /** 使用された変数のソース情報 */
  variableSources: VariableSourceInfo[];
}

/**
 * 変数のパターン: {{variable_name}}
 * 変数名は英小文字、数字、アンダースコアのみ
 */
const VARIABLE_PATTERN = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;

/**
 * コンテンツ内の変数を置換
 *
 * @param content 置換対象のコンテンツ
 * @param variables 変数名と値のマップ
 * @returns 置換結果
 */
export function replaceVariables(
  content: string,
  variables: Record<string, string>
): ReplaceResult {
  const replacedVariables: string[] = [];
  const unreplacedVariables: string[] = [];
  const foundVariables = new Set<string>();

  // 変数を小文字に正規化
  const normalizedVariables: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    normalizedVariables[key.toLowerCase()] = value;
  }

  // 変数を置換
  const result = content.replace(VARIABLE_PATTERN, (match, varName) => {
    const normalizedName = varName.toLowerCase();
    foundVariables.add(normalizedName);

    if (normalizedName in normalizedVariables) {
      if (!replacedVariables.includes(normalizedName)) {
        replacedVariables.push(normalizedName);
      }
      return normalizedVariables[normalizedName];
    } else {
      if (!unreplacedVariables.includes(normalizedName)) {
        unreplacedVariables.push(normalizedName);
      }
      return match; // 変数が見つからない場合はそのまま
    }
  });

  return {
    content: result,
    replacedVariables,
    unreplacedVariables,
  };
}

/**
 * VariableStoreから変数値マップを作成
 *
 * @param store 変数ストア
 * @returns 変数名と値のマップ
 */
export function variableStoreToMap(store: VariableStore): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, data] of Object.entries(store)) {
    result[name] = data.value;
  }
  return result;
}

/**
 * JSON文字列内での置換用に値をエスケープ
 * JSON文字列リテラル内で使用される特殊文字をエスケープする
 *
 * @param value エスケープする値
 * @returns JSONセーフにエスケープされた値
 */
export function escapeForJson(value: string): string {
  // JSON.stringifyを使って確実にエスケープし、前後のクォートを削除
  return JSON.stringify(value).slice(1, -1);
}

/**
 * VariableStoreからJSON内での置換用の変数値マップを作成
 * 値はJSON文字列リテラル内で安全に使用できるようにエスケープされる
 *
 * @param store 変数ストア
 * @returns 変数名とJSONエスケープ済み値のマップ
 */
export function variableStoreToMapForJson(store: VariableStore): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, data] of Object.entries(store)) {
    result[name] = escapeForJson(data.value);
  }
  return result;
}

/**
 * コンテンツ内の変数を抽出
 *
 * @param content 対象コンテンツ
 * @returns 見つかった変数名のリスト（重複なし）
 */
export function extractVariables(content: string): string[] {
  const variables = new Set<string>();
  let match;

  while ((match = VARIABLE_PATTERN.exec(content)) !== null) {
    variables.add(match[1].toLowerCase());
  }

  return Array.from(variables);
}

/**
 * コンテンツ内にまだ置換されていない変数があるか確認
 *
 * @param content 対象コンテンツ
 * @returns 未置換の変数がある場合はtrue
 */
export function hasUnreplacedVariables(content: string): boolean {
  return VARIABLE_PATTERN.test(content);
}

// =============================================================================
// 変数値の検証 - lib/llm/validators.ts への委譲
// =============================================================================

import {
  validatePhone,
  validateEmail,
  validateUrl,
  validateFee,
  validateDate,
  validateTime,
  validatePercent,
  getValidator,
  validateVariable,
} from "@/lib/llm/validators";

/**
 * 変数値の検証（boolean版 - lib/llm/validators.ts のラッパー）
 * @deprecated 新しいコードでは lib/llm/validators.ts を直接使用してください
 */
export const validators = {
  phone: (value: string): boolean => validatePhone(value).valid,
  email: (value: string): boolean => validateEmail(value).valid,
  url: (value: string): boolean => validateUrl(value).valid,
  fee: (value: string): boolean => validateFee(value).valid,
  date: (value: string): boolean => validateDate(value).valid,
  time: (value: string): boolean => validateTime(value).valid,
  percent: (value: string): boolean => validatePercent(value).valid,
};

/**
 * 変数名から適切なバリデーターを推定
 * @deprecated 新しいコードでは lib/llm/validators.ts の getValidator() を使用してください
 */
export function inferValidator(
  variableName: string
): ((value: string) => boolean) | null {
  const validator = getValidator(variableName);
  if (!validator) return null;
  return (value: string) => validator(value).valid;
}

/**
 * 変数値を検証
 * @deprecated 新しいコードでは lib/llm/validators.ts の validateVariable() を使用してください
 */
export function validateVariableValue(
  variableName: string,
  value: string
): boolean | null {
  const validator = getValidator(variableName);
  if (!validator) return null;
  return validateVariable(variableName, value).valid;
}

/**
 * ソース情報付き置換結果（参照番号マッピング付き）
 */
export interface ReplaceResultWithSourcesAndRefs extends ReplaceResultWithSources {
  /** URL→参照番号のマッピング */
  sourceRefMap: Map<string, number>;
}

/**
 * コンテンツ内の変数を置換し、ソース情報も収集
 *
 * @param content 置換対象のコンテンツ
 * @param variableStore 変数ストア（ソース情報を含む）
 * @param escapeJson JSON用にエスケープするかどうか
 * @returns ソース情報付き置換結果
 */
export function replaceVariablesWithSources(
  content: string,
  variableStore: VariableStore,
  escapeJson: boolean = true
): ReplaceResultWithSources {
  const result = replaceVariablesWithSourceRefs(content, variableStore, escapeJson, false);
  return {
    content: result.content,
    replacedVariables: result.replacedVariables,
    unreplacedVariables: result.unreplacedVariables,
    variableSources: result.variableSources,
  };
}

/**
 * コンテンツ内の変数を置換し、ソース情報も収集（参照番号付与オプション付き）
 *
 * @param content 置換対象のコンテンツ
 * @param variableStore 変数ストア（ソース情報を含む）
 * @param escapeJson JSON用にエスケープするかどうか
 * @param appendSourceRef 変数値の後に参照番号[N]を付与するかどうか
 * @returns ソース情報付き置換結果（参照番号マッピング付き）
 */
export function replaceVariablesWithSourceRefs(
  content: string,
  variableStore: VariableStore,
  escapeJson: boolean = true,
  appendSourceRef: boolean = true
): ReplaceResultWithSourcesAndRefs {
  const replacedVariables: string[] = [];
  const unreplacedVariables: string[] = [];
  const variableSources: VariableSourceInfo[] = [];
  const processedVariables = new Set<string>();

  // URL→参照番号のマッピングを作成
  const sourceRefMap = new Map<string, number>();
  let nextRefId = 1;

  // 変数を小文字に正規化したマップを作成
  const normalizedStore: Record<string, VariableValue> = {};
  for (const [key, value] of Object.entries(variableStore)) {
    normalizedStore[key.toLowerCase()] = value;
  }

  // 最初のパス: ソースURLを収集して参照番号を割り当て
  content.replace(VARIABLE_PATTERN, (match, varName) => {
    const normalizedName = varName.toLowerCase();
    if (normalizedName in normalizedStore) {
      const varData = normalizedStore[normalizedName];
      if (varData.sourceUrl && !sourceRefMap.has(varData.sourceUrl)) {
        sourceRefMap.set(varData.sourceUrl, nextRefId++);
      }
    }
    return match;
  });

  // 変数を置換
  const result = content.replace(VARIABLE_PATTERN, (match, varName) => {
    const normalizedName = varName.toLowerCase();

    if (normalizedName in normalizedStore) {
      const varData = normalizedStore[normalizedName];

      if (!replacedVariables.includes(normalizedName)) {
        replacedVariables.push(normalizedName);
      }

      // ソース情報を収集（URLがあるもののみ）
      if (!processedVariables.has(normalizedName) && varData.sourceUrl) {
        variableSources.push({
          variableName: normalizedName,
          sourceUrl: varData.sourceUrl,
          confidence: varData.confidence,
          source: varData.source,
        });
        processedVariables.add(normalizedName);
      }

      // 値を取得
      const value = escapeJson ? escapeForJson(varData.value) : varData.value;

      // 参照番号を付与（ソースURLがある場合のみ）
      if (appendSourceRef && varData.sourceUrl) {
        const refId = sourceRefMap.get(varData.sourceUrl);
        if (refId !== undefined) {
          // JSON内で使う場合は⟦N⟧形式（括弧は後でRichTextRendererでパース）
          return `${value}⟦${refId}⟧`;
        }
      }

      return value;
    } else {
      if (!unreplacedVariables.includes(normalizedName)) {
        unreplacedVariables.push(normalizedName);
      }
      return match; // 変数が見つからない場合はそのまま
    }
  });

  return {
    content: result,
    replacedVariables,
    unreplacedVariables,
    variableSources,
    sourceRefMap,
  };
}
