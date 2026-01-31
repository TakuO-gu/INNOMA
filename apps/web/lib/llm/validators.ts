/**
 * Variable Value Validators
 */

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Validate phone number
 * Accepts various Japanese phone number formats
 */
export function validatePhone(value: string): ValidationResult {
  // Remove spaces and normalize hyphens
  const normalized = value.replace(/\s+/g, '').replace(/[ー－]/g, '-');

  // Japanese phone number patterns
  const patterns = [
    /^\d{2,5}-\d{2,4}-\d{4}$/, // Standard: 03-1234-5678, 0123-45-6789
    /^\d{10,11}$/, // Without hyphens: 0312345678
    /^0120-\d{3}-\d{3}$/, // Free dial
    /^\d{4}-\d{2}-\d{4}$/, // Pattern like 0570-01-2345
  ];

  if (patterns.some((p) => p.test(normalized))) {
    return { valid: true, normalized };
  }

  return {
    valid: false,
    error: '電話番号の形式が正しくありません（例: 03-1234-5678）',
  };
}

/**
 * Validate email address
 */
export function validateEmail(value: string): ValidationResult {
  const normalized = value.toLowerCase().trim();
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (pattern.test(normalized)) {
    return { valid: true, normalized };
  }

  // Allow contact form URL when email address is not available
  try {
    const url = new URL(normalized);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return { valid: true, normalized: url.toString() };
    }
  } catch {
    // not a URL
  }

  return {
    valid: false,
    error: 'メールアドレスの形式が正しくありません（問い合わせフォームURLも可）',
  };
}

/**
 * Validate URL
 */
export function validateUrl(value: string): ValidationResult {
  const normalized = value.trim();

  try {
    new URL(normalized);
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return { valid: true, normalized };
    }
  } catch {
    // Invalid URL
  }

  return {
    valid: false,
    error: 'URLの形式が正しくありません（http:// または https:// で始まる必要があります）',
  };
}

/**
 * Validate Japanese currency amount
 */
export function validateFee(value: string): ValidationResult {
  // Remove spaces
  const cleaned = value.replace(/\s+/g, '');

  // Accept formats: 300円, 1,000円, ¥300, 無料
  const patterns = [
    /^[\d,]+円$/, // 300円, 1,000円
    /^¥[\d,]+$/, // ¥300
    /^無料$/, // 無料
    /^[\d,]+円〜[\d,]+円$/, // Range: 300円〜500円
  ];

  if (patterns.some((p) => p.test(cleaned))) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    error: '金額の形式が正しくありません（例: 300円, 無料）',
  };
}

/**
 * Validate date
 */
export function validateDate(value: string): ValidationResult {
  const cleaned = value.replace(/\s+/g, '');

  // Accept various Japanese date formats
  const patterns = [
    /^\d{1,2}月\d{1,2}日/, // 1月15日
    /^\d{4}年\d{1,2}月\d{1,2}日/, // 2026年1月15日
    /^令和\d+年\d{1,2}月\d{1,2}日/, // 令和8年1月15日
    /^\d{4}\/\d{1,2}\/\d{1,2}$/, // 2026/1/15
    /^\d{4}-\d{1,2}-\d{1,2}$/, // 2026-1-15
  ];

  if (patterns.some((p) => p.test(cleaned))) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    error: '日付の形式が正しくありません（例: 1月15日, 2026年1月15日）',
  };
}

/**
 * Validate time
 */
export function validateTime(value: string): ValidationResult {
  const cleaned = value.replace(/\s+/g, '');

  const patterns = [
    /^\d{1,2}:\d{2}$/, // 9:00
    /^\d{1,2}時\d{0,2}分?$/, // 9時, 9時30分
    /^\d{1,2}:\d{2}〜\d{1,2}:\d{2}$/, // 9:00〜17:00
    /^(平日|月〜金|土日).+/, // 平日8:30-17:15
  ];

  if (patterns.some((p) => p.test(cleaned))) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    error: '時間の形式が正しくありません（例: 9:00, 9:00〜17:00）',
  };
}

/**
 * Validate percentage
 */
export function validatePercent(value: string): ValidationResult {
  const cleaned = value.replace(/\s+/g, '');

  const patterns = [
    /^\d+(\.\d+)?%$/, // 10%, 8.5%
    /^\d+(\.\d+)?％$/, // Full-width
  ];

  if (patterns.some((p) => p.test(cleaned))) {
    const normalized = cleaned.replace('％', '%');
    return { valid: true, normalized };
  }

  return {
    valid: false,
    error: 'パーセンテージの形式が正しくありません（例: 10%, 8.5%）',
  };
}

/**
 * Validate postal code
 */
export function validatePostalCode(value: string): ValidationResult {
  const cleaned = value.replace(/\s+/g, '').replace('ー', '-');

  const patterns = [
    /^〒?\d{3}-\d{4}$/, // 〒100-0001
    /^\d{7}$/, // 1000001
  ];

  if (patterns.some((p) => p.test(cleaned))) {
    const normalized = cleaned.startsWith('〒') ? cleaned : `〒${cleaned}`;
    return { valid: true, normalized };
  }

  return {
    valid: false,
    error: '郵便番号の形式が正しくありません（例: 〒100-0001）',
  };
}

/**
 * Validator function type
 */
export type ValidatorFunction = (value: string) => ValidationResult;

import type { VariableValidationType } from './types';

/**
 * Map validation type to validator function
 * 明示的なバリデーションタイプからバリデーターを取得
 */
const validatorsByType: Record<VariableValidationType, ValidatorFunction | null> = {
  phone: validatePhone,
  email: validateEmail,
  url: validateUrl,
  fee: validateFee,
  percent: validatePercent,
  date: validateDate,
  time: validateTime,
  postal: validatePostalCode,
  text: null,  // テキストはバリデーションなし
};

/**
 * Map variable name patterns to validators (後方互換性のため維持)
 * @deprecated 新しい変数は validationType を明示的に指定してください
 */
const validatorPatterns: [RegExp, ValidatorFunction][] = [
  [/_phone$|_tel$/, validatePhone],
  [/_email$|_mail$/, validateEmail],
  [/_url$/, validateUrl],
  [/_fee$|_fee_/, validateFee],
  [/_rate$/, validatePercent],
  [/_kigen|_deadline|_period$/, validateDate],
  [/_hours$/, validateTime],
];

/**
 * Get validator by explicit validation type
 */
export function getValidatorByType(validationType: VariableValidationType): ValidatorFunction | null {
  return validatorsByType[validationType] ?? null;
}

/**
 * Get appropriate validator for a variable name
 * @param variableName 変数名
 * @param validationType 明示的なバリデーションタイプ（指定時は優先）
 */
export function getValidator(
  variableName: string,
  validationType?: VariableValidationType
): ValidatorFunction | null {
  // 明示的なバリデーションタイプが指定されている場合はそれを使用
  if (validationType) {
    return getValidatorByType(validationType);
  }

  // 後方互換性: 変数名のパターンマッチング
  for (const [pattern, validator] of validatorPatterns) {
    if (pattern.test(variableName)) {
      return validator;
    }
  }
  return null;
}

/**
 * Validate a variable value
 * @param variableName 変数名
 * @param value 値
 * @param validationType 明示的なバリデーションタイプ（指定時は優先）
 */
export function validateVariable(
  variableName: string,
  value: string,
  validationType?: VariableValidationType
): ValidationResult {
  const validator = getValidator(variableName, validationType);
  if (!validator) {
    // No specific validator, accept any value
    return { valid: true, normalized: value.trim() };
  }
  return validator(value);
}

/**
 * Calculate confidence score adjustments based on validation
 */
export function calculateValidationConfidence(
  variableName: string,
  value: string,
  baseConfidence: number
): number {
  const result = validateVariable(variableName, value);

  if (result.valid) {
    return Math.min(baseConfidence + 0.1, 1.0);
  } else {
    return Math.max(baseConfidence - 0.2, 0.1);
  }
}
