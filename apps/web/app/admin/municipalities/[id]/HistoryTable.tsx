"use client";

import { useEffect, useState } from "react";

interface HistorySummary {
  id: string;
  type: "create" | "update" | "delete" | "approve" | "reject";
  source: "manual" | "llm" | "cron" | "import";
  changeCount: number;
  changedBy: string;
  changedAt: string;
  comment?: string;
}

interface HistoryStats {
  totalChanges: number;
  manualChanges: number;
  llmChanges: number;
  lastChangedAt?: string;
}

interface Props {
  municipalityId: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  create: { label: "作成", color: "bg-green-100 text-green-800" },
  update: { label: "更新", color: "bg-blue-100 text-blue-800" },
  delete: { label: "削除", color: "bg-red-100 text-red-800" },
  approve: { label: "承認", color: "bg-purple-100 text-purple-800" },
  reject: { label: "却下", color: "bg-gray-100 text-gray-800" },
};

const sourceLabels: Record<string, string> = {
  manual: "手動",
  llm: "LLM",
  cron: "定期更新",
  import: "インポート",
};

export default function HistoryTable({ municipalityId }: Props) {
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(
          `/api/admin/municipalities/${municipalityId}/history`
        );
        if (!response.ok) {
          throw new Error("履歴の取得に失敗しました");
        }
        const data = await response.json();
        setHistory(data.history);
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [municipalityId]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">履歴を読み込み中...</div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div>
      {/* 統計 */}
      {stats && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-500">総変更数:</span>{" "}
              <span className="font-medium">{stats.totalChanges}</span>
            </div>
            <div>
              <span className="text-gray-500">手動:</span>{" "}
              <span className="font-medium">{stats.manualChanges}</span>
            </div>
            <div>
              <span className="text-gray-500">LLM:</span>{" "}
              <span className="font-medium">{stats.llmChanges}</span>
            </div>
          </div>
        </div>
      )}

      {/* 履歴テーブル */}
      {history.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          履歴がありません
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  種類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ソース
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  変更数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  実行者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  コメント
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.changedAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        typeLabels[entry.type]?.color || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {typeLabels[entry.type]?.label || entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sourceLabels[entry.source] || entry.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.changeCount}件
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.changedBy}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {entry.comment || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
