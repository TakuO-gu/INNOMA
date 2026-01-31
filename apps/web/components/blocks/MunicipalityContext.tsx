"use client";

import React, { createContext, useContext } from "react";

interface MunicipalityContextValue {
  municipalityId: string;
  /** 完成済みページのパス一覧（未取得変数がないページ） */
  completedPages: Set<string>;
  /** 指定したパスが完成済みかどうかをチェック */
  isPageCompleted: (path: string) => boolean;
}

const MunicipalityContext = createContext<MunicipalityContextValue | null>(null);

export function MunicipalityProvider({
  children,
  municipalityId,
  completedPages = new Set<string>(),
}: {
  children: React.ReactNode;
  municipalityId: string;
  completedPages?: Set<string>;
}) {
  const isPageCompleted = (path: string): boolean => {
    // 外部リンクは常にOK
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("mailto:") ||
      path.startsWith("tel:") ||
      path.startsWith("#")
    ) {
      return true;
    }

    // ホームページ（/）は常に存在するのでOK
    if (path === "/" || path === "") {
      return true;
    }

    // 内部リンクは完成済みページリストをチェック
    // パスの正規化: 先頭に/がない場合は追加
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return completedPages.has(normalizedPath);
  };

  return (
    <MunicipalityContext.Provider value={{ municipalityId, completedPages, isPageCompleted }}>
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
