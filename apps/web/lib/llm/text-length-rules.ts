/**
 * テキスト文字数ルール設定
 *
 * コンポーネント内のテキスト要素が長すぎると読みにくくなるため、
 * 一定の文字数を超えるテキストは別のコンポーネントに変換する。
 *
 * この設定ファイルで文字数閾値を一元管理する。
 */

/**
 * テキスト要素の最大文字数（これを超えるとコンポーネント変換を検討）
 *
 * 適用箇所:
 * - RichText内のparagraph
 * - RichText内のlist-item
 * - Table内のlabel/value
 * - Accordion内のcontent
 * - NotificationBanner内のcontent
 * - DescriptionList内のterm/description
 */
export const TEXT_LENGTH_THRESHOLD = 60;

/**
 * NotificationBannerを使用する最小文字数
 * （これ未満の短い注意事項はRichTextで表現）
 */
export const NOTIFICATION_BANNER_MIN_LENGTH = 50;

/**
 * Summary（概要）の推奨文字数範囲
 */
export const SUMMARY_LENGTH = {
  /** Service Pageの推奨文字数（最小） */
  SERVICE_MIN: 40,
  /** Service Pageの推奨文字数（最大） */
  SERVICE_MAX: 60,
  /** Guide Pageの推奨文字数（最小） */
  GUIDE_MIN: 60,
  /** Guide Pageの推奨文字数（最大） */
  GUIDE_MAX: 100,
} as const;

/**
 * セクション内の説明文の推奨文字数
 */
export const SECTION_DESCRIPTION_MAX_LENGTH = 60;

/**
 * 箇条書き1項目あたりの推奨文字数
 */
export const LIST_ITEM_MAX_LENGTH = 30;

/**
 * 1セクション全体の推奨文字数
 */
export const SECTION_TOTAL_MAX_LENGTH = 120;

/**
 * テキストが閾値を超えているかチェック
 */
export function isTextTooLong(text: string, threshold = TEXT_LENGTH_THRESHOLD): boolean {
  return text.length > threshold;
}

/**
 * テキスト配列から閾値を超えるものを抽出
 */
export function filterLongTexts(texts: string[], threshold = TEXT_LENGTH_THRESHOLD): string[] {
  return texts.filter(text => isTextTooLong(text, threshold));
}

/**
 * テキスト配列の最長文字数を取得
 */
export function getMaxTextLength(texts: string[]): number {
  if (texts.length === 0) return 0;
  return Math.max(...texts.map(text => text.length));
}

/**
 * テキストが長い項目を持つかチェック
 */
export function hasLongItems(texts: string[], threshold = TEXT_LENGTH_THRESHOLD): boolean {
  return texts.some(text => isTextTooLong(text, threshold));
}
