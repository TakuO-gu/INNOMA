"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  municipalityId: string;
  placeholder?: string;
  /** コンパクト表示（ヘッダー用） */
  compact?: boolean;
}

/**
 * DADS準拠の検索ボックスコンポーネント
 * @see https://design.digital.go.jp/components/search-box/
 */
export function SearchBox({
  municipalityId,
  placeholder = "キーワードで検索",
  compact = false,
}: SearchBoxProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(
          `/${municipalityId}/search?q=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchQuery("");
      }
    },
    [searchQuery, router, municipalityId]
  );

  return (
    <form onSubmit={handleSubmit} className="dads-search-box">
      <div className="dads-search-box__fields">
        <label className="dads-search-box__input">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="m21 20.5-6-6a7.4 7.4 0 0 0 1.9-5A7.4 7.4 0 0 0 9.5 2 7.5 7.5 0 1 0 14 15.5l6 6 1-1ZM3.5 9.5a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6Z"
              fill="currentColor"
            />
          </svg>
          <span className="dads-u-visually-hidden">検索</span>
          <input
            type="search"
            name="q"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className={compact ? "compact" : ""}
          />
        </label>
      </div>
      <button
        className="dads-button"
        type="submit"
        data-type="solid-fill"
        data-size={compact ? "md" : "lg"}
      >
        検索
      </button>
    </form>
  );
}
