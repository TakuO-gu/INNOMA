"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";

interface MunicipalityHeaderProps {
  municipalityId: string;
  municipalityName: string;
}

export default function MunicipalityHeader({
  municipalityId,
  municipalityName,
}: MunicipalityHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/${municipalityId}/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
        setMobileMenuOpen(false);
      }
    },
    [searchQuery, router, municipalityId]
  );

  return (
    <header className="bg-white border-b border-solid-gray-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Municipality Name */}
          <div className="flex items-center gap-3 shrink-0">
            <NextLink
              href="/"
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              title="INNOMA トップページ"
            >
              INNOMA
            </NextLink>
            <span className="text-solid-gray-400" aria-hidden="true">
              |
            </span>
            <NextLink
              href={`/${municipalityId}`}
              className="text-lg font-semibold text-solid-gray-900 hover:text-solid-gray-700 transition-colors"
            >
              {municipalityName}
            </NextLink>
          </div>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${municipalityName}内を検索...`}
                className="w-full px-4 py-2 pl-10 border border-solid-gray-300 rounded-lg text-sm bg-white text-solid-gray-900 placeholder:text-solid-gray-420 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-solid-gray-420"
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
            </div>
          </form>

          {/* Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-4">
            <NextLink
              href={`/${municipalityId}`}
              className={`text-sm transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:bg-yellow-300 focus-visible:rounded px-2 py-1 ${
                pathname === `/${municipalityId}`
                  ? "font-bold text-solid-gray-900"
                  : "text-solid-gray-600 hover:text-solid-gray-900"
              }`}
            >
              トップ
            </NextLink>
            <NextLink
              href="/municipalities"
              className="text-sm text-solid-gray-600 hover:text-solid-gray-900 transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:bg-yellow-300 focus-visible:rounded px-2 py-1"
            >
              他の自治体
            </NextLink>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-solid-gray-600 hover:text-solid-gray-900 focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:bg-yellow-300 focus-visible:rounded"
            aria-label="メニュー"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-solid-gray-200 pt-4">
            {/* Search - Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${municipalityName}内を検索...`}
                  className="w-full px-4 py-2 pl-10 border border-solid-gray-300 rounded-lg text-sm bg-white text-solid-gray-900 placeholder:text-solid-gray-420 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-solid-gray-420"
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
              </div>
            </form>

            {/* Nav Links - Mobile */}
            <nav className="flex flex-col gap-3">
              <NextLink
                href={`/${municipalityId}`}
                className={`py-2 transition-colors ${
                  pathname === `/${municipalityId}`
                    ? "font-bold text-solid-gray-900"
                    : "text-solid-gray-600 hover:text-solid-gray-900"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {municipalityName}トップ
              </NextLink>
              <NextLink
                href="/municipalities"
                className="py-2 text-solid-gray-600 hover:text-solid-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                他の自治体を見る
              </NextLink>
              <NextLink
                href="/"
                className="py-2 text-solid-gray-600 hover:text-solid-gray-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                INNOMAトップへ
              </NextLink>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
