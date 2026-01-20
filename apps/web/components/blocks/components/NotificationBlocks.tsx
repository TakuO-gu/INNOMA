"use client";

import React from "react";
import NextLink from "next/link";
import {
  NotificationBanner,
  NotificationBannerBody,
} from "@/components/dads";
import type { RichTextNodeType } from "@/lib/artifact/schema";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import { RichTextRenderer } from "../RichTextRenderer";

export function NotificationBannerBlock({ props }: { props: Record<string, unknown> }) {
  const severity = (props.severity as "info" | "warning" | "danger" | "success") || "info";
  const title = (props.title as string) || "";
  const content = (props.content as RichTextNodeType[]) || [];

  const typeMap: Record<string, "info1" | "info2" | "warning" | "error" | "success"> = {
    info: "info1",
    warning: "warning",
    danger: "error",
    success: "success",
  };

  return (
    <div className="mb-6">
      <NotificationBanner bannerStyle="standard" type={typeMap[severity] || "info1"} title={title}>
        <NotificationBannerBody className="col-span-2 col-start-2">
          <RichTextRenderer content={content} />
        </NotificationBannerBody>
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
