import React from "react";
import { DadsLink } from "./DadsLink";

export type DadsResourceItem = {
  title: string;
  href: string;
  description?: string;
  meta?: string;
  external?: boolean;
};

export function DadsResourceList({
  items,
  ariaLabel,
}: {
  items: DadsResourceItem[];
  ariaLabel?: string;
}) {
  // NOTE: “完全準拠”では、DADS HTML版のResourceListスニペットにDOM構造を一致させる
  return (
    <ul className="dads-resource-list" aria-label={ariaLabel}>
      {items.map((it, i) => (
        <li key={i} className="dads-resource-list__item">
          <div className="dads-resource-list__title">
            <DadsLink href={it.href} external={it.external}>
              {it.title}
            </DadsLink>
          </div>

          {it.description ? (
            <div className="dads-resource-list__description">{it.description}</div>
          ) : null}

          {it.meta ? <div className="dads-resource-list__meta">{it.meta}</div> : null}
        </li>
      ))}
    </ul>
  );
}
