"use client";

import { useState, useEffect } from "react";

interface Props {
  url: string;
  municipalityId: string;
  service: string;
  highlightText?: string;
}

interface SourceContent {
  url: string;
  title: string;
  content: string;
  contentType: string;
  fetchedAt: string;
  error?: string;
}

export function SourceViewer({ url, municipalityId, service, highlightText }: Props) {
  const [content, setContent] = useState<SourceContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/drafts/${municipalityId}/${service}/source?url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch source");
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch source");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url, municipalityId, service]);

  const highlightContent = (text: string, highlight?: string) => {
    if (!highlight || !text) return text;

    // Escape regex special characters
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2 text-gray-500">ソースを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium">読み込みエラー</div>
        <div className="text-sm text-red-600 mt-1">{error}</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-4 text-gray-500 text-center">
        左側の変数をクリックするとソースが表示されます
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b bg-gray-50">
        <div className="font-medium text-sm text-gray-900 truncate">
          {content.title || "タイトルなし"}
        </div>
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline truncate block"
        >
          {content.url}
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {content.contentType === "pdf" && (
          <div className="mb-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
            PDF（OCR抽出テキスト）
          </div>
        )}
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {highlightContent(content.content, highlightText)}
        </div>
      </div>
    </div>
  );
}
