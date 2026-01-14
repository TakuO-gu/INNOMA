import React from "react";
import { DadsLink } from "./DadsLink";

export function DadsBreadcrumbs({
  idBase,
  items,
}: {
  idBase: string;
  items: { label: string; href: string }[];
}) {
  // DADS仕様：aria-labelledby + visually-hidden、複数配置時のid重複回避が必要
  const labelId = `${idBase}-breadcrumb-label`;

  return (
    <nav className="dads-breadcrumb" aria-labelledby={labelId}>
      <span id={labelId} className="dads-u-visually-hidden">
        現在位置
      </span>
      <ol className="dads-breadcrumb__list">
        {items.map((it, i) => (
          <li key={i} className="dads-breadcrumb__item">
            <DadsLink href={it.href}>{it.label}</DadsLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
