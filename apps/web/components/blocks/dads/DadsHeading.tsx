import React from "react";

export function DadsHeading({
  as,
  children,
  size = "l",
}: {
  as: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  size?: "xl" | "l" | "m";
}) {
  const Tag = as;

  // NOTE: ここは後で DADS公式スニペットの class に完全一致で置換する
  const sizeClass =
    size === "xl" ? "dads-heading--xl" : size === "m" ? "dads-heading--m" : "dads-heading--l";

  return <Tag className={`dads-heading ${sizeClass}`.trim()}>{children}</Tag>;
}
