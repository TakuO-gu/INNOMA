import type { ComponentProps } from 'react';

type Props = ComponentProps<'time'> & {
  /**
   * 機械可読な日付形式 (YYYY-MM-DD)
   * 例: "2024-07-01"
   */
  dateTime: string;
  /**
   * 人間が読む形式の日付表示
   * 例: "2024年7月1日"、"7月1日"、"2024年7月"など
   * コンテンツに応じて必要な要素のみを記載可能
   */
  children: string;
};

/**
 * NotificationBannerの年月日表示コンポーネント
 *
 * オプション要素として、バナーの掲載日時や掲載期間などを表示します。
 * 年月日、月日のみ、年月のみなど、コンテンツによって必要な要素のみを記載できます。
 *
 * @example
 * ```tsx
 * <NotificationBannerDate dateTime="2024-07-01">
 *   2024年7月1日
 * </NotificationBannerDate>
 *
 * <NotificationBannerDate dateTime="2024-07-01">
 *   7月1日
 * </NotificationBannerDate>
 *
 * <NotificationBannerDate dateTime="2024-07">
 *   2024年7月
 * </NotificationBannerDate>
 * ```
 */
export const NotificationBannerDate = (props: Props) => {
  const { className, dateTime, children, ...rest } = props;

  return (
    <time
      className={`
        col-start-2 text-std-14N-170 text-solid-gray-800
        ${className ?? ''}
      `}
      dateTime={dateTime}
      {...rest}
    >
      {children}
    </time>
  );
};
