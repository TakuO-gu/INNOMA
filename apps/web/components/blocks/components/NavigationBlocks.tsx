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

export function ResourceListBlock({ props }: { props: Record<string, unknown> }) {
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

export function RelatedLinksBlock({ props }: { props: Record<string, unknown> }) {
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
