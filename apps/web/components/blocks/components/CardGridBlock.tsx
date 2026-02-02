/**
 * CardGridBlock - DADS準拠のカードグリッドコンポーネント
 *
 * DADSカードコンポーネント（https://design.digital.go.jp/dads/components/card/）に準拠
 * HTML実装参照: https://github.com/digital-go-jp/design-system-example-components-html/tree/main/src/components/card
 *
 * 用途:
 * - データの比較・分析ではなく、一覧やグリッド形式でコンテンツを提示
 * - 記事、商品、画像ギャラリーなどを並べて表示し、視覚的な比較・選択を容易に
 *
 * バリエーション:
 * - media: 画像+テキストのグループ化
 * - link: タイトル+説明+リンク（シンプル）
 * - info: アイコン+タイトル+説明
 */

"use client";

import React from "react";
import NextLink from "next/link";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";

interface CardItem {
  title: string;
  description?: string;
  href?: string;
  image?: string;
  icon?: string;
  meta?: string;
  external?: boolean;
}

interface CardGridBlockProps {
  props: {
    heading?: string;
    variant?: "media" | "link" | "info";
    columns?: 2 | 3 | 4;
    items?: CardItem[];
  };
}

// グリッドのカラム数に応じたクラス
const gridColsClass = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

// デフォルトアイコン
const DefaultIcon = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// 外部リンクアイコン
const ExternalLinkIcon = () => (
  <svg
    className="w-4 h-4 ml-1 inline-block"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

/**
 * メディアカード（画像+テキスト）
 * DADS example-1, example-2 参照
 */
function MediaCard({
  item,
  municipalityId,
}: {
  item: CardItem;
  municipalityId: string;
}) {
  const isExternal = item.external || item.href?.startsWith("http");
  const resolvedHref = item.href
    ? isExternal
      ? item.href
      : prefixInternalLink(item.href, municipalityId)
    : undefined;

  const cardContent = (
    <article className="dads-card-media flex flex-col h-full border border-solid-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* 画像エリア */}
      {item.image && (
        <div className="dads-card-media__image aspect-[3/2] bg-solid-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {/* コンテンツエリア */}
      <div className="dads-card-media__main flex-1 p-4">
        {item.meta && (
          <p className="text-std-12N-170 text-solid-gray-500 mb-2">
            {item.meta}
          </p>
        )}
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-2 group-hover:underline">
          {item.title}
          {isExternal && <ExternalLinkIcon />}
        </h3>
        {item.description && (
          <p className="text-std-14N-170 text-solid-gray-600 line-clamp-3">
            {item.description}
          </p>
        )}
      </div>
    </article>
  );

  if (resolvedHref) {
    if (isExternal) {
      return (
        <a
          href={resolvedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="block group">
        {cardContent}
      </NextLink>
    );
  }

  return cardContent;
}

/**
 * リンクカード（タイトル+説明+リンク）
 * シンプルなリンクリスト用
 */
function LinkCard({
  item,
  municipalityId,
}: {
  item: CardItem;
  municipalityId: string;
}) {
  const isExternal = item.external || item.href?.startsWith("http");
  const resolvedHref = item.href
    ? isExternal
      ? item.href
      : prefixInternalLink(item.href, municipalityId)
    : undefined;

  const cardContent = (
    <article className="dads-card-link flex flex-col h-full border border-solid-gray-200 rounded-lg bg-white hover:shadow-md hover:border-blue-400 transition-all p-4">
      {item.meta && (
        <p className="text-std-12N-170 text-solid-gray-500 mb-2">{item.meta}</p>
      )}
      <h3 className="text-std-17B-170 text-blue-900 mb-2 group-hover:underline">
        {item.title}
        {isExternal && <ExternalLinkIcon />}
      </h3>
      {item.description && (
        <p className="text-std-14N-170 text-solid-gray-600 flex-1">
          {item.description}
        </p>
      )}
      {resolvedHref && (
        <div className="mt-3 pt-3 border-t border-solid-gray-200">
          <span className="text-std-14B-170 text-blue-900 group-hover:underline">
            詳しくみる →
          </span>
        </div>
      )}
    </article>
  );

  if (resolvedHref) {
    if (isExternal) {
      return (
        <a
          href={resolvedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="block group">
        {cardContent}
      </NextLink>
    );
  }

  return cardContent;
}

/**
 * 情報カード（アイコン+タイトル+説明）
 * DADS example-1（アイコンバージョン）参照
 */
function InfoCard({
  item,
  municipalityId,
}: {
  item: CardItem;
  municipalityId: string;
}) {
  const isExternal = item.external || item.href?.startsWith("http");
  const resolvedHref = item.href
    ? isExternal
      ? item.href
      : prefixInternalLink(item.href, municipalityId)
    : undefined;

  const cardContent = (
    <article className="dads-card-info flex h-full border border-solid-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow p-4">
      {/* アイコンエリア */}
      <div className="dads-card-info__icon flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 mr-4">
        <DefaultIcon />
      </div>
      {/* コンテンツエリア */}
      <div className="dads-card-info__main flex-1 min-w-0">
        {item.meta && (
          <p className="text-std-12N-170 text-solid-gray-500 mb-1">
            {item.meta}
          </p>
        )}
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-1 group-hover:underline">
          {item.title}
          {isExternal && <ExternalLinkIcon />}
        </h3>
        {item.description && (
          <p className="text-std-14N-170 text-solid-gray-600">
            {item.description}
          </p>
        )}
      </div>
      {/* 矢印アイコン */}
      {resolvedHref && (
        <div className="flex-shrink-0 ml-2 text-solid-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </article>
  );

  if (resolvedHref) {
    if (isExternal) {
      return (
        <a
          href={resolvedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="block group">
        {cardContent}
      </NextLink>
    );
  }

  return cardContent;
}

/**
 * CardGridBlock - カードのグリッド配置
 */
export function CardGridBlock({ props }: CardGridBlockProps) {
  const { municipalityId } = useMunicipality();
  const heading = props.heading;
  const variant = props.variant || "link";
  const columns = props.columns || 3;
  const items = props.items || [];

  if (items.length === 0) {
    return null;
  }

  const CardComponent = {
    media: MediaCard,
    link: LinkCard,
    info: InfoCard,
  }[variant];

  return (
    <div className="card-grid-block mt-12 mb-8">
      {heading && (
        <h2 className="text-std-24B-150 text-solid-gray-900 mb-6">{heading}</h2>
      )}
      <ul className={`grid ${gridColsClass[columns]} gap-4 list-none p-0 m-0`}>
        {items.map((item, index) => (
          <li key={index}>
            <CardComponent item={item} municipalityId={municipalityId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CardGridBlock;
