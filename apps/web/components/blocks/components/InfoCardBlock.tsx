/**
 * InfoCardBlock - DADS準拠の情報カードコンポーネント
 *
 * 避難所タイプなど、アイコン+タイトル+説明+カウントを表示するカード
 * カウントが数値でない場合（フォールバックテキスト）は非表示または代替表示
 */

"use client";

import React, { useEffect, useState } from "react";
import { useMunicipality } from "../MunicipalityContext";

// アイコン定義
const ICONS = {
  shelter: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  emergency: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  welfare: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  info: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
} as const;

type IconType = keyof typeof ICONS;

// バリアント定義
const VARIANTS = {
  default: {
    card: "bg-white border-solid-gray-200",
    icon: "text-blue-600",
  },
  highlight: {
    card: "bg-blue-50 border-blue-200",
    icon: "text-blue-700",
  },
  warning: {
    card: "bg-orange-50 border-orange-200",
    icon: "text-orange-600",
  },
} as const;

type VariantType = keyof typeof VARIANTS;

interface InfoCardItemProps {
  title: string;
  description: string;
  icon?: IconType;
  variant?: VariantType;
  count?: string;
  countLabel?: string;
  href?: string;
}

/**
 * カウント値が有効な数値かどうかを判定
 */
function isValidCount(value: string | undefined): boolean {
  if (!value) return false;
  const cleaned = value.replace(/[,、]/g, "").trim();
  return /^\d+$/.test(cleaned);
}

/**
 * 単一のInfoCard
 */
function InfoCard({
  title,
  description,
  icon = "info",
  variant = "default",
  count,
  countLabel = "か所",
  href,
}: InfoCardItemProps) {
  const styles = VARIANTS[variant];
  const IconComponent = ICONS[icon];
  const countIsValid = isValidCount(count);

  const cardContent = (
    <div className="flex items-start gap-4">
      <div className={`flex-shrink-0 ${styles.icon}`}>{IconComponent}</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-solid-gray-600 mb-2">{description}</p>
        {count && countIsValid && (
          <p className="text-lg font-bold text-blue-1000">
            {count}
            {countLabel}
          </p>
        )}
      </div>
      {href && (
        <svg
          className="w-5 h-5 text-solid-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </div>
  );

  const className = `block p-5 border rounded-lg ${styles.card} ${
    href ? "hover:shadow-md transition-shadow cursor-pointer" : ""
  }`;

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={className}
      >
        {cardContent}
      </a>
    );
  }

  return <div className={className}>{cardContent}</div>;
}

/**
 * InfoCardBlock - 単一カード表示
 */
export function InfoCardBlock({ props }: { props: Record<string, unknown> }) {
  const title = (props.title as string) || "";
  const description = (props.description as string) || "";
  const icon = (props.icon as IconType) || "info";
  const variant = (props.variant as VariantType) || "default";
  const count = props.count as string | undefined;
  const countLabel = (props.countLabel as string) || "か所";
  const href = props.href as string | undefined;

  return (
    <div className="mt-12">
      <InfoCard
        title={title}
        description={description}
        icon={icon}
        variant={variant}
        count={count}
        countLabel={countLabel}
        href={href}
      />
    </div>
  );
}

/**
 * InfoCardGridBlock - 複数カードのグリッド表示
 */
const gridColsClass = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};

// 避難所タイプとアイコン名のマッピング
const SHELTER_TYPE_MAP: Record<string, string> = {
  emergency: "kinkyu",
  shelter: "shitei",
  welfare: "fukushi",
};

interface ShelterData {
  districts: Array<{
    shelters: Array<{
      type: string;
    }>;
  }>;
}

export function InfoCardGridBlock({ props }: { props: Record<string, unknown> }) {
  const cards = (props.cards as InfoCardItemProps[]) || [];
  const columns = (props.columns as 1 | 2 | 3) || 3;
  const { municipalityId } = useMunicipality();

  // shelters.json から避難所数を取得
  const [shelterCounts, setShelterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadShelterCounts() {
      try {
        const response = await fetch(`/api/districts/${municipalityId}/shelters`);
        if (!response.ok) return;

        const data: ShelterData = await response.json();
        const counts: Record<string, number> = {};

        // 全地区の避難所をタイプ別にカウント
        for (const district of data.districts || []) {
          for (const shelter of district.shelters || []) {
            counts[shelter.type] = (counts[shelter.type] || 0) + 1;
          }
        }

        setShelterCounts(counts);
      } catch {
        // エラーは無視（カウントなしで表示）
      }
    }

    if (municipalityId) {
      loadShelterCounts();
    }
  }, [municipalityId]);

  // カードにshelters.jsonからの動的カウントを適用
  const enrichedCards = cards.map((card) => {
    // アイコン名から避難所タイプを特定
    const shelterType = card.icon ? SHELTER_TYPE_MAP[card.icon] : null;

    // shelters.jsonからカウントを取得（変数が無効な場合のみ）
    if (shelterType && shelterCounts[shelterType] !== undefined) {
      const originalCount = card.count;
      const hasValidOriginalCount = isValidCount(originalCount);

      // 元のカウントが無効な場合、shelters.jsonのカウントを使用
      if (!hasValidOriginalCount) {
        return {
          ...card,
          count: String(shelterCounts[shelterType]),
        };
      }
    }

    return card;
  });

  return (
    <div className={`mt-12 grid ${gridColsClass[columns]} gap-4`}>
      {enrichedCards.map((card, index) => (
        <InfoCard key={index} {...card} />
      ))}
    </div>
  );
}

export default InfoCardBlock;
