"use client";

import React, { createContext, useContext } from "react";
import NextLink from "next/link";
import {
  Link,
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  ResourceList,
  ResourceListItem,
  ResourceListLink,
  ResourceListTitle,
  ResourceListDescription,
  ResourceListMeta,
  NotificationBanner,
  NotificationBannerBody,
} from "@/components/dads";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";

// ============================================================================
// Municipality Context
// ============================================================================

interface MunicipalityContextValue {
  municipalityId: string;
}

const MunicipalityContext = createContext<MunicipalityContextValue | null>(null);

function MunicipalityProvider({
  children,
  municipalityId,
}: {
  children: React.ReactNode;
  municipalityId: string;
}) {
  return (
    <MunicipalityContext.Provider value={{ municipalityId }}>
      {children}
    </MunicipalityContext.Provider>
  );
}

function useMunicipality(): MunicipalityContextValue {
  const context = useContext(MunicipalityContext);
  if (!context) {
    throw new Error("useMunicipality must be used within a MunicipalityProvider");
  }
  return context;
}

/**
 * 内部リンクにmunicipalityプレフィックスを追加する
 * 外部リンク（http://, https://, mailto:, tel:）はそのまま返す
 */
function prefixInternalLink(href: string, municipalityId: string): string {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }

  if (href.startsWith(`/${municipalityId}/`) || href === `/${municipalityId}`) {
    return href;
  }

  if (href.startsWith("/")) {
    return `/${municipalityId}${href}`;
  }

  return href;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface BaseBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface BreadcrumbItemType {
  label: string;
  href: string;
}

interface RelatedLinkItem {
  title?: string;
  text?: string;
  href?: string;
  url?: string;
  external?: boolean;
}

interface _ResourceListItem {
  title: string;
  href: string;
  description?: string;
  meta?: string;
  external?: boolean;
}

interface TableRow {
  label: string;
  value: string | unknown[];
}

interface DirectoryItem {
  name: string;
  address?: string;
  phone?: string;
  hours?: string;
  url?: string;
  description?: string;
}

interface StepItem {
  title: string;
  body: RichTextNodeType[];
}

interface AccordionItem {
  title: string;
  content: RichTextNodeType[];
}

interface TopicGridItem {
  title: string;
  href: string;
  description?: string;
  category?: string;
}

interface QuickLinkItem {
  title: string;
  href: string;
}

interface NewsItem {
  title: string;
  href: string;
  published_at?: string;
  category?: string;
}

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

// ============================================================================
// RichText Renderer (embedded)
// ============================================================================

function RichTextRenderer({ content }: { content: RichTextContent | RichTextNodeType[] }) {
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
      const listClass = node.ordered
        ? "list-decimal list-inside space-y-1 text-std-16N-170 text-solid-gray-800"
        : "list-disc list-inside space-y-1 text-std-16N-170 text-solid-gray-800";
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

function getHeadingSizeClass(level: number): string {
  const classes: Record<number, string> = {
    1: "text-std-45B-150 text-solid-gray-900 mb-4",
    2: "text-std-32B-150 text-solid-gray-900 mb-3",
    3: "text-std-24B-150 text-solid-gray-900 mb-2",
    4: "text-std-20B-150 text-solid-gray-900 mb-2",
    5: "text-std-17B-170 text-solid-gray-900 mb-2",
    6: "text-std-17B-170 text-solid-gray-900 mb-2",
  };
  return classes[level] || classes[3];
}

// ============================================================================
// BlockRenderer
// ============================================================================

interface BlockRendererProps {
  blocks: BaseBlock[];
  municipalityId: string;
}

export function BlockRenderer({ blocks, municipalityId }: BlockRendererProps) {
  return (
    <MunicipalityProvider municipalityId={municipalityId}>
      <div className="block-renderer max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {blocks.map((block) => (
          <BlockSwitch key={block.id} block={block} />
        ))}
      </div>
    </MunicipalityProvider>
  );
}

function BlockSwitch({ block }: { block: BaseBlock }) {
  const { type, props } = block;

  switch (type) {
    case "Breadcrumbs":
      return <BreadcrumbsBlock props={props} />;
    case "Title":
      return <TitleBlock props={props} />;
    case "Summary":
      return <SummaryBlock props={props} />;
    case "RichText":
      return <RichTextBlock props={props} />;
    case "RawContent":
      return <RawContentBlock props={props} />;
    case "Table":
      return <TableBlock props={props} />;
    case "ResourceList":
      return <ResourceListBlock props={props} />;
    case "NotificationBanner":
      return <NotificationBannerBlock props={props} />;
    case "Accordion":
      return <AccordionBlock props={props} />;
    case "RelatedLinks":
      return <RelatedLinksBlock props={props} />;
    case "Contact":
    case "ContactCard":
      return <ContactBlock props={props} />;
    case "ActionButton":
      return <ActionButtonBlock props={props} />;
    case "StepNavigation":
      return <StepNavigationBlock props={props} />;
    case "NewsMeta":
      return <NewsMetaBlock props={props} />;
    case "DirectoryList":
      return <DirectoryListBlock props={props} />;
    case "Hero":
      return <HeroBlock props={props} />;
    case "TopicGrid":
      return <TopicGridBlock props={props} />;
    case "TopicList":
      return <TopicListBlock props={props} />;
    case "QuickLinks":
      return <QuickLinksBlock props={props} />;
    case "NewsList":
      return <NewsListBlock props={props} />;
    case "EmergencyBanner":
      return <EmergencyBannerBlock props={props} />;
    default:
      return (
        <div className="block-unknown" data-type={type}>
          <p className="text-sm text-gray-500">未対応ブロック: {type}</p>
        </div>
      );
  }
}

// ============================================================================
// Block Components
// ============================================================================

function BreadcrumbsBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const items = (props.items as BreadcrumbItemType[]) || [];

  return (
    <Breadcrumbs aria-label="パンくずリスト" className="mb-6">
      <BreadcrumbList>
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          const resolvedHref = prefixInternalLink(it.href, municipalityId);

          return (
            <BreadcrumbItem key={i} isCurrent={isLast}>
              {isLast ? (
                <span>{it.label}</span>
              ) : (
                <BreadcrumbLink asChild>
                  <NextLink href={resolvedHref}>{it.label}</NextLink>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumbs>
  );
}

function TitleBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || (props.title as string) || "";
  return (
    <h1 className="text-std-45B-150 text-solid-gray-900 mb-6">{text}</h1>
  );
}

function SummaryBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || "";
  return (
    <p className="text-std-17N-170 text-solid-gray-700 mb-8 leading-relaxed">{text}</p>
  );
}

function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const content = props.content;
  if (!content) return null;
  return (
    <div className="mb-6">
      <RichTextRenderer content={content as RichTextContent | RichTextNodeType[]} />
    </div>
  );
}

function RawContentBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const headings = (props.headings as Array<{ level: number; text: string }>) || [];
  const main = (props.main as Array<{ type: string; text?: string; items?: string[]; rows?: string[][] }>) || [];
  const links = (props.links as Array<{ text: string; href: string }>) || [];

  return (
    <div className="raw-content space-y-4 mb-6">
      {headings.map((h, i) => {
        const Tag = `h${Math.min(h.level + 1, 6)}` as keyof JSX.IntrinsicElements;
        const sizeClass = getHeadingSizeClass(h.level + 1);
        return (
          <Tag key={`h-${i}`} className={sizeClass}>{h.text}</Tag>
        );
      })}

      {main.map((item, i) => {
        if (item.type === "p") {
          return <p key={`p-${i}`} className="text-std-16N-170 text-solid-gray-800 mb-4">{item.text}</p>;
        }
        if (item.type === "ul") {
          return (
            <ul key={`ul-${i}`} className="list-disc list-inside mb-4 space-y-1 text-std-16N-170 text-solid-gray-800">
              {item.items?.map((li, j) => <li key={j}>{li}</li>)}
            </ul>
          );
        }
        if (item.type === "ol") {
          return (
            <ol key={`ol-${i}`} className="list-decimal list-inside mb-4 space-y-1 text-std-16N-170 text-solid-gray-800">
              {item.items?.map((li, j) => <li key={j}>{li}</li>)}
            </ol>
          );
        }
        if (item.type === "table" && item.rows) {
          return (
            <div key={`table-${i}`} className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse">
                <tbody>
                  {item.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-solid-gray-300">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2 border border-solid-gray-300 text-std-16N-170">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}

      {links.length > 0 && (
        <div className="mt-4">
          <h3 className="text-std-17B-170 text-solid-gray-900 mb-2">関連リンク</h3>
          <ul className="space-y-1">
            {links.map((link, i) => {
              const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
              const resolvedHref = isExternal ? link.href : prefixInternalLink(link.href, municipalityId);
              return (
                <li key={i}>
                  {isExternal ? (
                    <Link href={resolvedHref} target="_blank" rel="noopener noreferrer">
                      {link.text}
                    </Link>
                  ) : (
                    <Link asChild>
                      <NextLink href={resolvedHref}>{link.text}</NextLink>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function TableBlock({ props }: { props: Record<string, unknown> }) {
  const rawRows = (props.rows as TableRow[]) || [];

  return (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full">
        <tbody className="divide-y divide-solid-gray-300">
          {rawRows.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="px-4 py-3 text-left text-std-16N-170 font-medium text-solid-gray-700 bg-solid-gray-50 w-1/3">
                {row.label}
              </th>
              <td className="px-4 py-3 text-std-16N-170 text-solid-gray-800">
                {Array.isArray(row.value) ? (
                  <RichTextRenderer content={row.value as RichTextNodeType[]} />
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceListBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const heading = props.heading as string | undefined;
  const rawItems = (props.items as Array<{
    title?: string;
    text?: string;
    href?: string;
    url?: string;
    description?: string;
    meta?: string;
    external?: boolean;
  }>) || [];

  const items = rawItems.map(item => ({
    title: item.title || item.text || "",
    href: item.href || item.url || "#",
    description: item.description,
    meta: item.meta,
    external: item.external,
  }));

  if (items.length === 0) return null;

  return (
    <div className="resource-list-wrapper mb-6">
      {heading && <h3 className="text-std-17B-170 text-solid-gray-900 mb-3">{heading}</h3>}
      <ResourceList aria-label={heading}>
        {items.map((it, i) => {
          const isExternal = it.external || it.href.startsWith("http") || it.href.startsWith("mailto:");
          const resolvedHref = prefixInternalLink(it.href, municipalityId);

          return (
            <ResourceListItem key={i} asChild>
              {isExternal ? (
                <ResourceListLink href={resolvedHref} target="_blank" rel="noopener noreferrer">
                  <ResourceListTitle>{it.title}</ResourceListTitle>
                  {it.description && <ResourceListDescription>{it.description}</ResourceListDescription>}
                  {it.meta && <ResourceListMeta>{it.meta}</ResourceListMeta>}
                </ResourceListLink>
              ) : (
                <ResourceListLink asChild>
                  <NextLink href={resolvedHref}>
                    <ResourceListTitle>{it.title}</ResourceListTitle>
                    {it.description && <ResourceListDescription>{it.description}</ResourceListDescription>}
                    {it.meta && <ResourceListMeta>{it.meta}</ResourceListMeta>}
                  </NextLink>
                </ResourceListLink>
              )}
            </ResourceListItem>
          );
        })}
      </ResourceList>
    </div>
  );
}

function NotificationBannerBlock({ props }: { props: Record<string, unknown> }) {
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

function AccordionBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as AccordionItem[]) || [];

  return (
    <div className="accordion space-y-2 mb-6">
      {items.map((item, i) => (
        <details key={i} className="border border-solid-gray-300 rounded-lg">
          <summary className="px-4 py-3 cursor-pointer hover:bg-solid-gray-50 font-medium text-std-16N-170">
            {item.title}
          </summary>
          <div className="px-4 py-3 border-t border-solid-gray-300">
            <RichTextRenderer content={item.content} />
          </div>
        </details>
      ))}
    </div>
  );
}

function RelatedLinksBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const items = (props.items as RelatedLinkItem[]) || [];

  if (items.length === 0) return null;

  return (
    <div className="related-links mt-8 pt-6 border-t border-solid-gray-300">
      <h2 className="text-std-20B-150 text-solid-gray-900 mb-4">関連リンク</h2>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const title = item.title || item.text || "";
          const href = item.href || item.url || "#";
          const isExternal = item.external || href.startsWith("http") || href.startsWith("mailto:");
          const resolvedHref = isExternal ? href : prefixInternalLink(href, municipalityId);
          return (
            <li key={i}>
              {isExternal ? (
                <Link href={resolvedHref} target="_blank" rel="noopener noreferrer">
                  {title}
                </Link>
              ) : (
                <Link asChild>
                  <NextLink href={resolvedHref}>{title}</NextLink>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContactBlock({ props }: { props: Record<string, unknown> }) {
  const department = props.department as string | undefined;
  const phone = props.phone as string | undefined;
  const fax = props.fax as string | undefined;
  const email = props.email as string | undefined;
  const hours = props.hours as string | undefined;
  const address = props.address as string | undefined;
  const mapUrl = props.map_url as string | undefined;

  return (
    <div className="contact-card bg-solid-gray-50 rounded-lg p-6 mb-6">
      {department && (
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-4">{department}</h3>
      )}
      <dl className="space-y-2 text-std-16N-170">
        {phone && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">電話</dt>
            <dd>
              <Link href={`tel:${phone}`}>{phone}</Link>
            </dd>
          </div>
        )}
        {fax && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">FAX</dt>
            <dd className="text-solid-gray-800">{fax}</dd>
          </div>
        )}
        {email && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">メール</dt>
            <dd>
              <Link href={`mailto:${email}`}>{email}</Link>
            </dd>
          </div>
        )}
        {hours && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">受付時間</dt>
            <dd className="text-solid-gray-800">{hours}</dd>
          </div>
        )}
        {address && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">住所</dt>
            <dd>
              {mapUrl ? (
                <Link href={mapUrl} target="_blank" rel="noopener noreferrer">{address}</Link>
              ) : (
                <span className="text-solid-gray-800">{address}</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function ActionButtonBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const label = (props.label as string) || "申請する";
  const href = (props.href as string) || "#";
  const actionType = props.action_type as "web_form" | "pdf" | "external_link" | undefined;

  const isExternal = actionType === "external_link" || actionType === "pdf";
  const resolvedHref = isExternal ? href : prefixInternalLink(href, municipalityId);

  return (
    <div className="action-button my-6">
      <a
        href={resolvedHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="inline-flex items-center px-6 py-3 bg-blue-1000 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors"
      >
        {label}
        {actionType === "pdf" && <span className="ml-2 text-sm">(PDF)</span>}
        {isExternal && (
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </a>
    </div>
  );
}

function StepNavigationBlock({ props }: { props: Record<string, unknown> }) {
  const steps = (props.steps as StepItem[]) || [];

  return (
    <div className="step-navigation mb-6">
      <ol className="relative border-l-2 border-solid-gray-300 ml-4 space-y-8">
        {steps.map((step, i) => (
          <li key={i} className="ml-6">
            <span className="absolute -left-4 flex items-center justify-center w-8 h-8 bg-blue-1000 text-white rounded-full text-std-16B-100">
              {i + 1}
            </span>
            <h3 className="text-std-17B-170 text-solid-gray-900 mb-2">{step.title}</h3>
            <div className="text-std-16N-170 text-solid-gray-700">
              <RichTextRenderer content={step.body || []} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NewsMetaBlock({ props }: { props: Record<string, unknown> }) {
  const publishedAt = props.published_at as string | undefined;
  const updatedAt = props.updated_at as string | undefined;
  const category = props.category as string | undefined;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="news-meta flex flex-wrap gap-4 text-std-14N-170 text-solid-gray-600 mb-6 pb-4 border-b border-solid-gray-300">
      {publishedAt && <span>公開日: {formatDate(publishedAt)}</span>}
      {updatedAt && <span>更新日: {formatDate(updatedAt)}</span>}
      {category && <span className="px-2 py-1 bg-solid-gray-100 rounded">{category}</span>}
    </div>
  );
}

function DirectoryListBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as DirectoryItem[]) || [];

  return (
    <div className="directory-list space-y-4 mb-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-solid-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-std-17B-170 text-solid-gray-900 mb-2">
            {item.url ? (
              <Link href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</Link>
            ) : (
              item.name
            )}
          </h3>
          {item.description && (
            <p className="text-std-14N-170 text-solid-gray-600 mb-2">{item.description}</p>
          )}
          <dl className="text-std-14N-170 space-y-1">
            {item.address && (
              <div className="flex">
                <dt className="w-16 text-solid-gray-500">住所</dt>
                <dd className="text-solid-gray-700">{item.address}</dd>
              </div>
            )}
            {item.phone && (
              <div className="flex">
                <dt className="w-16 text-solid-gray-500">電話</dt>
                <dd><Link href={`tel:${item.phone}`}>{item.phone}</Link></dd>
              </div>
            )}
            {item.hours && (
              <div className="flex">
                <dt className="w-16 text-solid-gray-500">営業時間</dt>
                <dd className="text-solid-gray-700">{item.hours}</dd>
              </div>
            )}
          </dl>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Home Page Blocks
// ============================================================================

function HeroBlock({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "";
  const subtitle = (props.subtitle as string) || "";

  return (
    <div className="hero-block py-8 mb-8 border-b border-solid-gray-200">
      <h1 className="text-std-45B-150 text-solid-gray-900">{title}</h1>
      {subtitle && (
        <p className="mt-4 text-std-20N-150 text-solid-gray-600">{subtitle}</p>
      )}
    </div>
  );
}

function TopicGridBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const items = (props.items as TopicGridItem[]) || [];

  if (items.length === 0) return null;

  return (
    <div className="topic-grid mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <NextLink
            key={i}
            href={prefixInternalLink(item.href, municipalityId)}
            className="block p-5 bg-white border border-solid-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h3 className="font-bold text-std-17B-170 text-solid-gray-900 group-hover:text-blue-1000 mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-std-14N-170 text-solid-gray-600 line-clamp-2">
                {item.description}
              </p>
            )}
          </NextLink>
        ))}
      </div>
    </div>
  );
}

function TopicListBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const items = (props.items as TopicGridItem[]) || [];

  if (items.length === 0) return null;

  return (
    <div className="topic-list mb-8">
      <ul className="divide-y divide-solid-gray-100">
        {items.map((item, i) => (
          <li key={i}>
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="block py-4 hover:bg-solid-gray-50 transition-colors group"
            >
              <h3 className="font-semibold text-solid-gray-900 group-hover:text-blue-1000 mb-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-std-14N-170 text-solid-gray-600">{item.description}</p>
              )}
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickLinksBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const items = (props.items as QuickLinkItem[]) || [];

  if (items.length === 0) return null;

  return (
    <div className="quick-links mb-8">
      <div className="flex flex-wrap gap-3">
        {items.map((item, i) => (
          <NextLink
            key={i}
            href={prefixInternalLink(item.href, municipalityId)}
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-1000 rounded-full hover:bg-blue-100 transition-colors text-std-14N-170 font-medium"
          >
            {item.title}
          </NextLink>
        ))}
      </div>
    </div>
  );
}

function NewsListBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const items = (props.items as NewsItem[]) || [];

  if (items.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="news-list mb-8">
      <h2 className="text-std-24B-150 text-solid-gray-900 mb-4">お知らせ</h2>
      <ul className="divide-y divide-solid-gray-100">
        {items.map((item, i) => (
          <li key={i} className="py-3">
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="block hover:bg-solid-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {item.published_at && (
                  <span className="text-std-14N-170 text-solid-gray-500 whitespace-nowrap">
                    {formatDate(item.published_at)}
                  </span>
                )}
                <div className="flex-1">
                  {item.category && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-solid-gray-100 text-solid-gray-600 rounded mr-2">
                      {item.category}
                    </span>
                  )}
                  <span className="text-solid-gray-900 group-hover:text-blue-1000">
                    {item.title}
                  </span>
                </div>
              </div>
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmergencyBannerBlock({ props }: { props: Record<string, unknown> }) {
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
          className="inline-block mt-2 text-std-14N-170 font-medium underline hover:no-underline"
        >
          詳細を見る →
        </NextLink>
      )}
    </div>
  );
}

export default BlockRenderer;
