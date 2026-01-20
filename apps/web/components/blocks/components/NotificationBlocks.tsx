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
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import { RichTextRenderer } from "../RichTextRenderer";

export function NotificationBannerBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const severity = (props.severity as "info" | "warning" | "danger" | "success") || "info";
  const title = (props.title as string) || "";
  const content = (props.content as RichTextNodeType[] | undefined);
  const date = props.date as { dateTime: string; display: string } | undefined;
  const showCloseButton = (props.showCloseButton as boolean) || false;
  const actions = props.actions as Array<{ label: string; href?: string; variant?: "solid-fill" | "outline" }> | undefined;

  const typeMap: Record<string, "info1" | "info2" | "warning" | "error" | "success"> = {
    info: "info1",
    warning: "warning",
    danger: "error",
    success: "success",
  };

  return (
    <div className="mb-6">
      <NotificationBanner bannerStyle="standard" type={typeMap[severity] || "info1"} title={title}>
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
            <RichTextRenderer content={content} />
          </NotificationBannerBody>
        )}

        {/* オプション要素: アクションボタン */}
        {actions && actions.length > 0 && (
          <NotificationBannerActions>
            {actions.map((action, index) => (
              action.href ? (
                <Button
                  key={index}
                  variant={action.variant || "solid-fill"}
                  size="md"
                  asChild
                >
                  <NextLink href={prefixInternalLink(action.href, municipalityId)}>
                    {action.label}
                  </NextLink>
                </Button>
              ) : (
                <Button
                  key={index}
                  variant={action.variant || "solid-fill"}
                  size="md"
                >
                  {action.label}
                </Button>
              )
            ))}
          </NotificationBannerActions>
        )}
      </NotificationBanner>
    </div>
  );
}

export function EmergencyBannerBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const title = (props.title as string) || "";
  const content = (props.content as RichTextNodeType[]) || [];
  const href = props.href as string | undefined;
  const severity = (props.severity as string) || "high";

  const severityClasses = severity === "critical"
    ? "bg-red-100 border-red-600 text-red-900"
    : "bg-amber-50 border-amber-500 text-amber-900";

  return (
    <div className={`emergency-banner p-4 rounded-lg border-l-4 mb-6 ${severityClasses}`}>
      <h2 className="font-bold text-std-17B-170 mb-2">{title}</h2>
      <RichTextRenderer content={content} />
      {href && (
        <NextLink
          href={prefixInternalLink(href, municipalityId)}
          className="inline-block mt-2 text-sm font-medium underline hover:no-underline"
        >
          詳細を見る →
        </NextLink>
      )}
    </div>
  );
}
