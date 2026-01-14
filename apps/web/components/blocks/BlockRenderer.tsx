import React from "react";
import type { InnomaArtifact } from "@/lib/artifact/types";

import {
  DadsBreadcrumbs,
  DadsEmergencyBanner,
  DadsHeading,
  DadsNotificationBanner,
  DadsResourceList,
  DadsStepNavigation,
  DadsTable,
} from "./dads";

import RichTextRenderer from "./richtext/RichTextRenderer";

export default function BlockRenderer({ blocks }: { blocks: InnomaArtifact["blocks"] }) {
  return (
    <div className="dads-page">
      {blocks.map((block) => {
        switch (block.type) {
          case "Breadcrumbs":
            return <DadsBreadcrumbs key={block.id} idBase={block.id} items={block.props.items} />;

          case "Title":
            return (
              <header key={block.id}>
                <DadsHeading as="h1" size="xl">
                  {block.props.title}
                </DadsHeading>
              </header>
            );

          case "Callout":
            return (
              <section key={block.id}>
                <DadsNotificationBanner severity={block.props.severity} title={block.props.title}>
                  <RichTextRenderer content={block.props.content} />
                </DadsNotificationBanner>
              </section>
            );

          case "RichText":
            return (
              <section key={block.id}>
                <RichTextRenderer content={block.props.content} />
              </section>
            );

          case "InfoTable":
            return (
              <section key={block.id}>
                <DadsTable
                  rows={block.props.rows.map((r) => ({
                    label: r.label,
                    value: <RichTextRenderer content={r.value} />,
                  }))}
                />
              </section>
            );

          case "RelatedLinks":
            return (
              <section key={block.id}>
                <DadsHeading as="h2" size="l">
                  関連リンク
                </DadsHeading>
                <DadsResourceList items={block.props.items.map((it) => ({ title: it.title, href: it.href }))} />
              </section>
            );

          case "Attachments":
            return (
              <section key={block.id}>
                <DadsHeading as="h2" size="l">
                  添付資料
                </DadsHeading>
                <DadsResourceList
                  items={block.props.items.map((it) => ({
                    title: it.title,
                    href: it.href,
                    meta: it.content_type,
                  }))}
                />
              </section>
            );

          case "ProcedureSteps":
            return (
              <section key={block.id}>
                <DadsHeading as="h2" size="l">
                  手続きの流れ
                </DadsHeading>

                <DadsStepNavigation
                  steps={block.props.steps.map((s) => ({ title: s.title }))}
                  renderBody={(idx) => {
                    const step = block.props.steps[idx];
                    return (
                      <div>
                        <RichTextRenderer content={step.content} />
                        {step.checklist?.length ? (
                          <ul className="dads-list">
                            {step.checklist.map((c, i) => (
                              <li key={i} className="dads-list__item">
                                {c}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  }}
                />
              </section>
            );

          case "Emergency":
            return (
              <section key={block.id}>
                <DadsEmergencyBanner emergency={block.props} />
              </section>
            );

          default:
            // “完全準拠”運用ならここは throw して CI で落とすのが正解
            return null;
        }
      })}
    </div>
  );
}
