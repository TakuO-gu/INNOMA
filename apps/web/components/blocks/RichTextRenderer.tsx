"use client";

import React from "react";
import NextLink from "next/link";
import {
  Link,
  NotificationBanner,
  NotificationBannerBody,
} from "@/components/dads";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";
import { useMunicipality, prefixInternalLink } from "./MunicipalityContext";
import type { RichTextNode } from "./types";

export function RichTextRenderer({ content }: { content: RichTextContent | RichTextNodeType[] }) {
  const { municipalityId } = useMunicipality();

  if (!content) return null;

  if (Array.isArray(content)) {
    return <div className="space-y-4">{renderNodes(content as RichTextNode[], municipalityId)}</div>;
  }

  if (typeof content === "string") {
    if (content.startsWith("[") || content.startsWith("{")) {
      try {
        const parsed = JSON.parse(content) as RichTextNode[];
        return <div className="space-y-4">{renderNodes(parsed, municipalityId)}</div>;
      } catch {
        // JSONパースに失敗した場合はプレーンテキストとして処理
      }
    }

    const paragraphs = content.split("\n\n").filter((p) => p.trim());
    if (paragraphs.length > 1) {
      return (
        <div className="space-y-4">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-std-16N-170 text-solid-gray-800">
              {para.split("\n").map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {lineIdx > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </p>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-std-16N-170 text-solid-gray-800">{content}</p>
      </div>
    );
  }

  return null;
}

function renderNodes(nodes: RichTextNode[], municipalityId: string): React.ReactNode[] {
  return nodes.map((node, idx) => renderNode(node, idx, municipalityId));
}

function renderNode(node: RichTextNode, key: number, municipalityId: string): React.ReactNode {
  switch (node.type) {
    case "heading": {
      const level = node.level || 2;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const sizeClass = getHeadingSizeClass(level);
      return (
        <Tag key={key} className={sizeClass}>
          {node.text}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p key={key} className="text-std-16N-170 text-solid-gray-800">
          {node.runs?.map((run, runIdx) => renderRun(run, runIdx, municipalityId))}
        </p>
      );

    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      // DADS推奨: pl-8でインデント、list-[revert]でブラウザデフォルトのマーカー表示
      const listClass = node.ordered
        ? "pl-8 list-decimal space-y-1 text-std-16N-170 text-solid-gray-800"
        : "pl-8 list-disc space-y-1 text-std-16N-170 text-solid-gray-800";
      return (
        <ListTag key={key} className={listClass}>
          {node.items?.map((item, itemIdx) => (
            <li key={itemIdx}>
              {item.map((subNode, subIdx) => renderNode(subNode, subIdx, municipalityId))}
            </li>
          ))}
        </ListTag>
      );
    }

    case "callout": {
      const severityMap: Record<string, "info1" | "info2" | "warning" | "error" | "success"> = {
        info: "info1",
        warning: "warning",
        danger: "error",
      };
      const type = severityMap[node.severity || "info"] || "info1";
      return (
        <NotificationBanner
          key={key}
          bannerStyle="standard"
          type={type}
          title={node.title || ""}
        >
          <NotificationBannerBody className="col-span-2 col-start-2">
            {node.content?.map((subNode, subIdx) => renderNode(subNode, subIdx, municipalityId))}
          </NotificationBannerBody>
        </NotificationBanner>
      );
    }

    case "divider":
      return <hr key={key} className="border-t border-solid-gray-300 my-6" />;

    default:
      return null;
  }
}

function renderRun(
  run: { text: string; bold?: boolean; link?: { href: string; label?: string; external?: boolean } },
  key: number,
  municipalityId: string
): React.ReactNode {
  let content: React.ReactNode = run.text;

  if (run.bold) {
    content = <strong key={`bold-${key}`}>{content}</strong>;
  }

  if (run.link) {
    const isExternal = run.link.external || run.link.href.startsWith("http") || run.link.href.startsWith("mailto:");
    const resolvedHref = isExternal ? run.link.href : prefixInternalLink(run.link.href, municipalityId);

    if (isExternal) {
      content = (
        <Link
          key={`link-${key}`}
          href={resolvedHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </Link>
      );
    } else {
      content = (
        <Link key={`link-${key}`} asChild>
          <NextLink href={resolvedHref}>{content}</NextLink>
        </Link>
      );
    }
  }

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

export function getHeadingSizeClass(level: number): string {
  const classes: Record<number, string> = {
    1: "text-std-45B-140 text-solid-gray-900 mb-4",
    2: "text-std-32B-150 text-solid-gray-900 mb-3",
    3: "text-std-24B-150 text-solid-gray-900 mb-2",
    4: "text-std-20B-150 text-solid-gray-900 mb-2",
    5: "text-std-17B-170 text-solid-gray-900 mb-2",
    6: "text-std-17B-170 text-solid-gray-900 mb-2",
  };
  return classes[level] || classes[3];
}
