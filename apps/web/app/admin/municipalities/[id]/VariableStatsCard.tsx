"use client";

import { useState } from "react";
import Link from "next/link";
import { serviceDefinitions } from "@/lib/llm/variable-priority";
import type { VariableStore } from "@/lib/template";

interface VariableStatsCardProps {
  variables: VariableStore;
  pageCount: number;
  pendingDrafts: number;
  onCategorySelect?: (categoryId: string | null) => void;
}

interface CategoryStat {
  id: string;
  nameJa: string;
  filled: number;
  total: number;
  percentage: number;
}

export function VariableStatsCard({
  variables,
  pageCount,
  pendingDrafts,
  onCategorySelect,
}: VariableStatsCardProps) {
  const [expandedCategories, setExpandedCategories] = useState(false);

  // カテゴリ別統計を計算
  const categoryStats: CategoryStat[] = serviceDefinitions.map((service) => {
    const filled = service.variables.filter(
      (varName) => variables[varName]?.value && variables[varName].value.trim() !== ""
    ).length;
    const total = service.variables.length;
    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

    return {
      id: service.id,
      nameJa: service.nameJa,
      filled,
      total,
      percentage,
    };
  });

  // 全体統計
  const totalFilled = categoryStats.reduce((sum, s) => sum + s.filled, 0);
  const totalCount = categoryStats.reduce((sum, s) => sum + s.total, 0);
  const totalPercentage = totalCount > 0 ? Math.round((totalFilled / totalCount) * 100) : 0;

  // カテゴリの進捗バーの色を取得
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage > 0) return "bg-orange-500";
    return "bg-gray-300";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h2>

      {/* 基本統計 */}
      <dl className="space-y-3 mb-4">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">ページ数</dt>
          <dd className="text-sm font-semibold text-gray-900">{pageCount}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-sm text-gray-500">未承認の下書き</dt>
          <dd className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            {pendingDrafts}件
            {pendingDrafts > 0 && (
              <Link
                href="/admin/drafts"
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                確認する →
              </Link>
            )}
          </dd>
        </div>
      </dl>

      {/* 変数設定率（全体） */}
      <div className="p-3 bg-gray-50 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">変数設定率</span>
          <span className="text-sm font-semibold text-gray-900">
            {totalFilled}/{totalCount} ({totalPercentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${totalPercentage}%` }}
          />
        </div>
      </div>

      {/* カテゴリ別設定状況 */}
      <div className="border-t pt-4">
        <button
          onClick={() => setExpandedCategories(!expandedCategories)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <span>カテゴリ別設定状況</span>
          <span className="text-gray-400">{expandedCategories ? "▲" : "▼"}</span>
        </button>

        {expandedCategories && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {/* 全カテゴリ選択ボタン */}
            {onCategorySelect && (
              <button
                onClick={() => onCategorySelect(null)}
                className="w-full text-left px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
              >
                全てのカテゴリを表示
              </button>
            )}

            {categoryStats.map((category) => (
              <div
                key={category.id}
                className={`border-b border-gray-100 pb-2 last:border-0 ${
                  onCategorySelect ? "cursor-pointer hover:bg-gray-50 rounded px-2 py-1" : ""
                }`}
                onClick={() => onCategorySelect?.(category.id)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">{category.nameJa}</span>
                  <span className="text-xs text-gray-500">
                    {category.filled}/{category.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getProgressColor(category.percentage)}`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
