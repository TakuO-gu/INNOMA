"use client";

import React, { createContext, useContext } from "react";

interface MunicipalityContextValue {
  municipalityId: string;
}

const MunicipalityContext = createContext<MunicipalityContextValue | null>(null);

export function MunicipalityProvider({
  children,
  municipalityId,
}: {
  children: React.ReactNode;
  municipalityId: string;
}) {
  return (
    <MunicipalityContext.Provider value={{ municipalityId }}>
      {children}
    </MunicipalityContext.Provider>
  );
}

export function useMunicipality(): MunicipalityContextValue {
  const context = useContext(MunicipalityContext);
  if (!context) {
    throw new Error("useMunicipality must be used within a MunicipalityProvider");
  }
  return context;
}

/**
 * 内部リンクにmunicipalityプレフィックスを追加する
 * 外部リンク（http://, https://, mailto:, tel:）はそのまま返す
 */
export function prefixInternalLink(href: string, municipalityId: string): string {
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href;
  }

  if (href.startsWith(`/${municipalityId}/`) || href === `/${municipalityId}`) {
    return href;
  }

  if (href.startsWith("/")) {
    return `/${municipalityId}${href}`;
  }

  return href;
}
