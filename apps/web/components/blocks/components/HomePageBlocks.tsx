"use client";

import React from "react";
import NextLink from "next/link";
import Image from "next/image";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import type { TopicGridItem, QuickLinkItem, NewsItem } from "../types";
import { budouxParse } from "@/components/BudouX";

// 右矢印アイコン（デジタル庁仕様）
const ArrowRightIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 flex-shrink-0 text-solid-gray-600">
    <svg
      aria-hidden="true"
      role="img"
      className="w-3 h-3 fill-current"
      viewBox="0 0 14 14"
    >
      <path d="M7.3813 1.67358L12.3591 6.59668L7.3813 11.5198L6.4582 10.5967L9.85825 7.19663H2.08008V5.99663H9.85816L6.4582 2.59668L7.3813 1.67358Z" />
    </svg>
  </span>
);

export function HeroBlock({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "";
  const subtitle = (props.subtitle as string) || "";

  return (
    <div className="mt-0 hero-block py-8 mb-8">
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
  const heading = (props.heading as string) || "カテゴリから探す";

  // 完成済みページのみをフィルタリング
  const completedItems = items.filter((item) => isPageCompleted(item.href));

  if (completedItems.length === 0) return null;

  return (
    <div className="mt-12 topic-grid mb-10">
      <h2 className="text-std-24B-150 text-solid-gray-900 mb-6 budoux">
        {budouxParse(heading)}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
        {completedItems.map((item, i) => (
          <li key={i}>
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="mdcontainer-card-inner block h-full"
            >
              <article className="mdcontainer-card flex flex-col h-full border border-solid-gray-200 rounded-lg bg-white hover:bg-solid-gray-50 transition-colors p-4">
                <div className="mdcontainer-card__body flex flex-col flex-1">
                  <div className="flex items-start gap-3">
                    {item.icon && (
                      <Image
                        src={
                          item.icon.includes(".")
                            ? `/icons/${item.icon}`
                            : `/icons/${item.icon}_line48.png`
                        }
                        alt=""
                        aria-hidden="true"
                        width={40}
                        height={40}
                        className="w-10 h-10 flex-shrink-0"
                      />
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="mdcontainer-card__title text-std-17B-170 text-solid-gray-900 mb-2 budoux">
                        {budouxParse(item.title)}
                      </span>
                      {item.description && (
                        <span className="mdcontainer-card__desc text-std-14N-170 text-solid-gray-600 flex-1 line-clamp-2 budoux">
                          {budouxParse(item.description)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <ArrowRightIcon />
                </div>
              </article>
            </NextLink>
          </li>
        ))}
      </ul>
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
      <ul className="space-y-2 list-none p-0 m-0">
        {completedItems.map((item, i) => (
          <li key={i}>
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="mdcontainer-card-inner block"
            >
              <article className="mdcontainer-card flex items-center border border-solid-gray-200 rounded-lg bg-white hover:bg-solid-gray-50 transition-colors p-4">
                <div className="mdcontainer-card__body flex-1 min-w-0">
                  <span className="mdcontainer-card__title text-std-17B-170 text-solid-gray-900 block budoux">
                    {budouxParse(item.title)}
                  </span>
                  {item.description && (
                    <span className="mdcontainer-card__desc text-std-14N-170 text-solid-gray-600 block mt-1 budoux">
                      {budouxParse(item.description)}
                    </span>
                  )}
                </div>
                <ArrowRightIcon />
              </article>
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
      <ul className="space-y-2 list-none p-0 m-0">
        {completedItems.map((item, i) => (
          <li key={i}>
            <NextLink
              href={prefixInternalLink(item.href, municipalityId)}
              className="mdcontainer-card-inner block"
            >
              <article className="mdcontainer-card flex items-center border border-solid-gray-200 rounded-lg bg-white hover:bg-solid-gray-50 transition-colors p-4">
                <div className="mdcontainer-card__body flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {item.published_at && (
                      <span className="text-std-12N-170 text-solid-gray-500 whitespace-nowrap">
                        {formatDate(item.published_at)}
                      </span>
                    )}
                    {item.category && (
                      <span className="inline-block px-2 py-0.5 text-xs bg-solid-gray-100 text-solid-gray-600 rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <span className="mdcontainer-card__title text-std-17B-170 text-solid-gray-900 block">
                    {item.title}
                  </span>
                </div>
                <ArrowRightIcon />
              </article>
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
