"use client";

import React from "react";
import { DadsBreadcrumbs } from "./dads/DadsBreadcrumbs";
import { DadsHeading } from "./dads/DadsHeading";
import { DadsNotificationBanner } from "./dads/DadsNotificationBanner";
import { DadsResourceList } from "./dads/DadsResourceList";
import { DadsTable } from "./dads/DadsTable";
import { DadsStepNavigation } from "./dads/DadsStepNavigation";
import { DadsLink } from "./dads/DadsLink";
import RichTextRenderer from "./richtext/RichTextRenderer";
import { MunicipalityProvider, useMunicipality, prefixInternalLink } from "./MunicipalityContext";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";

/**
 * ブロックの型定義
 * v2スキーマのブロック定義に対応
 */
interface BaseBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface BreadcrumbItem {
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

interface ResourceListItem {
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

/**
 * BlockRenderer: Artifactのブロック配列をレンダリング
 */
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

/**
 * 個別ブロックのレンダリング
 */
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
          <p className="text-sm text-gray-500">
            未対応ブロック: {type}
          </p>
        </div>
      );
  }
}

// ============================================================================
// Block Components
// ============================================================================

function BreadcrumbsBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as BreadcrumbItem[]) || [];
  return <DadsBreadcrumbs idBase="breadcrumb" items={items} />;
}

function TitleBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || (props.title as string) || "";
  return (
    <DadsHeading as="h1" size="xl" className="mb-6">
      {text}
    </DadsHeading>
  );
}

function SummaryBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || "";
  return (
    <p className="text-lg text-gray-700 mb-8 leading-relaxed">
      {text}
    </p>
  );
}

function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const content = props.content;
  if (!content) return null;
  return <RichTextRenderer content={content as RichTextContent | RichTextNodeType[]} />;
}

function RawContentBlock({ props }: { props: Record<string, unknown> }) {
  const headings = (props.headings as Array<{ level: number; text: string }>) || [];
  const main = (props.main as Array<{ type: string; text?: string; items?: string[]; rows?: string[][] }>) || [];
  const links = (props.links as Array<{ text: string; href: string }>) || [];

  return (
    <div className="raw-content space-y-4">
      {headings.map((h, i) => {
        const Tag = `h${Math.min(h.level + 1, 6)}` as keyof JSX.IntrinsicElements;
        const size = h.level === 1 ? "45" : h.level === 2 ? "32" : "24";
        return (
          <Tag key={`h-${i}`} className="dads-heading" data-size={size}>
            {h.text}
          </Tag>
        );
      })}

      {main.map((item, i) => {
        if (item.type === "p") {
          return <p key={`p-${i}`} className="mb-4">{item.text}</p>;
        }
        if (item.type === "ul") {
          return (
            <ul key={`ul-${i}`} className="list-disc list-inside mb-4 space-y-1">
              {item.items?.map((li, j) => <li key={j}>{li}</li>)}
            </ul>
          );
        }
        if (item.type === "ol") {
          return (
            <ol key={`ol-${i}`} className="list-decimal list-inside mb-4 space-y-1">
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
                    <tr key={ri} className="border-b">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2 border">{cell}</td>
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
          <DadsHeading as="h3" size="s" className="mb-2">関連リンク</DadsHeading>
          <ul className="space-y-1">
            {links.map((link, i) => (
              <li key={i}>
                <DadsLink href={link.href} external={link.href.startsWith("mailto:")}>
                  {link.text}
                </DadsLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TableBlock({ props }: { props: Record<string, unknown> }) {
  const rawRows = (props.rows as TableRow[]) || [];
  // valueが配列の場合はRichTextRendererでレンダリング
  const rows = rawRows.map(row => ({
    label: row.label,
    value: Array.isArray(row.value) ? <RichTextRenderer content={row.value as RichTextNodeType[]} /> : row.value,
  }));
  return <DadsTable rows={rows} />;
}

function ResourceListBlock({ props }: { props: Record<string, unknown> }) {
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

  // title/href と text/url の両方に対応
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
      {heading && <DadsHeading as="h3" size="s" className="mb-3">{heading}</DadsHeading>}
      <DadsResourceList items={items} ariaLabel={heading} />
    </div>
  );
}

function NotificationBannerBlock({ props }: { props: Record<string, unknown> }) {
  const severity = (props.severity as "info" | "warning" | "danger" | "success") || "info";
  const title = props.title as string | undefined;
  const content = (props.content as RichTextNodeType[]) || [];
  return (
    <DadsNotificationBanner severity={severity} title={title}>
      <RichTextRenderer content={content} />
    </DadsNotificationBanner>
  );
}

function AccordionBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as AccordionItem[]) || [];

  return (
    <div className="accordion space-y-2 mb-6">
      {items.map((item, i) => (
        <details key={i} className="border rounded-lg">
          <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-medium">
            {item.title}
          </summary>
          <div className="px-4 py-3 border-t">
            <RichTextRenderer content={item.content} />
          </div>
        </details>
      ))}
    </div>
  );
}

function RelatedLinksBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as RelatedLinkItem[]) || [];

  if (items.length === 0) return null;

  return (
    <div className="related-links mt-8 pt-6 border-t">
      <DadsHeading as="h2" size="s" className="mb-4">関連リンク</DadsHeading>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const title = item.title || item.text || "";
          const href = item.href || item.url || "#";
          const isExternal = item.external || href.startsWith("http") || href.startsWith("mailto:");
          return (
            <li key={i}>
              <DadsLink href={href} external={isExternal}>
                {title}
              </DadsLink>
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
    <div className="contact-card bg-gray-50 rounded-lg p-6 mb-6">
      {department && (
        <DadsHeading as="h3" size="s" className="mb-4">{department}</DadsHeading>
      )}
      <dl className="space-y-2">
        {phone && (
          <div className="flex">
            <dt className="w-24 font-medium text-gray-600">電話</dt>
            <dd>
              <a href={`tel:${phone}`} className="text-blue-700 hover:underline">
                {phone}
              </a>
            </dd>
          </div>
        )}
        {fax && (
          <div className="flex">
            <dt className="w-24 font-medium text-gray-600">FAX</dt>
            <dd>{fax}</dd>
          </div>
        )}
        {email && (
          <div className="flex">
            <dt className="w-24 font-medium text-gray-600">メール</dt>
            <dd>
              <a href={`mailto:${email}`} className="text-blue-700 hover:underline">
                {email}
              </a>
            </dd>
          </div>
        )}
        {hours && (
          <div className="flex">
            <dt className="w-24 font-medium text-gray-600">受付時間</dt>
            <dd>{hours}</dd>
          </div>
        )}
        {address && (
          <div className="flex">
            <dt className="w-24 font-medium text-gray-600">住所</dt>
            <dd>
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  {address}
                </a>
              ) : (
                address
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
        className="inline-flex items-center px-6 py-3 bg-blue-700 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
      >
        {label}
        {actionType === "pdf" && (
          <span className="ml-2 text-sm">(PDF)</span>
        )}
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
  const size = (props.size as "normal" | "small") || "normal";
  const orientation = (props.orientation as "vertical" | "horizontal") || "vertical";

  return (
    <DadsStepNavigation
      steps={steps.map(s => ({ title: s.title }))}
      renderBody={(index) => <RichTextRenderer content={steps[index]?.body || []} />}
      size={size}
      orientation={orientation}
    />
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
    <div className="news-meta flex flex-wrap gap-4 text-sm text-gray-600 mb-6 pb-4 border-b">
      {publishedAt && (
        <span>公開日: {formatDate(publishedAt)}</span>
      )}
      {updatedAt && (
        <span>更新日: {formatDate(updatedAt)}</span>
      )}
      {category && (
        <span className="px-2 py-1 bg-gray-100 rounded">{category}</span>
      )}
    </div>
  );
}

function DirectoryListBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as DirectoryItem[]) || [];

  return (
    <div className="directory-list space-y-4 mb-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-lg mb-2">
            {item.url ? (
              <a href={item.url} className="text-blue-700 hover:underline">
                {item.name}
              </a>
            ) : (
              item.name
            )}
          </h3>
          {item.description && (
            <p className="text-gray-600 mb-2">{item.description}</p>
          )}
          <dl className="text-sm space-y-1">
            {item.address && (
              <div className="flex">
                <dt className="w-16 text-gray-500">住所</dt>
                <dd>{item.address}</dd>
              </div>
            )}
            {item.phone && (
              <div className="flex">
                <dt className="w-16 text-gray-500">電話</dt>
                <dd>
                  <a href={`tel:${item.phone}`} className="text-blue-700 hover:underline">
                    {item.phone}
                  </a>
                </dd>
              </div>
            )}
            {item.hours && (
              <div className="flex">
                <dt className="w-16 text-gray-500">営業時間</dt>
                <dd>{item.hours}</dd>
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

function HeroBlock({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "";
  const subtitle = (props.subtitle as string) || "";

  return (
    <div className="hero-block py-8 mb-8 border-b border-gray-200">
      <h1 className="dads-heading dads-heading--xl" data-size="64">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-xl text-gray-600">{subtitle}</p>
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
          <a
            key={i}
            href={prefixInternalLink(item.href, municipalityId)}
            className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.description}
              </p>
            )}
          </a>
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
      <ul className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <li key={i}>
            <a
              href={prefixInternalLink(item.href, municipalityId)}
              className="block py-4 hover:bg-gray-50 transition-colors group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 mb-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
            </a>
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
          <a
            key={i}
            href={prefixInternalLink(item.href, municipalityId)}
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            {item.title}
          </a>
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
      <DadsHeading as="h2" size="m" className="mb-4">お知らせ</DadsHeading>
      <ul className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <li key={i} className="py-3">
            <a href={prefixInternalLink(item.href, municipalityId)} className="block hover:bg-gray-50 transition-colors group">
              <div className="flex items-start gap-4">
                {item.published_at && (
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(item.published_at)}
                  </span>
                )}
                <div className="flex-1">
                  {item.category && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded mr-2">
                      {item.category}
                    </span>
                  )}
                  <span className="text-gray-900 group-hover:text-blue-700">
                    {item.title}
                  </span>
                </div>
              </div>
            </a>
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
      <h2 className="font-bold text-lg mb-2">{title}</h2>
      <RichTextRenderer content={content} />
      {href && (
        <a
          href={prefixInternalLink(href, municipalityId)}
          className="inline-block mt-2 text-sm font-medium underline hover:no-underline"
        >
          詳細を見る →
        </a>
      )}
    </div>
  );
}

export default BlockRenderer;
