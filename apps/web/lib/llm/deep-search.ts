/**
 * 値の具体性判定ユーティリティ
 *
 * 抽出された値が具体的かどうかを判定する
 */

/**
 * 値が具体的かどうかを判定
 */
export function isConcreteValue(variableName: string, value: string | null): boolean {
  if (!value) return false;

  // 曖昧な表現のパターン
  const vaguePatterns = [
    /^詳細は/,
    /^お問い合わせ/,
    /による$/,
    /^要確認/,
    /^未定/,
    /^－$/,
    /^-$/,
    /をご覧/,
    /参照$/,
    /をご確認/,
    /^各種/,
    /によって異なる/,
  ];

  if (vaguePatterns.some(pattern => pattern.test(value))) {
    return false;
  }

  // 手数料の場合は金額が含まれているかチェック
  if (variableName.includes('fee') || variableName.includes('料')) {
    const hasFee = /\d+円/.test(value) || /無料/.test(value);
    return hasFee;
  }

  // 電話番号の場合はフォーマットチェック
  if (variableName.includes('phone') || variableName.includes('電話')) {
    const hasPhone = /\d{2,5}-\d{2,4}-\d{4}/.test(value);
    return hasPhone;
  }

  return value.length > 2; // 最低限の長さ
}
