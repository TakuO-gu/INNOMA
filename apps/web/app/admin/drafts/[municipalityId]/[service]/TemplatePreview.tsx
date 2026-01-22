"use client";

import { useState, useEffect, useRef } from "react";

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface VariableLocation {
  blockId: string;
  blockType: string;
  propPath: string;
  context: string;
  pageId?: string;
  pageTitle?: string;
  pagePath?: string;
}

// RichText content types
interface RichTextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface RichTextParagraph {
  type: "paragraph";
  runs: RichTextRun[];
}

interface RichTextHeading {
  type: "heading";
  level: number;
  text: string;
}

interface RichTextList {
  type: "list";
  ordered: boolean;
  items: RichTextContent[][];
}

interface RichTextCallout {
  type: "callout";
  severity: "info" | "warning" | "error";
  title?: string;
  content: RichTextContent[];
}

type RichTextContent = RichTextParagraph | RichTextHeading | RichTextList | RichTextCallout;

interface RelatedPage {
  pageId: string;
  pageTitle: string;
  pagePath: string;
}

interface SamplePageData {
  title: string;
  description: string;
  blocks: Block[];
  variableLocations: Record<string, VariableLocation[]>;
  relatedPages?: RelatedPage[];
  isSample?: boolean;
}

interface Props {
  municipalityId: string;
  service: string;
  highlightVariable?: string | null;
  variables?: Record<string, { value: string }>;
}

const blockTypeLabels: Record<string, string> = {
  Breadcrumbs: "パンくずリスト",
  Title: "タイトル",
  Summary: "概要",
  TopicList: "トピックリスト",
  RelatedLinks: "関連リンク",
  Contact: "問い合わせ先",
  Heading: "見出し",
  Paragraph: "段落",
  Table: "表",
  Callout: "注意書き",
  Steps: "ステップ",
  DocumentList: "必要書類",
  RichText: "リッチテキスト",
  TaskButton: "タスクボタン",
};

export function TemplatePreview({
  municipalityId,
  service,
  highlightVariable,
  variables,
}: Props) {
  const [pageData, setPageData] = useState<SamplePageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const highlightedBlockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/drafts/${municipalityId}/${service}/template`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch page");
        }

        const data = await response.json();
        setPageData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch page");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [municipalityId, service]);

  /**
   * Check if a block contains the highlighted variable
   */
  const blockContainsVariable = (block: Block): boolean => {
    if (!highlightVariable || !pageData) return false;
    const locations = pageData.variableLocations[highlightVariable] || [];
    return locations.some((loc) => loc.blockId === block.id);
  };

  /**
   * Check if the highlighted variable is in a different page (not the main sample page)
   */
  const getVariablePageInfo = (): { isOtherPage: boolean; pages: RelatedPage[] } | null => {
    if (!highlightVariable || !pageData) return null;
    const locations = pageData.variableLocations[highlightVariable] || [];
    if (locations.length === 0) return null;

    // Get unique pages where this variable is used
    const pageMap = new Map<string, RelatedPage>();
    for (const loc of locations) {
      if (loc.pageId && loc.pageTitle) {
        pageMap.set(loc.pageId, {
          pageId: loc.pageId,
          pageTitle: loc.pageTitle,
          pagePath: loc.pagePath || "",
        });
      }
    }

    const pages = Array.from(pageMap.values());

    // Check if any location matches the current sample page
    const mainPageTitle = pageData.title;
    const isInMainPage = pages.some((p) => p.pageTitle === mainPageTitle);

    return {
      isOtherPage: !isInMainPage && pages.length > 0,
      pages,
    };
  };

  /**
   * Get the variable value to highlight in the sample page
   */
  const getHighlightValue = (): string | null => {
    if (!highlightVariable || !variables) return null;
    return variables[highlightVariable]?.value || null;
  };

  /**
   * Auto-scroll to highlighted block when variable selection changes
   */
  useEffect(() => {
    if (!highlightVariable || !pageData) return;

    const locations = pageData.variableLocations[highlightVariable] || [];
    if (locations.length === 0) return;

    // Find the first block that contains this variable
    const firstBlockId = locations[0].blockId;
    const blockElement = highlightedBlockRefs.current.get(firstBlockId);

    if (blockElement && scrollContainerRef.current) {
      // Scroll the block into view with smooth animation
      blockElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightVariable, pageData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2 text-gray-500">サンプルページを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium">読み込みエラー</div>
        <div className="text-sm text-red-600 mt-1">{error}</div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="p-4 text-gray-500 text-center">
        サンプルページが見つかりません
      </div>
    );
  }

  const highlightValue = getHighlightValue();
  const variablePageInfo = getVariablePageInfo();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="font-medium text-sm text-gray-900">{pageData.title}</div>
          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
            サンプル
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{pageData.description}</div>
      </div>

      {/* Show notice when variable is on a different page */}
      {highlightVariable && variablePageInfo?.isOtherPage && (
        <div className="flex-shrink-0 p-3 border-b bg-purple-50">
          <div className="text-sm text-purple-800">
            <span className="font-medium">{highlightVariable}</span> は別のページで使用されています：
          </div>
          <div className="mt-2 space-y-1">
            {variablePageInfo.pages.map((page) => (
              <div
                key={page.pageId}
                className="flex items-center gap-2 text-sm"
              >
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                  {page.pageTitle}
                </span>
                <span className="text-purple-600 text-xs">{page.pagePath}</span>
              </div>
            ))}
          </div>
          {highlightValue && (
            <div className="mt-2 text-xs text-purple-600">
              値: <span className="font-mono bg-yellow-200 px-1 rounded">{highlightValue}</span>
            </div>
          )}
        </div>
      )}

      {/* Blocks Preview */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4 space-y-3">
        {pageData.blocks.map((block) => {
          const isHighlighted = blockContainsVariable(block);
          const blockLabel = blockTypeLabels[block.type] || block.type;

          return (
            <div
              key={block.id}
              ref={(el) => {
                if (el) {
                  highlightedBlockRefs.current.set(block.id, el);
                } else {
                  highlightedBlockRefs.current.delete(block.id);
                }
              }}
              className={`border rounded-lg p-3 transition-all ${
                isHighlighted
                  ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-300"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                  {blockLabel}
                </span>
                {isHighlighted && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800">
                    変数使用箇所
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700">
                {renderBlockContent(block, highlightValue, isHighlighted)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Variable locations info */}
      {highlightVariable && pageData.variableLocations[highlightVariable] && !variablePageInfo?.isOtherPage && (
        <div className="flex-shrink-0 p-3 border-t bg-blue-50">
          <div className="text-xs text-blue-700">
            <span className="font-medium">{highlightVariable}</span> は{" "}
            {pageData.variableLocations[highlightVariable].length} か所で使用されています
            {variablePageInfo?.pages && variablePageInfo.pages.length > 1 && (
              <span className="ml-2">
                （{variablePageInfo.pages.map((p) => p.pageTitle).join("、")}）
              </span>
            )}
            {highlightValue && (
              <span className="ml-2 text-blue-600">
                （値: <span className="font-mono bg-yellow-200 px-1 rounded">{highlightValue}</span>）
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Render block content based on type
 * Highlights the specified value in the sample page content
 */
function renderBlockContent(
  block: Block,
  highlightValue: string | null,
  isHighlightedBlock: boolean
): React.ReactNode {
  /**
   * Highlight a specific value within text
   */
  const highlightInText = (text: string): React.ReactNode => {
    if (!highlightValue || !isHighlightedBlock) {
      return text;
    }

    // Check if the text contains the highlight value
    const index = text.indexOf(highlightValue);
    if (index === -1) {
      return text;
    }

    // Split and highlight
    const before = text.substring(0, index);
    const match = text.substring(index, index + highlightValue.length);
    const after = text.substring(index + highlightValue.length);

    return (
      <>
        {before}
        <span className="bg-yellow-300 px-0.5 rounded font-medium ring-2 ring-yellow-400">
          {match}
        </span>
        {after}
      </>
    );
  };

  const { props } = block;

  switch (block.type) {
    case "Title":
      return (
        <h2 className="text-lg font-bold">{highlightInText(String(props.text || ""))}</h2>
      );

    case "Summary":
      return <p>{highlightInText(String(props.text || ""))}</p>;

    case "Heading":
      return (
        <h3 className="font-semibold">{highlightInText(String(props.text || ""))}</h3>
      );

    case "Paragraph":
      return <p>{highlightInText(String(props.text || ""))}</p>;

    case "TopicList": {
      const items = (props.items as Array<{ title: string; description?: string }>) || [];
      return (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="border-l-2 border-gray-300 pl-2">
              <div className="font-medium">{highlightInText(item.title)}</div>
              {item.description && (
                <div className="text-sm text-gray-600">
                  {highlightInText(item.description)}
                </div>
              )}
            </li>
          ))}
        </ul>
      );
    }

    case "Contact": {
      const dept = props.department as string | undefined;
      const phone = props.phone as string | undefined;
      const email = props.email as string | undefined;
      const hours = props.hours as string | undefined;
      const address = props.address as string | undefined;
      return (
        <div className="space-y-1 text-sm">
          {dept && (
            <div>
              <span className="text-gray-500">担当: </span>
              {highlightInText(dept)}
            </div>
          )}
          {phone && (
            <div>
              <span className="text-gray-500">電話: </span>
              {highlightInText(phone)}
            </div>
          )}
          {email && (
            <div>
              <span className="text-gray-500">メール: </span>
              {highlightInText(email)}
            </div>
          )}
          {hours && (
            <div>
              <span className="text-gray-500">受付時間: </span>
              {highlightInText(hours)}
            </div>
          )}
          {address && (
            <div>
              <span className="text-gray-500">住所: </span>
              {highlightInText(address)}
            </div>
          )}
        </div>
      );
    }

    case "Callout":
      return (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-2">
          {highlightInText(String(props.text || props.content || ""))}
        </div>
      );

    case "Steps": {
      const steps = (props.steps as Array<{ title: string; content?: string }>) || [];
      return (
        <ol className="list-decimal list-inside space-y-2">
          {steps.map((step, i) => (
            <li key={i}>
              <span className="font-medium">{highlightInText(step.title)}</span>
              {step.content && (
                <div className="text-sm text-gray-600 ml-4">
                  {highlightInText(step.content)}
                </div>
              )}
            </li>
          ))}
        </ol>
      );
    }

    case "Table": {
      // Templates use { label, value } format for rows
      const rows = props.rows as Array<{ label: string; value: string }> | string[][] | undefined;
      if (!rows || rows.length === 0) {
        return <div className="text-gray-400 text-sm">（テーブルデータなし）</div>;
      }

      // Check if rows are { label, value } objects or string[][]
      const isLabelValueFormat = rows.length > 0 && typeof rows[0] === "object" && "label" in rows[0];

      if (isLabelValueFormat) {
        const labelValueRows = rows as Array<{ label: string; value: string }>;
        return (
          <table className="min-w-full text-sm border">
            <tbody>
              {labelValueRows.map((row, ri) => (
                <tr key={ri}>
                  <td className="border px-2 py-1 bg-gray-50 font-medium">
                    {highlightInText(row.label)}
                  </td>
                  <td className="border px-2 py-1">
                    {highlightInText(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      // Fallback: string[][] format with optional headers
      const headers = (props.headers as string[]) || [];
      const arrayRows = rows as string[][];
      return (
        <table className="min-w-full text-sm border">
          {headers.length > 0 && (
            <thead className="bg-gray-50">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="border px-2 py-1 text-left">
                    {highlightInText(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {arrayRows.map((row, ri) => (
              <tr key={ri}>
                {Array.isArray(row) ? (
                  row.map((cell, ci) => (
                    <td key={ci} className="border px-2 py-1">
                      {highlightInText(String(cell))}
                    </td>
                  ))
                ) : (
                  <td className="border px-2 py-1">
                    {highlightInText(String(row))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case "Breadcrumbs": {
      const items = (props.items as Array<{ label: string }>) || [];
      return (
        <div className="text-xs text-gray-500">
          {items.map((item, i) => (
            <span key={i}>
              {i > 0 && " / "}
              {highlightInText(item.label)}
            </span>
          ))}
        </div>
      );
    }

    case "RelatedLinks": {
      const items = (props.items as Array<{ title: string }>) || [];
      return (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-gray-100 rounded"
            >
              {highlightInText(item.title)}
            </span>
          ))}
        </div>
      );
    }

    case "TaskButton": {
      const label = props.label as string | undefined;
      const href = props.href as string | undefined;
      const isTopTask = props.isTopTask as boolean | undefined;
      return (
        <div
          className={`inline-block px-3 py-1.5 rounded text-sm ${
            isTopTask
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 border border-gray-300"
          }`}
        >
          {highlightInText(label || "ボタン")}
          {href && (
            <span className="ml-2 text-xs opacity-70">
              → {highlightInText(href)}
            </span>
          )}
        </div>
      );
    }

    case "RichText": {
      const content = props.content as RichTextContent[] | undefined;
      if (!content || content.length === 0) {
        return <div className="text-xs text-gray-500 italic">（コンテンツなし）</div>;
      }
      return (
        <div className="space-y-2">
          {content.map((item, i) => renderRichTextItem(item, i, highlightInText))}
        </div>
      );
    }

    default:
      // Generic rendering for unknown block types
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
          {JSON.stringify(props, null, 2)}
        </pre>
      );
  }
}

/**
 * Render a RichText content item
 */
function renderRichTextItem(
  item: RichTextContent,
  index: number,
  highlightInText: (text: string) => React.ReactNode
): React.ReactNode {
  switch (item.type) {
    case "heading":
      const HeadingTag = `h${Math.min(item.level + 1, 6)}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag
          key={index}
          className={`font-semibold ${item.level === 2 ? "text-base" : "text-sm"}`}
        >
          {highlightInText(item.text)}
        </HeadingTag>
      );

    case "paragraph":
      return (
        <p key={index} className="text-sm">
          {item.runs.map((run, ri) => (
            <span
              key={ri}
              className={`${run.bold ? "font-bold" : ""} ${run.italic ? "italic" : ""}`}
            >
              {highlightInText(run.text)}
            </span>
          ))}
        </p>
      );

    case "list":
      const ListTag = item.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={index}
          className={`text-sm pl-4 space-y-1 ${item.ordered ? "list-decimal" : "list-disc"}`}
        >
          {item.items.map((listItem, li) => (
            <li key={li}>
              {listItem.map((content, ci) =>
                renderRichTextItem(content, ci, highlightInText)
              )}
            </li>
          ))}
        </ListTag>
      );

    case "callout":
      const severityStyles = {
        info: "bg-blue-50 border-blue-300 text-blue-800",
        warning: "bg-amber-50 border-amber-300 text-amber-800",
        error: "bg-red-50 border-red-300 text-red-800",
      };
      return (
        <div
          key={index}
          className={`border-l-4 p-2 text-sm ${severityStyles[item.severity] || severityStyles.info}`}
        >
          {item.title && <div className="font-medium mb-1">{highlightInText(item.title)}</div>}
          <div className="space-y-1">
            {item.content.map((content, ci) =>
              renderRichTextItem(content, ci, highlightInText)
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}
