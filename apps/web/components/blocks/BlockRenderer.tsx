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
} from "./components";

interface BlockRendererProps {
  blocks: BaseBlock[];
  municipalityId: string;
  sources?: Source[];
  /** 完成済みページのパス一覧（未取得変数がないページ） */
  completedPages?: string[];
}

export function BlockRenderer({ blocks, municipalityId, sources, completedPages = [] }: BlockRendererProps) {
  // completedPagesをSetに変換（propsはシリアライズ可能な配列で受け取る）
  const completedPagesSet = new Set(completedPages);

  return (
    <MunicipalityProvider municipalityId={municipalityId} completedPages={completedPagesSet}>
      <div className="dads-page">
        {blocks.map((block) => (
          <BlockSwitch key={block.id} block={block} sources={sources} />
        ))}
      </div>
    </MunicipalityProvider>
  );
}

function BlockSwitch({ block, sources }: { block: BaseBlock; sources?: Source[] }) {
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
    case "TaskButton":
      return <TaskButtonBlock props={props} />;
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
    case "Sources":
      return <SourcesBlock props={props} sources={sources} />;
    case "DistrictSelector":
      return <DistrictSelectorBlock props={props} />;
    default:
      return (
        <div className="block-unknown" data-type={type}>
          <p className="text-sm text-gray-500">未対応ブロック: {type}</p>
        </div>
      );
  }
}

export default BlockRenderer;
