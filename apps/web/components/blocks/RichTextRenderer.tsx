"use client";

import React from "react";
import NextLink from "next/link";
import {
  Link,
} from "@/components/dads";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";
import { useMunicipality, prefixInternalLink } from "./MunicipalityContext";
import type { RichTextNode } from "./types";
import { budouxParse } from "@/components/BudouX";

export function RichTextRenderer({ content }: { content: RichTextContent | RichTextNodeType[] }) {
  const { municipalityId } = useMunicipality();

  if (!content) return null;

  if (Array.isArray(content)) {
    return <div>{renderNodes(content as RichTextNode[], municipalityId)}</div>;
  }

  if (typeof content === "string") {
    if (content.startsWith("[") || content.startsWith("{")) {
      try {
        const parsed = JSON.parse(content) as RichTextNode[];
        return <div>{renderNodes(parsed, municipalityId)}</div>;
      } catch {
        // JSONパースに失敗した場合はプレーンテキストとして処理
      }
    }

    const paragraphs = content.split("\n\n").filter((p) => p.trim());
    if (paragraphs.length > 1) {
      return (
        <div>
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
      <div>
        <p className="text-std-16N-170 text-solid-gray-800">{content}</p>
      </div>
    );
  }

  return null;
}

/** 未解決変数パターン: {{...}} */
const UNRESOLVED_VARIABLE_PATTERN = /\{\{[^}]+\}\}/;

/**
 * テキストまたはノードに未解決の変数（{{...}}）が含まれているかチェック
 */
function hasUnresolvedVariable(target: string | RichTextNode): boolean {
  if (typeof target === "string") {
    return UNRESOLVED_VARIABLE_PATTERN.test(target);
  }
  // RichTextNode の場合
  const node = target;
  if (node.type === "paragraph" && node.runs) {
    return node.runs.some(run => hasUnresolvedVariable(run.text || ""));
  }
  if (node.type === "heading" && node.text) {
    return hasUnresolvedVariable(node.text);
  }
  return false;
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
      const sourceRef = (node as { sourceRef?: number }).sourceRef;
      return (
        <Tag key={key} className={`${sizeClass} budoux`}>
          {budouxParse(node.text || "")}
          {sourceRef !== undefined && (
            <a
              href={`#source-${sourceRef}`}
              className="text-blue-600 hover:text-blue-800 no-underline ml-1"
            >
              <sup className="text-xs font-normal">[{sourceRef}]</sup>
            </a>
          )}
        </Tag>
      );
    }

    case "paragraph": {
      // 未解決変数を含む段落は非表示
      if (hasUnresolvedVariable(node)) {
        return null;
      }
      return (
        <p key={key} className="text-std-16N-170 text-solid-gray-800 budoux">
          {node.runs?.map((run, runIdx) => renderRun(run, runIdx, municipalityId))}
        </p>
      );
    }

    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      // DADS推奨: pl-8でインデント、list-[revert]でブラウザデフォルトのマーカー表示
      // my-4 でリストの前後にスペースを追加（段落との間隔を確保）
      const listClass = node.ordered
        ? "pl-8 list-decimal space-y-1 text-std-16N-170 text-solid-gray-800 my-4"
        : "pl-8 list-disc space-y-1 text-std-16N-170 text-solid-gray-800 my-4";

      // 未解決変数を含むアイテムをフィルタリング
      const filteredItems = node.items?.filter(item => {
        // アイテム内のノードに未解決変数が含まれていないかチェック
        return !item.some(subNode => hasUnresolvedVariable(subNode));
      });

      // フィルタリング後にアイテムがない場合はnullを返す
      if (!filteredItems || filteredItems.length === 0) {
        return null;
      }

      return (
        <ListTag key={key} className={listClass}>
          {filteredItems.map((item, itemIdx) => (
            <li key={itemIdx}>
              {item.map((subNode, subIdx) => renderNode(subNode, subIdx, municipalityId))}
            </li>
          ))}
        </ListTag>
      );
    }

    case "divider":
      return <hr key={key} className="border-t border-solid-gray-300 my-6" />;

    default:
      return null;
  }
}

function renderRun(
  run: { text: string; bold?: boolean; link?: { href: string; label?: string; external?: boolean }; sourceRef?: number },
  key: number,
  municipalityId: string
): React.ReactNode {
  let content: React.ReactNode = budouxParse(run.text);

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

  // 参照番号がある場合、Wikipedia風の上付き文字で表示
  if (run.sourceRef !== undefined) {
    content = (
      <React.Fragment key={`source-${key}`}>
        {content}
        <a
          href={`#source-${run.sourceRef}`}
          className="text-blue-600 hover:text-blue-800 no-underline"
        >
          <sup className="text-xs font-normal">[{run.sourceRef}]</sup>
        </a>
      </React.Fragment>
    );
  }

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

export function getHeadingSizeClass(level: number): string {
  const classes: Record<number, string> = {
    1: "text-std-45B-140 text-solid-gray-900",
    2: "text-std-32B-150 text-solid-gray-900",
    3: "text-std-24B-150 text-solid-gray-900",
    4: "text-std-20B-150 text-solid-gray-900",
    5: "text-std-17B-170 text-solid-gray-900",
    6: "text-std-17B-170 text-solid-gray-900",
  };
  return classes[level] || classes[3];
}
