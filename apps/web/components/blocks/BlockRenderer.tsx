"use client";

import React from "react";
import { MunicipalityProvider } from "./MunicipalityContext";
import type { BaseBlock } from "./types";
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
  StepNavigationBlock,
  DirectoryListBlock,
  NewsMetaBlock,
  // Home Page
  HeroBlock,
  TopicGridBlock,
  TopicListBlock,
  QuickLinksBlock,
  NewsListBlock,
} from "./components";

interface BlockRendererProps {
  blocks: BaseBlock[];
  municipalityId: string;
}

export function BlockRenderer({ blocks, municipalityId }: BlockRendererProps) {
  return (
    <MunicipalityProvider municipalityId={municipalityId}>
      <div className="block-renderer max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {blocks.map((block) => (
          <BlockSwitch key={block.id} block={block} />
        ))}
      </div>
    </MunicipalityProvider>
  );
}

function BlockSwitch({ block }: { block: BaseBlock }) {
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
    default:
      return (
        <div className="block-unknown" data-type={type}>
          <p className="text-sm text-gray-500">未対応ブロック: {type}</p>
        </div>
      );
  }
}

export default BlockRenderer;
