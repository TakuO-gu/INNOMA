"use client";

import React from "react";
import NextLink from "next/link";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import type { TopicGridItem, QuickLinkItem, NewsItem } from "../types";
import { budouxParse } from "@/components/BudouX";

export function HeroBlock({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "";
  const subtitle = (props.subtitle as string) || "";

  return (
    <div className="mt-0 hero-block py-8 mb-8 border-b border-solid-gray-200">
      <h1 className="text-std-45B-140 text-solid-gray-900 budoux">{budouxParse(title)}</h1>
      {subtitle && (
        <p className="mt-4 text-std-20N-150 text-solid-gray-600 budoux">{budouxParse(subtitle)}</p>
      )}
    </div>
  );
}

export function TopicGridBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const items = (props.items as TopicGridItem[]) || [];

  // 完成済みページのみをフィルタリング
  const completedItems = items.filter((item) => isPageCompleted(item.href));

  if (completedItems.length === 0) return null;

  return (
    <div className="mt-12 topic-grid mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedItems.map((item, i) => (
          <NextLink
            key={i}
            href={prefixInternalLink(item.href, municipalityId)}
            className="block p-5 bg-white border border-solid-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <h3 className="font-bold text-std-17B-170 text-solid-gray-900 group-hover:text-blue-1000 mb-2 budoux">
              {budouxParse(item.title)}
            </h3>
            {item.description && (
              <p className="text-sm text-solid-gray-600 line-clamp-2 budoux">
                {budouxParse(item.description)}
              </p>
            )}
          </NextLink>
        ))}
      </div>
    </div>
  );
}

export function TopicListBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const items = (props.items as TopicGridItem[]) || [];

  // 完成済みページのみをフィルタリング
  const completedItems = items.filter((item) => isPageCompleted(item.href));

  if (completedItems.length === 0) return null;

  return (
    <div className="mt-12 topic-list mb-8">
      <ul className="divide-y divide-solid-gray-100">
        {completedItems.map((item, i) => (
          <li key={i}>
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="block py-4 hover:bg-solid-gray-50 transition-colors group"
            >
              <h3 className="font-semibold text-solid-gray-900 group-hover:text-blue-1000 mb-1 budoux">
                {budouxParse(item.title)}
              </h3>
              {item.description && (
                <p className="text-sm text-solid-gray-600 budoux">{budouxParse(item.description)}</p>
              )}
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuickLinksBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const items = (props.items as QuickLinkItem[]) || [];

  // 完成済みページのみをフィルタリング
  const completedItems = items.filter((item) => isPageCompleted(item.href));

  if (completedItems.length === 0) return null;

  return (
    <div className="mt-12 quick-links mb-8">
      <div className="flex flex-wrap gap-3">
        {completedItems.map((item, i) => (
          <NextLink
            key={i}
            href={prefixInternalLink(item.href, municipalityId)}
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-1000 rounded-full hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            {item.title}
          </NextLink>
        ))}
      </div>
    </div>
  );
}

export function NewsListBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const items = (props.items as NewsItem[]) || [];

  // 完成済みページのみをフィルタリング
  const completedItems = items.filter((item) => isPageCompleted(item.href));

  if (completedItems.length === 0) return null;

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
    <div className="mt-12 news-list mb-8">
      <h2 className="text-std-24B-150 text-solid-gray-900 mb-4">お知らせ</h2>
      <ul className="divide-y divide-solid-gray-100">
        {completedItems.map((item, i) => (
          <li key={i} className="py-3">
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="block hover:bg-solid-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                {item.published_at && (
                  <span className="text-sm text-solid-gray-500 whitespace-nowrap">
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
