import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

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
  NotificationBanner,
  NotificationBannerBody,
  StepNavigation,
  StepNavigationStep,
  StepNavigationHeader,
  StepNavigationNumber,
  StepNavigationTitle,
  StepNavigationDescription,
} from "../components/dads";

/**
 * HTML文字列を正規化（空白の差異を無視して比較可能にする）
 */
function normalize(html: string): string {
  return html
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/\s+>/g, ">")
    .replace(/<\s+/g, "<")
    .trim();
}

describe("DADS components render without errors", () => {
  it("Breadcrumbs renders correctly", () => {
    const rendered = renderToStaticMarkup(
      <Breadcrumbs aria-label="パンくずリスト">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrent>
            <span>サービス</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumbs>
    );

    expect(rendered).toContain("nav");
    expect(rendered).toContain("ホーム");
    expect(rendered).toContain("サービス");
  });

  it("ResourceList renders correctly", () => {
    const rendered = renderToStaticMarkup(
      <ResourceList aria-label="リソース一覧">
        <ResourceListItem>
          <ResourceListLink href="https://example.com">
            <ResourceListTitle>タイトル</ResourceListTitle>
            <ResourceListDescription>説明文</ResourceListDescription>
            <ResourceListMeta>メタ情報</ResourceListMeta>
          </ResourceListLink>
        </ResourceListItem>
      </ResourceList>
    );

    expect(rendered).toContain("タイトル");
    expect(rendered).toContain("説明文");
    expect(rendered).toContain("メタ情報");
  });

  it("NotificationBanner renders correctly", () => {
    const rendered = renderToStaticMarkup(
      <NotificationBanner bannerStyle="standard" type="info1" title="お知らせ">
        <NotificationBannerBody>
          これはお知らせです。
        </NotificationBannerBody>
      </NotificationBanner>
    );

    expect(rendered).toContain("お知らせ");
    expect(rendered).toContain("これはお知らせです");
    expect(rendered).toContain('data-type="info1"');
  });

  it("StepNavigation renders correctly", () => {
    const rendered = renderToStaticMarkup(
      <StepNavigation orientation="vertical" size="normal" aria-label="手続きの流れ">
        <StepNavigationStep state="reached" isFirst isCurrent>
          <StepNavigationHeader>
            <StepNavigationNumber number={1} />
            <StepNavigationTitle>ステップ1</StepNavigationTitle>
          </StepNavigationHeader>
          <StepNavigationDescription>
            説明文1
          </StepNavigationDescription>
        </StepNavigationStep>
        <StepNavigationStep state="default" isLast>
          <StepNavigationHeader>
            <StepNavigationNumber number={2} />
            <StepNavigationTitle>ステップ2</StepNavigationTitle>
          </StepNavigationHeader>
          <StepNavigationDescription>
            説明文2
          </StepNavigationDescription>
        </StepNavigationStep>
      </StepNavigation>
    );

    // コンテンツの確認
    expect(rendered).toContain("ステップ1");
    expect(rendered).toContain("ステップ2");
    expect(rendered).toContain("説明文1");
    expect(rendered).toContain("説明文2");
    // ステップ状態の確認
    expect(rendered).toContain('data-state="reached"');
    expect(rendered).toContain('data-state="default"');
    // 現在のステップの確認
    expect(rendered).toContain('aria-current="step"');
    // 構造の確認
    expect(rendered).toContain("<nav");
    expect(rendered).toContain("<ul");
    expect(rendered).toContain("<li");
  });
});
