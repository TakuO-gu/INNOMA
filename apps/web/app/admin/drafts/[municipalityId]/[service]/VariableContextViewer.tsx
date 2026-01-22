"use client";

import { useState } from "react";
import { SourceViewer } from "./SourceViewer";
import { TemplatePreview } from "./TemplatePreview";

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

interface Props {
  municipalityId: string;
  service: string;
  variables: Record<string, VariableEntry>;
  missingVariables: string[];
  changes?: VariableChange[];
}

export function VariableContextViewer({
  municipalityId,
  service,
  variables,
  missingVariables,
  changes,
}: Props) {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"acquired" | "missing">("acquired");

  const selectedEntry = selectedVariable ? variables[selectedVariable] : null;

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

      {/* Right Panel - Source Content */}
      <div className="w-[37.5%] flex flex-col bg-gray-50">
        <div className="flex-shrink-0 px-3 py-2 border-b bg-white">
          <h3 className="text-sm font-medium text-gray-900">ソースコンテンツ</h3>
          <p className="text-xs text-gray-500">取得元の内容</p>
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedEntry?.sourceUrl ? (
            <SourceViewer
              url={selectedEntry.sourceUrl}
              municipalityId={municipalityId}
              service={service}
              highlightText={selectedEntry.value}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">
              {selectedVariable ? (
                missingVariables.includes(selectedVariable) ? (
                  <div>
                    <div className="text-orange-500 font-medium mb-1">未取得変数</div>
                    <div className="text-xs">
                      この変数はまだ取得されていません。
                      <br />
                      左のパネルで使用箇所を確認できます。
                    </div>
                  </div>
                ) : (
                  "この変数にはソースURLがありません"
                )
              ) : (
                "左側の変数をクリックすると、使用箇所とソースが表示されます"
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
