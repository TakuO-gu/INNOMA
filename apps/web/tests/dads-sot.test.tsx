import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { DadsBreadcrumbs } from "../components/blocks/dads/DadsBreadcrumbs";
import { DadsResourceList } from "../components/blocks/dads/DadsResourceList";
import { DadsNotificationBanner } from "../components/blocks/dads/DadsNotificationBanner";
import { DadsStepNavigation } from "../components/blocks/dads/DadsStepNavigation";
import { DadsTable } from "../components/blocks/dads/DadsTable";

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

/**
 * SoT HTMLファイルを読み込む
 */
function readSoT(filename: string): string {
  return fs.readFileSync(
    path.join(process.cwd(), "dads_sot", filename),
    "utf-8"
  );
}

describe("DADS SoT compliance", () => {
  it("Breadcrumbs matches SoT", () => {
    const rendered = renderToStaticMarkup(
      <DadsBreadcrumbs
        idBase="test"
        items={[
          { label: "ホーム", href: "/" },
          { label: "サービス", href: "/services" },
        ]}
      />
    );

    const sot = readSoT("breadcrumbs.html");
    expect(normalize(rendered)).toBe(normalize(sot));
  });

  it("ResourceList matches SoT", () => {
    const rendered = renderToStaticMarkup(
      <DadsResourceList
        ariaLabel="list"
        items={[
          {
            title: "A",
            href: "https://example.com/a",
            description: "desc",
            meta: "meta",
          },
        ]}
      />
    );

    const sot = readSoT("resource-list.html");
    expect(normalize(rendered)).toBe(normalize(sot));
  });

  it("NotificationBanner matches SoT", () => {
    const rendered = renderToStaticMarkup(
      <DadsNotificationBanner severity="info" title="お知らせ">
        これはお知らせです。
      </DadsNotificationBanner>
    );

    const sot = readSoT("notification-banner.html");
    expect(normalize(rendered)).toBe(normalize(sot));
  });

  it("StepNavigation matches SoT", () => {
    const rendered = renderToStaticMarkup(
      <DadsStepNavigation
        ariaLabel="手続きのステップ"
        steps={[{ title: "ステップ1" }, { title: "ステップ2" }]}
        renderBody={(idx) => (idx === 0 ? "内容1" : "内容2")}
      />
    );

    const sot = readSoT("step-navigation.html");
    expect(normalize(rendered)).toBe(normalize(sot));
  });

  it("Table matches SoT", () => {
    const rendered = renderToStaticMarkup(
      <DadsTable
        rows={[
          { label: "項目1", value: "値1" },
          { label: "項目2", value: "値2" },
        ]}
      />
    );

    const sot = readSoT("table.html");
    expect(normalize(rendered)).toBe(normalize(sot));
  });
});
