"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Variable {
  name: string;
  value: string;
  source: string;
  sourceUrl?: string;
  confidence?: number;
  updatedAt: string;
}

interface VariableTableProps {
  variables: Variable[];
  municipalityId: string;
  editable?: boolean;
}

export function VariableTable({
  variables,
  municipalityId,
  editable = true,
}: VariableTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredVariables = variables.filter((v) => {
    const matchesName = v.name.toLowerCase().includes(filter.toLowerCase());
    const matchesSource =
      sourceFilter === "all" || v.source === sourceFilter;
    return matchesName && matchesSource;
  });

  const sources = [...new Set(variables.map((v) => v.source))];

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      manual: "手動",
      llm: "LLM",
      default: "デフォルト",
    };
    return labels[source] ?? source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      manual: "bg-blue-100 text-blue-800",
      llm: "bg-green-100 text-green-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[source] ?? "bg-gray-100 text-gray-800";
  };

  const startEditing = (variable: Variable) => {
    setEditingVar(variable.name);
    setEditValue(variable.value);
  };

  const cancelEditing = () => {
    setEditingVar(null);
    setEditValue("");
  };

  const saveEdit = async (variableName: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/municipalities/${municipalityId}/variables`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [variableName]: editValue,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      setEditingVar(null);
      setEditValue("");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (variables.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500">
        変数が設定されていません
      </div>
    );
  }

  return (
    <div>
      {/* フィルター */}
      <div className="px-6 py-4 border-b border-gray-200 flex gap-4">
        <input
          type="text"
          placeholder="変数名で検索..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
        />
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
        >
          <option value="all">すべてのソース</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {getSourceLabel(source)}
            </option>
          ))}
        </select>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                変数名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                値
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ソース
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新日時
              </th>
              {editable && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVariables.map((variable) => (
              <tr key={variable.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono text-gray-900">
                    {variable.name}
                  </code>
                </td>
                <td className="px-6 py-4">
                  {editingVar === variable.name ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-2 py-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveEdit(variable.name);
                        } else if (e.key === "Escape") {
                          cancelEditing();
                        }
                      }}
                    />
                  ) : (
                    <div className="text-sm text-gray-900 max-w-md truncate">
                      {variable.value || (
                        <span className="text-gray-400">（未設定）</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSourceColor(variable.source)}`}
                  >
                    {getSourceLabel(variable.source)}
                  </span>
                  {variable.confidence !== undefined && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({Math.round(variable.confidence * 100)}%)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(variable.updatedAt).toLocaleDateString("ja-JP")}
                </td>
                {editable && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {editingVar === variable.name ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(variable.name)}
                          disabled={isSaving}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {isSaving ? "保存中..." : "保存"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(variable)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredVariables.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          該当する変数が見つかりません
        </div>
      )}

      <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
        {filteredVariables.length}件の変数を表示
      </div>
    </div>
  );
}
