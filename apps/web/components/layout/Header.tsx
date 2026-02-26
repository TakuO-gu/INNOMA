"use client";

import NextLink from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Link } from "@/components/dads";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
      }
    },
    [searchQuery, router]
  );

  return (
    <header className="bg-white border-b border-solid-gray-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <NextLink
            href="/"
            className="shrink-0 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/images/logo.svg"
              alt="INNOMA"
              width={100}
              height={28}
              className="w-auto"
              style={{ height: "24px" }}
              priority
            />
          </NextLink>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="自治体名や手続きを検索..."
                className="w-full px-4 py-2 pl-10 border border-solid-gray-300 rounded-lg text-sm bg-white text-solid-gray-900 placeholder:text-solid-gray-420 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-solid-gray-420"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <nav className="hidden md:flex items-center gap-6">
            <Link asChild className={isActive("/municipalities") ? "font-bold" : ""}>
              <NextLink href="/municipalities">自治体一覧</NextLink>
            </Link>
            <Link asChild className={isActive("/search") ? "font-bold" : ""}>
              <NextLink href="/search">検索</NextLink>
            </Link>
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
                  placeholder="検索..."
                  className="w-full px-4 py-2 pl-10 border border-solid-gray-300 rounded-lg text-sm bg-white text-solid-gray-900 placeholder:text-solid-gray-420 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-solid-gray-420"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
              <Link asChild className={isActive("/municipalities") ? "font-bold" : ""}>
                <NextLink href="/municipalities" onClick={() => setMobileMenuOpen(false)}>
                  自治体一覧
                </NextLink>
              </Link>
              <Link asChild className={isActive("/search") ? "font-bold" : ""}>
                <NextLink href="/search" onClick={() => setMobileMenuOpen(false)}>
                  検索
                </NextLink>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
