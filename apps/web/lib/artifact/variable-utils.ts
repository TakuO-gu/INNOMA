/**
 * 変数置換に関するユーティリティ関数
 */

/**
 * 文字列が未置換の変数テンプレート（{{variable_name}}）を含んでいるかチェック
 */
export function hasUnreplacedVariable(value: string | undefined): boolean {
  if (!value) return false;
  return /\{\{[^}]+\}\}/.test(value);
}

/**
 * 値が有効（nullでなく、未置換変数でもない）かチェック
 */
export function isValidValue(value: string | undefined | null): boolean {
  if (!value) return false;
  if (hasUnreplacedVariable(value)) return false;
  return true;
}

/**
 * オブジェクトの全てのプロパティが有効な値を持っているかチェック
 * 少なくとも1つの必須フィールドが有効な値を持っている必要がある
 */
export function hasAnyValidValue(
  props: Record<string, unknown>,
  requiredFields: string[]
): boolean {
  return requiredFields.some((field) => {
    const value = props[field];
    if (typeof value !== "string") return false;
    return isValidValue(value);
  });
}

/**
 * ContactBlockで使用する最小限の必須フィールド
 * department, phone, email のいずれかが有効な値を持っていれば表示可能
 */
export const CONTACT_REQUIRED_FIELDS = ["department", "phone", "email"];

/**
 * `available` プロップの値を評価して、ブロックを表示するかどうかを返す
 *
 * ルール:
 * - `available` プロップがない（undefined）→ 表示する（後方互換性）
 * - 未置換変数（{{...}}）が残っている → 非表示（変数未設定 = 提供状況不明）
 * - "false" / "no" / "0" / "非対応" / "未対応" / "なし" → 非表示
 * - それ以外（"true", "あり", "対応" など）→ 表示
 */
export function isBlockAvailable(available: string | undefined): boolean {
  if (available === undefined) return true;
  if (hasUnreplacedVariable(available)) return false;
  const normalized = available.trim().toLowerCase();
  const falsy = ["false", "no", "0", "非対応", "未対応", "なし", "no", "利用不可", "未実施"];
  return !falsy.includes(normalized);
}
