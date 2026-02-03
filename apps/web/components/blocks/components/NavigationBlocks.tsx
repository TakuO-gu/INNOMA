"use client";

import React from "react";
import NextLink from "next/link";
import {
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
  Link,
} from "@/components/dads";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import type { BreadcrumbItemType, RelatedLinkItem } from "../types";

export function BreadcrumbsBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const items = (props.items as BreadcrumbItemType[]) || [];

  // 完成済みページのみをフィルタリング（現在のページは最後の項目なので除外しない）
  const completedItems = items.filter((it, i) => {
    const isLast = i === items.length - 1;
    return isLast || isPageCompleted(it.href);
  });

  return (
    <Breadcrumbs aria-label="パンくずリスト" className="mt-0 mb-6">
      <BreadcrumbList>
        {completedItems.map((it, i) => {
          const isLast = i === completedItems.length - 1;
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

export function ResourceListBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const heading = props.heading as string | undefined;
  const columns = (props.columns as number) || 1;
  const bordered = props.bordered as boolean | undefined;
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

  // 完成済みページのみをフィルタリング（外部リンクは常に表示）
  const completedItems = items.filter((it) => isPageCompleted(it.href));

  if (completedItems.length === 0) return null;

  // グリッドレイアウトの場合
  const isGrid = columns > 1;
  const gridClass = isGrid
    ? `grid gap-4 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`
    : '';
  const itemClass = isGrid && bordered ? 'border border-solid-gray-300 rounded-lg p-4 hover:bg-solid-gray-50 transition-colors' : '';

  if (isGrid) {
    return (
      <section className="mt-12 resource-list-wrapper mb-6">
        {heading && <p className="text-[1.0625rem] font-bold leading-[1.7] tracking-[0.02em] mb-3" style={{ color: 'var(--color-neutral-solid-gray-900)' }}>{heading}</p>}
        <div className={gridClass}>
          {completedItems.map((it, i) => {
            const isExternal = it.external || it.href.startsWith("http") || it.href.startsWith("mailto:");
            const resolvedHref = prefixInternalLink(it.href, municipalityId);

            const content = (
              <div className={itemClass}>
                <span className="block text-std-17B-170 text-blue-1000 underline underline-offset-[calc(3/16*1rem)]">{it.title}</span>
                {it.description && <span className="block mt-1 text-std-16N-170 text-solid-gray-700">{it.description}</span>}
                {it.meta && <span className="block mt-1 text-std-14N-170 text-solid-gray-600">{it.meta}</span>}
              </div>
            );

            return isExternal ? (
              <a key={i} href={resolvedHref} target="_blank" rel="noopener noreferrer" className="block">
                {content}
              </a>
            ) : (
              <NextLink key={i} href={resolvedHref} className="block">
                {content}
              </NextLink>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="mt-12 resource-list-wrapper mb-6">
      {heading && <p className="text-[1.0625rem] font-bold leading-[1.7] tracking-[0.02em] mb-3" style={{ color: 'var(--color-neutral-solid-gray-900)' }}>{heading}</p>}
      <ResourceList aria-label={heading}>
        {completedItems.map((it, i) => {
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

export function RelatedLinksBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const items = (props.items as RelatedLinkItem[]) || [];

  // 完成済みページのみをフィルタリング（外部リンクは常に表示）
  const completedItems = items.filter((item) => {
    const href = item.href || item.url || "#";
    return isPageCompleted(href);
  });

  if (completedItems.length === 0) return null;

  return (
    <div className="mt-12 related-links pt-6 border-t border-solid-gray-300">
      <h2 className="text-std-20B-150 text-solid-gray-900 mb-4">関連リンク</h2>
      <ul className="space-y-2">
        {completedItems.map((item, i) => {
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
