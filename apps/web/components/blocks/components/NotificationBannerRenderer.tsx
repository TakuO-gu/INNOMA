"use client";

import React from "react";
import NextLink from "next/link";
import {
  NotificationBanner,
  NotificationBannerBody,
  NotificationBannerDate,
  NotificationBannerClose,
  NotificationBannerActions,
  Button,
} from "@/components/dads";
import type { RichTextNodeType } from "@/lib/artifact/schema";

/**
 * NotificationBannerの共通レンダリング関数
 *
 * NotificationBannerブロックとRichText内のcalloutの両方で使用される
 */

export type NotificationBannerProps = {
  severity?: "info" | "warning" | "danger" | "success";
  title?: string;
  content?: RichTextNodeType[];
  date?: { dateTime: string; display: string };
  showCloseButton?: boolean;
  actions?: Array<{ label: string; href?: string; variant?: "solid-fill" | "outline" }>;
  municipalityId?: string;
  contentRenderer?: (content: RichTextNodeType[]) => React.ReactNode;
  className?: string;
};

// デフォルトタイトルのマッピング
const DEFAULT_TITLES: Record<string, string> = {
  info: "お知らせ",
  warning: "注意",
  danger: "重要",
  success: "完了",
};

// severityからNotificationBannerのtypeへのマッピング
const SEVERITY_TO_TYPE_MAP: Record<string, "info1" | "info2" | "warning" | "error" | "success"> = {
  info: "info1",
  warning: "warning",
  danger: "error",
  success: "success",
};

export function renderNotificationBanner({
  severity = "info",
  title,
  content,
  date,
  showCloseButton = false,
  actions,
  municipalityId,
  contentRenderer,
  className,
}: NotificationBannerProps): React.ReactNode {
  // titleが指定されていない場合はデフォルトタイトルを使用
  const finalTitle = title || DEFAULT_TITLES[severity] || "お知らせ";
  const type = SEVERITY_TO_TYPE_MAP[severity] || "info1";

  // classNameにmy-4を追加（既存のclassNameがあれば結合）
  const finalClassName = className ? `my-4 ${className}` : "my-4";

  return (
    <NotificationBanner bannerStyle="standard" type={type} title={finalTitle} className={`${finalClassName} no-heading-margin`}>
      {/* オプション要素: 年月日 */}
      {date && (
        <NotificationBannerDate dateTime={date.dateTime}>
          {date.display}
        </NotificationBannerDate>
      )}

      {/* オプション要素: 閉じるボタン */}
      {showCloseButton && (
        <NotificationBannerClose onClick={() => {
          // 閉じるボタンの実装
          // 実際のアプリケーションでは、状態管理で非表示にする
        }} />
      )}

      {/* 任意要素: バナーデスクリプション */}
      {content && content.length > 0 && (
        <NotificationBannerBody className="col-span-2 col-start-2">
          {contentRenderer ? contentRenderer(content) : null}
        </NotificationBannerBody>
      )}

      {/* オプション要素: アクションボタン */}
      {actions && actions.length > 0 && (
        <NotificationBannerActions>
          {actions.map((action, index) => {
            if (action.href && municipalityId) {
              const href = action.href.startsWith('http') || action.href.startsWith('mailto:')
                ? action.href
                : `/${municipalityId}${action.href}`;

              return (
                <Button
                  key={index}
                  variant={action.variant || "solid-fill"}
                  size="md"
                  asChild
                >
                  <NextLink href={href}>
                    {action.label}
                  </NextLink>
                </Button>
              );
            }

            return (
              <Button
                key={index}
                variant={action.variant || "solid-fill"}
                size="md"
              >
                {action.label}
              </Button>
            );
          })}
        </NotificationBannerActions>
      )}
    </NotificationBanner>
  );
}

// デフォルトタイトルを取得するヘルパー関数（外部からも使用可能）
export function getDefaultTitle(severity: string): string {
  return DEFAULT_TITLES[severity] || "お知らせ";
}
