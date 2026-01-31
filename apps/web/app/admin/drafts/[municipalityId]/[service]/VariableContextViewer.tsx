"use client";

import { useState } from "react";
import { SourceViewer } from "./SourceViewer";
import { TemplatePreview } from "./TemplatePreview";
import { SearchAttemptsViewer } from "./SearchAttemptsViewer";

interface VariableEntry {
  value: string;
  sourceUrl: string;
  confidence: number;
  extractedAt: string;
  validated: boolean;
  validationError?: string;
}

interface VariableChange {
  variableName: string;
  changeType: "added" | "modified" | "removed" | "unchanged";
  oldValue?: string | null;
  newValue?: string | null;
}

interface SearchAttempt {
  query: string;
  searchedAt: string;
  resultsCount: number;
  urls: string[];
  snippets: string[];
  reason: 'not_found' | 'no_match' | 'low_confidence' | 'validation_failed';
}

interface MissingSuggestion {
  variableName: string;
  reason: string;
  relatedUrls: string[];
  relatedPdfs: string[];
  suggestedValue?: string | null;
  suggestedSourceUrl?: string | null;
  confidence?: number;
  status?: "suggested" | "accepted" | "rejected";
}

interface Props {
  municipalityId: string;
  service: string;
  variables: Record<string, VariableEntry>;
  missingVariables: string[];
  changes?: VariableChange[];
  searchAttempts?: Record<string, SearchAttempt[]>;
  missingSuggestions?: Record<string, MissingSuggestion>;
}

export function VariableContextViewer({
  municipalityId,
  service,
  variables,
  missingVariables,
  changes,
  searchAttempts,
  missingSuggestions,
}: Props) {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"acquired" | "missing">("acquired");
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedEntry = selectedVariable ? variables[selectedVariable] : null;
  const selectedSuggestion = selectedVariable ? missingSuggestions?.[selectedVariable] : null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getChangeInfo = (varName: string) => {
    return changes?.find((c) => c.variableName === varName);
  };

  // Convert variables to format expected by TemplatePreview
  const variablesForTemplate = Object.fromEntries(
    Object.entries(variables).map(([name, entry]) => [name, { value: entry.value }])
  );

  const applySuggestion = async () => {
    if (!selectedSuggestion?.suggestedValue || !selectedVariable) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/drafts/${municipalityId}/${service}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_suggestion",
          variableName: selectedVariable,
          value: selectedSuggestion.suggestedValue,
          sourceUrl: selectedSuggestion.suggestedSourceUrl,
          confidence: selectedSuggestion.confidence,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新に失敗しました");
      }

      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  const rejectSuggestion = async () => {
    if (!selectedVariable) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/drafts/${municipalityId}/${service}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject_suggestion",
          variableName: selectedVariable,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新に失敗しました");
      }

      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-[700px] border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Left Panel - Variables List */}
      <div className="w-1/4 flex flex-col border-r border-gray-200">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("acquired")}
            className={`flex-1 px-3 py-2 text-xs font-medium ${
              activeTab === "acquired"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            取得済み ({Object.keys(variables).length})
          </button>
          <button
            onClick={() => setActiveTab("missing")}
            className={`flex-1 px-3 py-2 text-xs font-medium ${
              activeTab === "missing"
                ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            未取得 ({missingVariables.length})
          </button>
        </div>

        {/* Variables List */}
        <div className="flex-1 overflow-auto">
          {activeTab === "acquired" ? (
            <div className="divide-y divide-gray-100">
              {Object.entries(variables).map(([name, entry]) => {
                const change = getChangeInfo(name);
                const isSelected = selectedVariable === name;

                return (
                  <button
                    key={name}
                    onClick={() => setSelectedVariable(name)}
                    className={`w-full text-left p-2 hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono truncate max-w-[120px]">
                            {name}
                          </code>
                          {change?.changeType === "added" && (
                            <span className="text-xs px-1 py-0.5 rounded bg-green-100 text-green-700">
                              新規
                            </span>
                          )}
                          {change?.changeType === "modified" && (
                            <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700">
                              変更
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-900 mt-1 truncate">
                          {entry.value}
                        </div>
                        {change?.changeType === "modified" && change.oldValue && (
                          <div className="text-xs text-gray-400 mt-0.5 line-through truncate">
                            旧: {change.oldValue}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-xs px-1 py-0.5 rounded flex-shrink-0 ${getConfidenceColor(
                          entry.confidence
                        )}`}
                      >
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    </div>
                    {entry.sourceUrl && (
                      <div className="text-xs text-gray-400 mt-1 truncate">
                        {(() => {
                          try {
                            return new URL(entry.sourceUrl).hostname;
                          } catch {
                            return entry.sourceUrl;
                          }
                        })()}
                      </div>
                    )}
                  </button>
                );
              })}
              {Object.keys(variables).length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  取得済みの変数がありません
                </div>
              )}
            </div>
          ) : (
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-2">
                以下の変数は自動取得できませんでした。
              </p>
              <div className="flex flex-wrap gap-1">
                {missingVariables.map((name) => (
                  <button
                    key={name}
                    onClick={() => setSelectedVariable(name)}
                    className={`text-xs px-2 py-1 rounded border font-mono ${
                      selectedVariable === name
                        ? "bg-orange-100 border-orange-400 text-orange-800"
                        : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {missingVariables.length === 0 && (
                <div className="text-center text-gray-500 text-sm">
                  すべての変数が取得済みです
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel - Sample Page Preview */}
      <div className="w-[37.5%] flex flex-col border-r border-gray-200 bg-gray-50">
        <div className="flex-shrink-0 px-3 py-2 border-b bg-white">
          <h3 className="text-sm font-medium text-gray-900">サンプルページ</h3>
          <p className="text-xs text-gray-500">変数の使用箇所（サンプル市の例）</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <TemplatePreview
            municipalityId={municipalityId}
            service={service}
            highlightVariable={selectedVariable}
            variables={variablesForTemplate}
          />
        </div>
      </div>

      {/* Right Panel - Source Content or Search Attempts */}
      <div className="w-[37.5%] flex flex-col bg-gray-50">
        <div className="flex-shrink-0 px-3 py-2 border-b bg-white">
          <h3 className="text-sm font-medium text-gray-900">
            {selectedVariable && missingVariables.includes(selectedVariable)
              ? "検索試行情報"
              : "ソースコンテンツ"}
          </h3>
          <p className="text-xs text-gray-500">
            {selectedVariable && missingVariables.includes(selectedVariable)
              ? "試みた検索と結果"
              : "取得元の内容"}
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedVariable && missingVariables.includes(selectedVariable) ? (
            <div className="h-full overflow-auto">
              {selectedSuggestion && (
                <div className="p-3 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-medium text-gray-900">代替案（LLM提案）</div>
                    {selectedSuggestion.status && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {selectedSuggestion.status === "accepted"
                          ? "採用済み"
                          : selectedSuggestion.status === "rejected"
                          ? "却下"
                          : "提案中"}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{selectedSuggestion.reason}</div>

                  {selectedSuggestion.suggestedValue && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                      <div className="text-xs text-blue-700 mb-1">提案値</div>
                      <div className="text-sm text-blue-900 break-all">
                        {selectedSuggestion.suggestedValue}
                      </div>
                      {selectedSuggestion.suggestedSourceUrl && (
                        <a
                          href={selectedSuggestion.suggestedSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-700 underline mt-1 inline-block"
                        >
                          参照リンク
                        </a>
                      )}
                    </div>
                  )}

                  {selectedSuggestion.relatedPdfs?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">関連PDF</div>
                      <div className="space-y-1">
                        {selectedSuggestion.relatedPdfs.map((pdfUrl, index) => (
                          <a
                            key={index}
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
                          >
                            {pdfUrl}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSuggestion.relatedUrls?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 mb-1">関連URL</div>
                      <div className="space-y-1">
                        {selectedSuggestion.relatedUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={applySuggestion}
                      disabled={isUpdating || !selectedSuggestion.suggestedValue || selectedSuggestion.status === "accepted"}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      採用
                    </button>
                    <button
                      onClick={rejectSuggestion}
                      disabled={isUpdating || selectedSuggestion.status === "rejected"}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      却下
                    </button>
                  </div>
                </div>
              )}
              <SearchAttemptsViewer
                variableName={selectedVariable}
                attempts={searchAttempts?.[selectedVariable] || []}
              />
            </div>
          ) : selectedEntry?.sourceUrl ? (
            <SourceViewer
              url={selectedEntry.sourceUrl}
              municipalityId={municipalityId}
              service={service}
              highlightText={selectedEntry.value}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">
              {selectedVariable
                ? "この変数にはソースURLがありません"
                : "左側の変数をクリックすると、使用箇所とソースが表示されます"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
