/**
 * CardGridBlock - デジタル庁デザインシステム準拠のカードグリッドコンポーネント
 *
 * 参照: デジタル庁ウェブサイトのカードコンポーネント
 * 構造:
 * - mdcontainer-card-inner: カード全体のリンクラッパー
 * - mdcontainer-card__thumb: サムネイル画像エリア
 * - mdcontainer-card__body: コンテンツエリア
 *   - mdcontainer-card__title: タイトル（黒文字）
 *   - mdcontainer-card__desc: 説明文（グレー文字）
 *   - mdcontainer-card__meta: メタ情報
 *   - icon--arrow-rightwards: 右矢印アイコン
 */

"use client";

import React from "react";
import NextLink from "next/link";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import { budouxParse } from "@/components/BudouX";

interface CardItem {
  title: string;
  description?: string;
  href?: string;
  image?: string;
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

// 右矢印アイコン（デジタル庁仕様）
const ArrowRightIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 ml-auto flex-shrink-0">
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

// 外部リンクアイコン
const ExternalLinkIcon = () => (
  <svg
    className="w-3 h-3 ml-1 inline-block"
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
 * デジタル庁仕様: サムネイル + タイトル + 説明 + 矢印
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
    <article className="mdcontainer-card flex flex-col h-full border border-solid-gray-200 rounded-lg overflow-hidden bg-white hover:bg-solid-gray-50 transition-colors">
      {/* サムネイル */}
      {item.image && (
        <div className="mdcontainer-card__thumb aspect-[3/2] bg-solid-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {/* ボディ */}
      <div className="mdcontainer-card__body flex flex-col flex-1 p-4">
        <span className="mdcontainer-card__title text-std-17B-170 text-solid-gray-900 mb-2">
          {item.title}
          {isExternal && <ExternalLinkIcon />}
        </span>
        {item.description && (
          <span className="mdcontainer-card__desc text-std-14N-170 text-solid-gray-600 flex-1 line-clamp-2">
            {item.description}
          </span>
        )}
        {item.meta && (
          <div className="mdcontainer-card__meta text-std-12N-170 text-solid-gray-500 mt-2">
            {item.meta}
          </div>
        )}
        {resolvedHref && <ArrowRightIcon />}
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
          className="mdcontainer-card-inner block h-full"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="mdcontainer-card-inner block h-full">
        {cardContent}
      </NextLink>
    );
  }

  return cardContent;
}

/**
 * リンクカード（タイトル+説明+矢印）
 * デジタル庁仕様: タイトル（黒） + 説明（グレー） + 右矢印
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
    <article className="mdcontainer-card flex flex-col h-full border border-solid-gray-200 rounded-lg bg-white hover:bg-solid-gray-50 transition-colors p-4">
      <div className="mdcontainer-card__body flex flex-col flex-1">
        <span className="mdcontainer-card__title text-std-17B-170 text-solid-gray-900 mb-2">
          {item.title}
          {isExternal && <ExternalLinkIcon />}
        </span>
        {item.description && (
          <span className="mdcontainer-card__desc text-std-14N-170 text-solid-gray-600 flex-1">
            {item.description}
          </span>
        )}
        {item.meta && (
          <div className="mdcontainer-card__meta text-std-12N-170 text-solid-gray-500 mt-2">
            {item.meta}
          </div>
        )}
      </div>
      {resolvedHref && (
        <div className="flex justify-end mt-3">
          <ArrowRightIcon />
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
          className="mdcontainer-card-inner block h-full"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="mdcontainer-card-inner block h-full">
        {cardContent}
      </NextLink>
    );
  }

  return cardContent;
}

/**
 * 情報カード（横並び: タイトル + 説明 + 矢印）
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
    <article className="mdcontainer-card flex items-center h-full border border-solid-gray-200 rounded-lg bg-white hover:bg-solid-gray-50 transition-colors p-4">
      <div className="mdcontainer-card__body flex-1 min-w-0">
        {item.meta && (
          <div className="mdcontainer-card__meta text-std-12N-170 text-solid-gray-500 mb-1">
            {item.meta}
          </div>
        )}
        <span className="mdcontainer-card__title text-std-17B-170 text-solid-gray-900 block">
          {item.title}
          {isExternal && <ExternalLinkIcon />}
        </span>
        {item.description && (
          <span className="mdcontainer-card__desc text-std-14N-170 text-solid-gray-600 block mt-1">
            {item.description}
          </span>
        )}
      </div>
      {resolvedHref && <ArrowRightIcon />}
    </article>
  );

  if (resolvedHref) {
    if (isExternal) {
      return (
        <a
          href={resolvedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mdcontainer-card-inner block h-full"
        >
          {cardContent}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="mdcontainer-card-inner block h-full">
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
        <h2 className="text-std-24B-150 text-solid-gray-900 mb-6 budoux">{budouxParse(heading)}</h2>
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
