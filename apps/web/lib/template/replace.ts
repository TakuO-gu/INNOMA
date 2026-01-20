/**
 * 変数置換機能
 *
 * テンプレート内の {{variable_name}} 形式の変数を実際の値に置換する
 */

import type { ReplaceResult, VariableStore } from "./types";

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

/**
 * 変数値の検証
 */
export const validators = {
  /** 電話番号の検証 */
  phone: (value: string): boolean => {
    return /^\d{2,5}-\d{2,4}-\d{4}$/.test(value);
  },

  /** メールアドレスの検証 */
  email: (value: string): boolean => {
    return /^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(value);
  },

  /** URLの検証 */
  url: (value: string): boolean => {
    return /^https?:\/\/.+/.test(value);
  },

  /** 金額の検証（例: 300円, 1,000円） */
  fee: (value: string): boolean => {
    return /^[\d,]+円$/.test(value);
  },

  /** 日付の検証（例: 1月1日） */
  date: (value: string): boolean => {
    return /^\d{1,2}月\d{1,2}日/.test(value);
  },

  /** 時刻の検証（例: 9:00） */
  time: (value: string): boolean => {
    return /^\d{1,2}:\d{2}/.test(value);
  },

  /** パーセントの検証（例: 10%, 0.5%） */
  percent: (value: string): boolean => {
    return /^\d+(\.\d+)?%$/.test(value);
  },
};

/**
 * 変数名から適切なバリデーターを推定
 *
 * @param variableName 変数名
 * @returns バリデーター関数、または推定できない場合はnull
 */
export function inferValidator(
  variableName: string
): ((value: string) => boolean) | null {
  const name = variableName.toLowerCase();

  if (name.endsWith("_phone") || name.endsWith("_tel")) {
    return validators.phone;
  }
  if (name.endsWith("_email") || name.endsWith("_mail")) {
    return validators.email;
  }
  if (name.endsWith("_url")) {
    return validators.url;
  }
  if (name.endsWith("_fee") || name.includes("_fee_")) {
    return validators.fee;
  }
  if (name.endsWith("_rate") && !name.includes("subsidy")) {
    return validators.percent;
  }
  if (name.endsWith("_kigen") || name.endsWith("_deadline")) {
    return validators.date;
  }

  return null;
}

/**
 * 変数値を検証
 *
 * @param variableName 変数名
 * @param value 値
 * @returns 有効な場合はtrue、無効な場合はfalse、検証できない場合はnull
 */
export function validateVariableValue(
  variableName: string,
  value: string
): boolean | null {
  const validator = inferValidator(variableName);
  if (!validator) {
    return null; // 検証できない
  }
  return validator(value);
}
