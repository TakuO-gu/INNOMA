"use client";

import React from "react";
import { MunicipalityProvider } from "./MunicipalityContext";
import type { BaseBlock } from "./types";
import type { Source } from "@/lib/artifact/innoma-artifact-schema.v2";
import {
  // Navigation
  BreadcrumbsBlock,
  ResourceListBlock,
  RelatedLinksBlock,
  // Content
  TitleBlock,
  SummaryBlock,
  RichTextBlock,
  RawContentBlock,
  TableBlock,
  AccordionBlock,
  SectionBlock,
  DescriptionListBlock,
  BlockquoteBlock,
  StatusBadgeBlock,
  CardBlock,
  // Notification
  NotificationBannerBlock,
  EmergencyBannerBlock,
  // Interactive
  ContactBlock,
  ActionButtonBlock,
  TaskButtonBlock,
  StepNavigationBlock,
  DirectoryListBlock,
  NewsMetaBlock,
  // Home Page
  HeroBlock,
  TopicGridBlock,
  TopicListBlock,
  QuickLinksBlock,
  NewsListBlock,
  // Sources
  SourcesBlock,
  // District Selector
  DistrictSelectorBlock,
  // Info Cards
  InfoCardBlock,
  InfoCardGridBlock,
  // Shelter List
  ShelterListBlock,
  // Hazard Map Viewer
  HazardMapViewerBlock,
  // Attachments
  AttachmentsBlock,
  // Card Grid
  CardGridBlock,
} from "./components";

/* =============================================================================
 * Block Registry - コンポーネントマッピング
 * ============================================================================= */

type BlockComponent = React.FC<{ props: Record<string, unknown>; sources?: Source[] }>;

const blockRegistry: Record<string, BlockComponent> = {
  // Navigation
  Breadcrumbs: BreadcrumbsBlock,
  ResourceList: ResourceListBlock,
  RelatedLinks: RelatedLinksBlock,
  // Content
  Title: TitleBlock,
  Summary: SummaryBlock,
  RichText: RichTextBlock,
  RawContent: RawContentBlock,
  Table: TableBlock,
  Accordion: AccordionBlock,
  Section: SectionBlock,
  DescriptionList: DescriptionListBlock,
  Blockquote: BlockquoteBlock,
  StatusBadge: StatusBadgeBlock,
  Card: CardBlock,
  // Notification
  NotificationBanner: NotificationBannerBlock,
  EmergencyBanner: EmergencyBannerBlock,
  // Interactive
  Contact: ContactBlock,
  ContactCard: ContactBlock, // ContactCardはContactにマップ
  ActionButton: ActionButtonBlock,
  TaskButton: TaskButtonBlock,
  StepNavigation: StepNavigationBlock,
  DirectoryList: DirectoryListBlock,
  NewsMeta: NewsMetaBlock,
  // Home Page
  Hero: HeroBlock,
  TopicGrid: TopicGridBlock,
  TopicList: TopicListBlock,
  QuickLinks: QuickLinksBlock,
  NewsList: NewsListBlock,
  // Sources
  Sources: SourcesBlock,
  // District Selector
  DistrictSelector: DistrictSelectorBlock,
  // Info Cards
  InfoCard: InfoCardBlock,
  InfoCardGrid: InfoCardGridBlock,
  // Shelter List
  ShelterList: ShelterListBlock,
  // Hazard Map Viewer
  HazardMapViewer: HazardMapViewerBlock,
  // Attachments
  Attachments: AttachmentsBlock,
  // Card Grid
  CardGrid: CardGridBlock,
};

/* =============================================================================
 * Spacing Rules - ブロックタイプごとのスペーシング定義
 *
 * margin-top のみで制御（margin-bottom は使わない）
 * 最初のブロックは mt-0
 * ============================================================================= */

type SpacingSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl";

const spacingClasses: Record<SpacingSize, string> = {
  none: "mt-0",
  sm: "mt-4",    // 16px
  md: "mt-6",    // 24px
  lg: "mt-12",   // 48px
  xl: "mt-16",   // 64px
  "2xl": "mt-24", // 96px
};

/**
 * ブロックタイプごとの上部スペーシング
 */
const blockSpacing: Record<string, SpacingSize> = {
  // ヘッダー系 - スペースなし
  Breadcrumbs: "none",
  Title: "md",
  Summary: "md",

  // セクション - 大きなスペース
  Section: "2xl",

  // コンテンツ系 - 中程度
  RichText: "lg",
  RawContent: "lg",
  Table: "lg",
  Accordion: "lg",
  StepNavigation: "lg",
  DescriptionList: "lg",
  Blockquote: "lg",
  Card: "lg",

  // ステータス系 - 小さめ
  StatusBadge: "sm",

  // 通知系 - 中程度
  NotificationBanner: "md",
  EmergencyBanner: "md",

  // ナビゲーション・リンク系
  ResourceList: "lg",
  RelatedLinks: "lg",

  // インタラクティブ
  Contact: "xl",
  ContactCard: "xl",
  ActionButton: "lg",
  TaskButton: "lg",
  DirectoryList: "lg",
  NewsMeta: "md",

  // ホームページ系
  Hero: "none",
  TopicGrid: "lg",
  TopicList: "lg",
  QuickLinks: "lg",
  NewsList: "lg",

  // その他
  Sources: "xl",
  DistrictSelector: "lg",
  InfoCard: "lg",
  InfoCardGrid: "lg",
  ShelterList: "lg",
  HazardMapViewer: "lg",
  Attachments: "lg",
  CardGrid: "lg",
};

/**
 * スペーシングクラスを取得
 */
function getSpacingClass(blockType: string, isFirst: boolean): string {
  if (isFirst) return spacingClasses.none;
  const size = blockSpacing[blockType] || "md";
  return spacingClasses[size];
}

/* =============================================================================
 * BlockRenderer
 * ============================================================================= */

interface BlockRendererProps {
  blocks: BaseBlock[];
  municipalityId: string;
  sources?: Source[];
  /** 完成済みページのパス一覧（未取得変数がないページ） */
  completedPages?: string[];
}

export function BlockRenderer({ blocks, municipalityId, sources, completedPages = [] }: BlockRendererProps) {
  const completedPagesSet = new Set(completedPages);

  return (
    <MunicipalityProvider municipalityId={municipalityId} completedPages={completedPagesSet}>
      <div className="dads-page">
        {blocks.map((block, index) => (
          <BlockWrapper
            key={block.id}
            block={block}
            sources={sources}
            isFirst={index === 0}
          />
        ))}
      </div>
    </MunicipalityProvider>
  );
}

/**
 * ブロックをラップしてスペーシングを適用
 */
function BlockWrapper({
  block,
  sources,
  isFirst
}: {
  block: BaseBlock;
  sources?: Source[];
  isFirst: boolean;
}) {
  const { type, props, id } = block;
  const Component = blockRegistry[type];
  const spacingClass = getSpacingClass(type, isFirst);

  if (!Component) {
    return (
      <div
        className={`block-unknown ${spacingClass}`}
        data-type={type}
        data-block-type={type}
        data-block-id={id}
      >
        <p className="text-sm text-gray-500">未対応ブロック: {type}</p>
      </div>
    );
  }

  return (
    <div
      className={spacingClass}
      data-block-type={type}
      data-block-id={id}
    >
      <Component props={props} sources={sources} />
    </div>
  );
}

export default BlockRenderer;
