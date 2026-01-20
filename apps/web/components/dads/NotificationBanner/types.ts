export type NotificationBannerHeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type NotificationBannerStyle = 'standard' | 'color-chip';
export type NotificationBannerType = 'info1' | 'info2' | 'warning' | 'error' | 'success';

/**
 * NotificationBannerの構成要素
 *
 * 必須要素:
 * - バナーアイコン (NotificationBannerIcon)
 * - バナータイトル (title prop)
 *
 * 任意要素:
 * - バナーデスクリプション (NotificationBannerBody内のchildren)
 *
 * オプション要素:
 * - 年月日 (NotificationBannerDate)
 * - 閉じるボタン (NotificationBannerClose / NotificationBannerMobileClose)
 * - アクションボタン (NotificationBannerActions)
 *
 * 共存制約:
 * - リンクのみのバナー + 閉じるボタン: 不可
 * - 複数のインタラクションタイプの混在に注意
 */
