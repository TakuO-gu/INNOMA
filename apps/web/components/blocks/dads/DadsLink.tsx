"use client";

import React from "react";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";

export function DadsLink({
  href,
  children,
  external,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  const { municipalityId } = useMunicipality();
  const resolvedHref = prefixInternalLink(href, municipalityId);

  return (
    <a
      className={`dads-link ${className}`.trim()}
      href={resolvedHref}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
