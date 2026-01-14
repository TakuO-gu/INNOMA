"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type SearchBoxProps = {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function SearchBox({
  placeholder = "自治体名や手続きを検索...",
  className = "",
  size = "md",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3",
    lg: "px-5 py-4 text-lg",
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${sizeClasses[size]} pl-10 pr-4 border border-solid-gray-300 rounded-lg bg-white text-solid-gray-900 placeholder:text-solid-gray-420 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black`}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-solid-gray-420"
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
  );
}
