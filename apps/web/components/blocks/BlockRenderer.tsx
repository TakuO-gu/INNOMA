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
  // Search Box
  SearchBoxBlock,
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
  // Search Box
  SearchBox: SearchBoxBlock,
};

/* =============================================================================
 * BlockRenderer
 *
 * 各ブロックコンポーネントが自身のスペーシングを持つ設計
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
        {blocks.map((block) => (
          <BlockWrapper
            key={block.id}
            block={block}
            sources={sources}
          />
        ))}
      </div>
    </MunicipalityProvider>
  );
}

/**
 * ブロックをラップ（スペーシングは各コンポーネントが持つ）
 */
function BlockWrapper({
  block,
  sources,
}: {
  block: BaseBlock;
  sources?: Source[];
}) {
  const { type, props, id } = block;
  const Component = blockRegistry[type];

  if (!Component) {
    return (
      <div
        className="block-unknown mt-6"
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
      data-block-type={type}
      data-block-id={id}
    >
      <Component props={props} sources={sources} />
    </div>
  );
}

export default BlockRenderer;
