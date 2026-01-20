"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface MunicipalitySearchBoxProps {
  municipalityId: string;
  municipalityName: string;
  defaultValue?: string;
}

export default function MunicipalitySearchBox({
  municipalityId,
  municipalityName,
  defaultValue = "",
}: MunicipalitySearchBoxProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(
          `/${municipalityId}/search?q=${encodeURIComponent(query.trim())}`
        );
      }
    },
    [query, router, municipalityId]
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${municipalityName}内を検索...`}
          className="w-full px-5 py-4 pl-12 text-lg border border-solid-gray-300 rounded-lg bg-white text-solid-gray-900 placeholder:text-solid-gray-420 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black"
          autoFocus
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-solid-gray-420"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-black"
        >
          検索
        </button>
      </div>
    </form>
  );
}
