import type { ReactNode } from 'react';
import { NotificationBannerIcon } from './parts/Icon';
import { bannerStyleClasses, bannerTypeClasses } from './styles';
import type {
  NotificationBannerHeadingLevel,
  NotificationBannerStyle,
  NotificationBannerType,
} from './types';

type Props = {
  className?: string;
  children: ReactNode;
  bannerStyle: NotificationBannerStyle;
  type: NotificationBannerType;
  title: string;
  headingLevel?: NotificationBannerHeadingLevel;
};

/**
 * NotificationBanner - 通知バナーコンポーネント
 *
 * ## 必須要素
 * - バナーアイコン: typeプロパティに基づいて自動的に表示
 * - バナータイトル: titleプロパティで指定
 *
 * ## 任意要素
 * - バナーデスクリプション: childrenとして NotificationBannerBody を使用
 *
 * ## オプション要素（childrenとして追加）
 * - 年月日: NotificationBannerDate
 * - 閉じるボタン: NotificationBannerClose または NotificationBannerMobileClose
 * - アクションボタン: NotificationBannerActions
 *
 * ## 共存制約
 * - リンクのみのバナー + 閉じるボタン: 不可
 * - アクションボタンで「閉じる」機能を実装しないこと（専用の閉じるボタンを使用）
 *
 * @example
 * ```tsx
 * // 基本的な使用例
 * <NotificationBanner bannerStyle="standard" type="info1" title="お知らせ">
 *   <NotificationBannerBody>
 *     これはお知らせです。
 *   </NotificationBannerBody>
 * </NotificationBanner>
 *
 * // オプション要素を含む例
 * <NotificationBanner bannerStyle="standard" type="warning" title="重要なお知らせ">
 *   <NotificationBannerDate dateTime="2024-07-01">2024年7月1日</NotificationBannerDate>
 *   <NotificationBannerClose />
 *   <NotificationBannerBody>
 *     重要な情報をお知らせします。
 *   </NotificationBannerBody>
 *   <NotificationBannerActions>
 *     <Button variant="solid-fill" size="md">詳細を見る</Button>
 *     <Button variant="outline" size="md">後で見る</Button>
 *   </NotificationBannerActions>
 * </NotificationBanner>
 * ```
 */
export const NotificationBanner = (props: Props) => {
  const { className, children, bannerStyle, type, title, headingLevel } = props;
  const Tag = headingLevel ?? 'div';

  return (
    <div
      className={`
        grid grid-cols-[var(--icon-size)_1fr_minmax(0,auto)] grid-rows-[minmax(calc(36/16*1rem),auto)] border-current px-4 pt-2 pb-6 [--icon-size:calc(24/16*1rem)] gap-4
        desktop:gap-x-6 desktop:px-6 desktop:pt-6 desktop:pb-8 desktop:[--icon-size:calc(36/16*1rem)]
        ${bannerStyleClasses}
        ${bannerTypeClasses}
        ${className ?? ''}
      `}
      data-type={type}
      data-style={bannerStyle}
    >
      <Tag className={`col-span-2 grid grid-cols-[inherit] gap-[inherit]`}>
        <NotificationBannerIcon
          className='justify-self-center mt-[calc(3/16*1rem)] size-7 max-w-none max-h-none desktop:size-11 desktop:-my-1'
          type={type}
        />
        <span className='pt-[calc(3/16*1rem)] text-std-17B-170 text-solid-gray-900 desktop:text-std-20B-150 desktop:pt-0.5'>
          {title}
        </span>
      </Tag>
      {children}
    </div>
  );
};
