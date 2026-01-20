import type { ReactNode } from 'react';

type Props = {
  className?: string;
  children: ReactNode;
};

/**
 * NotificationBannerのアクションボタンコンテナ
 *
 * オプション要素として、バナー内にアクションボタンを配置するためのコンテナです。
 * アクションボタンの個数に制限はありませんが、画角の狭いデバイスでの表示も考慮した個数にとどめてください。
 * ボタンラベルの文字数によっても妥当な個数は変動します。
 *
 * グリッドレイアウトで配置され、デスクトップでは水平配置、モバイルでは2列配置になります。
 *
 * 共存制約:
 * - リンクのみのバナーには閉じるボタンを含めることができません
 * - アクションボタンで「閉じる」機能を実装せず、専用の閉じるボタン (NotificationBannerClose) を使用してください
 *
 * @example
 * ```tsx
 * <NotificationBannerActions>
 *   <Button variant="solid-fill" size="md">詳細を見る</Button>
 *   <Button variant="outline" size="md">後で見る</Button>
 * </NotificationBannerActions>
 * ```
 */
export const NotificationBannerActions = (props: Props) => {
  const { className, children } = props;

  return (
    <div
      className={`
        col-start-1 -col-end-1 desktop:col-start-2
        grid grid-cols-2 gap-2 desktop:flex desktop:flex-row desktop:gap-4
        ${className ?? ''}
      `}
    >
      {children}
    </div>
  );
};
