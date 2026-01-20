"use client";

import React from "react";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";

interface RichTextNode {
  type: string;
  text?: string;
  level?: number;
  runs?: Array<{ text: string; bold?: boolean; link?: { href: string; label?: string; external?: boolean } }>;
  ordered?: boolean;
  items?: RichTextNode[][];
  severity?: "info" | "warning" | "danger";
  title?: string;
  content?: RichTextNode[];
}

/**
 * RichTextコンテンツをレンダリング
 * - プレーンテキスト（改行区切り）
 * - JSON文字列形式の構造化データ
 * - RichTextNodeType配列（v2形式）
 */
export default function RichTextRenderer({ content }: { content: RichTextContent | RichTextNodeType[] }) {
  const { municipalityId } = useMunicipality();

  if (!content) return null;

  // v2形式: RichTextNodeType配列として直接渡された場合
  if (Array.isArray(content)) {
    return <div className="dads-richtext">{renderNodes(content as RichTextNode[], municipalityId)}</div>;
  }

  // 文字列の場合
  if (typeof content === "string") {
    // JSON形式かどうかを判定
    if (content.startsWith("[") || content.startsWith("{")) {
      try {
        const parsed = JSON.parse(content) as RichTextNode[];
        return <div className="dads-richtext">{renderNodes(parsed, municipalityId)}</div>;
      } catch {
        // JSONパースに失敗した場合はプレーンテキストとして処理
      }
    }

    // プレーンテキスト（改行をbrに変換）
    const paragraphs = content.split("\n\n").filter((p) => p.trim());
    if (paragraphs.length > 1) {
      return (
        <div className="dads-richtext">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="dads-paragraph">
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

    // 単一段落またはHTML
    return (
      <div className="dads-richtext">
        <p className="dads-paragraph">{content}</p>
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
      const Tag = `h${node.level || 2}` as keyof JSX.IntrinsicElements;
      const dataSize = getHeadingDataSize(node.level || 2);
      return (
        <Tag
          key={key}
          className={`dads-heading dads-heading--${getHeadingSize(node.level || 2)}`}
          data-size={dataSize}
        >
          {node.text}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p key={key} className="dads-paragraph">
          {node.runs?.map((run, runIdx) => renderRun(run, runIdx, municipalityId))}
        </p>
      );

    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <ListTag key={key} className={`dads-list${node.ordered ? " dads-list--ordered" : ""}`}>
          {node.items?.map((item, itemIdx) => (
            <li key={itemIdx} className="dads-list__item">
              {item.map((subNode, subIdx) => renderNode(subNode, subIdx, municipalityId))}
            </li>
          ))}
        </ListTag>
      );
    }

    case "callout": {
      const severityClass = node.severity ? `dads-callout--${node.severity}` : "dads-callout--info";
      return (
        <aside key={key} className={`dads-callout ${severityClass}`}>
          {node.title && <p className="dads-callout__title">{node.title}</p>}
          <div className="dads-callout__content">
            {node.content?.map((subNode, subIdx) => renderNode(subNode, subIdx, municipalityId))}
          </div>
        </aside>
      );
    }

    case "divider":
      return <hr key={key} className="dads-divider" />;

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
    content = (
      <a
        key={`link-${key}`}
        href={resolvedHref}
        className="dads-link"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return <React.Fragment key={key}>{content}</React.Fragment>;
}

function getHeadingSize(level: number): string {
  const sizes: Record<number, string> = {
    1: "xl",
    2: "l",
    3: "m",
    4: "s",
    5: "xs",
    6: "xs",
  };
  return sizes[level] || "m";
}

/**
 * 見出しレベルをDADS準拠のdata-size属性値に変換
 * h1: 64px, h2: 45px, h3: 32px, h4: 24px, h5/h6: 20px
 */
function getHeadingDataSize(level: number): string {
  const dataSizes: Record<number, string> = {
    1: "64",
    2: "45",
    3: "32",
    4: "24",
    5: "20",
    6: "20",
  };
  return dataSizes[level] || "32";
}
