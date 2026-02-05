"use client";

/**
 * Content-Item 公開設定管理ページ
 *
 * 全自治体横断で content-item の公開/非公開を一括管理
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { PageInfo, VisibilityApiResponse } from "@/lib/visibility";

type ExtendedResponse = VisibilityApiResponse & {
  categories: string[];
  stats: { total: number; visible: number; hidden: number };
};

export default function VisibilityPage() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, visible: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フィルター
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 選択状態
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  // データ取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/visibility");
      if (!res.ok) {
        throw new Error("Failed to fetch visibility data");
      }
      const data = (await res.json()) as ExtendedResponse;
      setPages(data.pages);
      setCategories(data.categories);
      setStats(data.stats);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // フィルタリング
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      // トピックページは除外（content-item のみ表示）
      if (page.type === "topic") return false;

      // カテゴリフィルター
      if (categoryFilter !== "all" && !page.categories.includes(categoryFilter)) {
        return false;
      }

      // ステータスフィルター
      if (statusFilter === "visible" && !page.visible) return false;
      if (statusFilter === "hidden" && page.visible) return false;

      // 検索クエリ
      if (searchQuery && !page.slug.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [pages, categoryFilter, statusFilter, searchQuery]);

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedPages.size === filteredPages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(filteredPages.map((p) => p.slug)));
    }
  };

  // 個別選択
  const toggleSelect = (slug: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedPages(newSelected);
  };

  // 個別公開設定更新
  const updatePageVisibility = async (slug: string, visible: boolean) => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: { [slug]: { visible } } }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      await fetchData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 選択ページの一括更新
  const updateSelectedVisibility = async (visible: boolean) => {
    if (selectedPages.size === 0) return;

    try {
      setSaving(true);
      const pagesUpdate: Record<string, { visible: boolean }> = {};
      selectedPages.forEach((slug) => {
        pagesUpdate[slug] = { visible };
      });

      const res = await fetch("/api/admin/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: pagesUpdate }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      setSelectedPages(new Set());
      await fetchData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // カテゴリ一括更新
  const updateCategoryVisibility = async (category: string, visible: boolean) => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/visibility/category", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, visible }),
      });
      if (!res.ok) throw new Error("Failed to update category visibility");
      await fetchData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Content-Item 公開設定</h1>
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Content-Item 公開設定</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">総数</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">公開</div>
          <div className="text-2xl font-bold text-green-600">{stats.visible}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm text-gray-500">非公開</div>
          <div className="text-2xl font-bold text-red-600">{stats.hidden}</div>
        </div>
      </div>

      {/* カテゴリ別クイック操作 */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">カテゴリ別一括操作</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded border">
              <span className="text-sm font-medium">{category}</span>
              <button
                onClick={() => updateCategoryVisibility(category, true)}
                disabled={saving}
                className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
              >
                全公開
              </button>
              <button
                onClick={() => updateCategoryVisibility(category, false)}
                disabled={saving}
                className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
              >
                全非公開
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm text-gray-600 mr-2">カテゴリ:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">全て</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mr-2">状態:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">全て</option>
            <option value="visible">公開</option>
            <option value="hidden">非公開</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mr-2">検索:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ページ名で検索..."
            className="border rounded px-2 py-1 text-sm w-48"
          />
        </div>
      </div>

      {/* 一括操作 */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selectedPages.size === filteredPages.length && filteredPages.length > 0}
            onChange={toggleSelectAll}
            className="rounded"
          />
          全選択 ({selectedPages.size}/{filteredPages.length})
        </label>
        <button
          onClick={() => updateSelectedVisibility(true)}
          disabled={saving || selectedPages.size === 0}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          選択を公開
        </button>
        <button
          onClick={() => updateSelectedVisibility(false)}
          disabled={saving || selectedPages.size === 0}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          選択を非公開
        </button>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                選択
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ページ名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                カテゴリ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                状態
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPages.map((page) => (
              <tr key={page.slug} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedPages.has(page.slug)}
                    onChange={() => toggleSelect(page.slug)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <code className="text-sm bg-gray-100 px-1.5 py-0.5 rounded">
                    {page.slug}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {page.categories.join(", ")}
                </td>
                <td className="px-4 py-3">
                  {page.visible ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                      公開
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                      非公開
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updatePageVisibility(page.slug, !page.visible)}
                    disabled={saving}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    {page.visible ? "非公開にする" : "公開する"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPages.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            該当するページがありません
          </div>
        )}
      </div>
    </div>
  );
}
