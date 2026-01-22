"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

interface VariableInfo {
  name: string;
  description: string;
}

interface FetchedVariableInfo {
  name: string;
  value: string | null;
  confidence: number;
  sourceUrl: string;
}

interface ServiceProgress {
  id: string;
  serviceName: string;
  status: "pending" | "fetching" | "success" | "error" | "skipped";
  variables: VariableInfo[];
  fetchedVariables: FetchedVariableInfo[];
  error?: string;
}

interface FetchState {
  status: "idle" | "fetching" | "complete" | "error";
  totalServices: number;
  currentServiceIndex: number;
  services: ServiceProgress[];
  successCount: number;
  skippedCount: number;
  jobId?: string;
  isResume: boolean;
  errorMessage?: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  hasDraft: boolean;
  filledCount: number;
  missingCount: number;
  totalCount: number;
}

export function FetchButton({ id }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({
    status: "idle",
    totalServices: 0,
    currentServiceIndex: -1,
    services: [],
    successCount: 0,
    skippedCount: 0,
    isResume: false,
  });
  const [expandedService, setExpandedService] = useState<number | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check draft status for all services on mount
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const response = await fetch(`/api/admin/municipalities/${id}/fetch/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.serviceStatuses) {
            setServiceStatuses(data.serviceStatuses);
            // Pre-select services with missing variables
            const servicesWithMissing = data.serviceStatuses
              .filter((s: ServiceStatus) => s.missingCount > 0 || !s.hasDraft)
              .map((s: ServiceStatus) => s.id);
            setSelectedServices(servicesWithMissing);
          }
        }
      } catch (error) {
        console.error("Error checking service status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkServiceStatus();
  }, [id]);

  const handleFetch = useCallback(async (mode: "all" | "missing" | "selected", services?: string[]) => {
    // Create new AbortController for this fetch
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState({
      status: "fetching",
      totalServices: 0,
      currentServiceIndex: -1,
      services: [],
      successCount: 0,
      skippedCount: 0,
      isResume: false,
    });
    setExpandedService(null);
    setShowServiceSelector(false);

    try {
      const body: { services?: string[]; onlyMissing?: boolean } = {};

      if (mode === "selected" && services) {
        body.services = services;
      } else if (mode === "missing") {
        body.onlyMissing = true;
      }
      // mode === "all" sends empty body to fetch everything

      const response = await fetch(`/api/admin/municipalities/${id}/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "情報取得に失敗しました");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("ストリームの読み取りに失敗しました");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check if aborted
        if (signal.aborted) {
          reader.cancel();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (!signal.aborted) {
        router.refresh();
      }
    } catch (error) {
      // Don't show error if aborted by user
      if (error instanceof Error && error.name === "AbortError") {
        setState((prev) => ({
          ...prev,
          status: "idle",
        }));
        router.refresh();
        return;
      }
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: error instanceof Error ? error.message : "情報取得に失敗しました",
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, [id, router]);

  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({
        ...prev,
        status: "idle",
      }));
    }
  }, []);

  const handleEvent = (event: {
    type: string;
    totalServices?: number;
    services?: { id: string; name: string; variableCount: number; status?: string }[];
    service?: string;
    serviceIndex?: number;
    serviceName?: string;
    variables?: VariableInfo[];
    fetchedVariables?: FetchedVariableInfo[];
    success?: boolean;
    variablesCount?: number;
    error?: string;
    successCount?: number;
    message?: string;
    jobId?: string;
    isResume?: boolean;
    skippedCount?: number;
  }) => {
    switch (event.type) {
      case "start":
        setState((prev) => ({
          ...prev,
          totalServices: event.totalServices || 0,
          jobId: event.jobId,
          isResume: event.isResume || false,
          skippedCount: event.skippedCount || 0,
          services: (event.services || []).map((s) => ({
            id: s.id,
            serviceName: s.name,
            status: s.status === "skipped" ? "skipped" : "pending" as const,
            variables: [],
            fetchedVariables: [],
          })),
        }));
        break;

      case "service_start":
        setState((prev) => ({
          ...prev,
          currentServiceIndex: event.serviceIndex || 0,
          services: prev.services.map((s, i) =>
            i === event.serviceIndex
              ? {
                  ...s,
                  status: "fetching" as const,
                  variables: event.variables || [],
                }
              : s
          ),
        }));
        // Auto-expand the current service
        setExpandedService(event.serviceIndex || 0);
        break;

      case "service_complete":
        setState((prev) => {
          const newServices = prev.services.map((s, i) =>
            i === prev.currentServiceIndex
              ? {
                  ...s,
                  status: (event.success ? "success" : "error") as "success" | "error",
                  fetchedVariables: event.fetchedVariables || [],
                  error: event.error,
                }
              : s
          );
          return {
            ...prev,
            services: newServices,
            successCount: event.success ? prev.successCount + 1 : prev.successCount,
          };
        });
        break;

      case "complete":
        setState((prev) => ({
          ...prev,
          status: "complete",
          successCount: event.successCount || 0,
        }));
        break;

      case "error":
        setState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: event.message,
        }));
        break;
    }
  };

  const activeServices = state.services.filter((s) => s.status !== "skipped");
  const completedActiveServices = activeServices.filter(
    (s) => s.status === "success" || s.status === "error"
  ).length;

  // Calculate variable-based progress
  const totalVariables = activeServices.reduce(
    (sum, s) => sum + s.variables.length,
    0
  );
  const fetchedVariables = activeServices.reduce(
    (sum, s) => sum + s.fetchedVariables.length,
    0
  );
  const progressPercent =
    totalVariables > 0
      ? Math.round((fetchedVariables / totalVariables) * 100)
      : 0;

  const toggleService = (index: number) => {
    setExpandedService(expandedService === index ? null : index);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const getVariableStatus = (
    service: ServiceProgress,
    varName: string
  ): "pending" | "fetched" | "missing" => {
    if (service.status === "pending") return "pending";
    const fetched = service.fetchedVariables.find((v) => v.name === varName);
    return fetched ? "fetched" : "missing";
  };

  // Calculate summary stats
  const totalMissingServices = serviceStatuses.filter(s => s.missingCount > 0 || !s.hasDraft).length;
  const totalMissingVariables = serviceStatuses.reduce((sum, s) => sum + s.missingCount, 0);
  const servicesWithoutDraft = serviceStatuses.filter(s => !s.hasDraft).length;

  return (
    <div className="space-y-3">
      {/* Loading state */}
      {checkingStatus && (
        <div className="text-sm text-gray-500">サービス状況を確認中...</div>
      )}

      {/* Service status summary and fetch options */}
      {!checkingStatus && state.status === "idle" && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <div className="font-medium text-gray-700 mb-2">取得状況</div>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>サービス数: {serviceStatuses.length}</div>
              <div>未取得サービス: {servicesWithoutDraft}</div>
              <div>取得済み: {serviceStatuses.filter(s => s.hasDraft).length}</div>
              <div>未取得変数: {totalMissingVariables}</div>
            </div>
          </div>

          {/* Fetch mode selector */}
          {!showServiceSelector ? (
            <div className="flex flex-wrap gap-2">
              {totalMissingServices > 0 ? (
                <button
                  onClick={() => handleFetch("missing")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  未取得のみ取得 ({totalMissingServices}サービス)
                </button>
              ) : (
                <button
                  onClick={() => handleFetch("all")}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  全て再取得
                </button>
              )}
              <button
                onClick={() => setShowServiceSelector(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                サービスを選択して取得
              </button>
            </div>
          ) : (
            <div className="p-4 bg-white border border-gray-300 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">取得するサービスを選択</span>
                <button
                  onClick={() => setShowServiceSelector(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  キャンセル
                </button>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {serviceStatuses.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                      !service.hasDraft ? "bg-amber-50" : service.missingCount > 0 ? "bg-yellow-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleServiceSelection(service.id)}
                      className="rounded text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">
                        {service.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {!service.hasDraft ? (
                          <span className="text-amber-600">未取得</span>
                        ) : service.missingCount > 0 ? (
                          <span className="text-yellow-600">
                            {service.filledCount}/{service.totalCount} 取得済み（{service.missingCount}件未取得）
                          </span>
                        ) : (
                          <span className="text-green-600">
                            {service.filledCount}/{service.totalCount} 全て取得済み
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleFetch("selected", selectedServices)}
                  disabled={selectedServices.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedServices.length}件のサービスを取得
                </button>
                <button
                  onClick={() => {
                    const allIds = serviceStatuses.map(s => s.id);
                    setSelectedServices(
                      selectedServices.length === allIds.length ? [] : allIds
                    );
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {selectedServices.length === serviceStatuses.length ? "全解除" : "全選択"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fetching state */}
      {state.status === "fetching" && (
        <div className="flex gap-2">
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md opacity-50 cursor-not-allowed"
          >
            取得中...
          </button>
          <button
            onClick={handleAbort}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
          >
            中断
          </button>
        </div>
      )}

      {/* Progress display */}
      {state.status === "fetching" && state.totalServices > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
          {/* Resume indicator */}
          {state.isResume && state.skippedCount > 0 && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
              前回完了した {state.skippedCount} サービスをスキップして再開中
            </div>
          )}

          {/* Progress bar - variable based */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                変数取得: {fetchedVariables} / {totalVariables}
                {state.skippedCount > 0 && (
                  <span className="text-gray-400 ml-1">
                    (+{state.skippedCount} サービススキップ)
                  </span>
                )}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">
              サービス: {completedActiveServices} / {activeServices.length} 完了
            </div>
          </div>

          {/* Current service with spinner */}
          {state.currentServiceIndex >= 0 &&
            state.services[state.currentServiceIndex] && (
              <div className="flex items-center gap-2 text-sm">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span className="text-gray-700 font-medium">
                  {state.services[state.currentServiceIndex].serviceName} を取得中...
                </span>
              </div>
            )}

          {/* Service list with expandable details */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {state.services.map((service, index) => (
              <div key={index} className="border rounded overflow-hidden">
                {/* Service header */}
                <button
                  onClick={() => toggleService(index)}
                  className={`w-full flex items-center justify-between text-sm px-3 py-2 ${
                    service.status === "skipped"
                      ? "bg-gray-100 text-gray-400"
                      : service.status === "fetching"
                      ? "bg-blue-50 text-blue-700"
                      : service.status === "success"
                      ? "bg-green-50 text-green-700"
                      : service.status === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {service.status === "skipped" && (
                      <span className="w-4 h-4 text-center text-gray-400">⏭</span>
                    )}
                    {service.status === "pending" && (
                      <span className="w-4 h-4 text-center">○</span>
                    )}
                    {service.status === "fetching" && (
                      <span className="w-4 h-4 text-center animate-pulse">●</span>
                    )}
                    {service.status === "success" && (
                      <span className="w-4 h-4 text-center text-green-600">✓</span>
                    )}
                    {service.status === "error" && (
                      <span className="w-4 h-4 text-center text-red-600">✗</span>
                    )}
                    <span className="font-medium">{service.serviceName}</span>
                    {service.status === "skipped" && (
                      <span className="text-xs text-gray-400">(前回完了)</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    {service.status === "success" && (
                      <span className="text-xs text-green-600">
                        {service.fetchedVariables.length}件取得
                      </span>
                    )}
                    <span className="text-gray-400">
                      {expandedService === index ? "▲" : "▼"}
                    </span>
                  </span>
                </button>

                {/* Expanded variable details */}
                {expandedService === index && (
                  <div className="px-3 py-2 bg-white border-t text-xs space-y-1">
                    {service.status === "skipped" ? (
                      <div className="text-gray-400 py-1">
                        前回の取得で完了済み
                      </div>
                    ) : service.variables.length > 0 ? (
                      service.variables.map((variable) => {
                        const varStatus = getVariableStatus(service, variable.name);
                        const fetchedVar = service.fetchedVariables.find(
                          (v) => v.name === variable.name
                        );

                        return (
                          <div
                            key={variable.name}
                            className={`flex items-start justify-between py-1 ${
                              varStatus === "fetched"
                                ? "text-green-700"
                                : varStatus === "missing"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {varStatus === "pending" && (
                                <span className="w-3 h-3 text-center text-gray-400">
                                  ○
                                </span>
                              )}
                              {service.status === "fetching" && varStatus === "pending" && (
                                <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                              )}
                              {varStatus === "fetched" && (
                                <span className="w-3 h-3 text-center text-green-500">
                                  ✓
                                </span>
                              )}
                              {varStatus === "missing" && (
                                <span className="w-3 h-3 text-center text-gray-300">
                                  −
                                </span>
                              )}
                              <span>{variable.description}</span>
                            </div>
                            {fetchedVar && fetchedVar.value && (
                              <span
                                className="text-green-600 max-w-[200px] truncate"
                                title={fetchedVar.value}
                              >
                                {fetchedVar.value}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-400 py-1">
                        変数情報を読み込み中...
                      </div>
                    )}
                    {service.error && (
                      <div className="text-red-500 py-1 border-t mt-1">
                        エラー: {service.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete message */}
      {state.status === "complete" && (
        <div className="p-3 rounded-md text-sm bg-green-50 text-green-800 border border-green-200">
          <div className="font-medium">
            {state.successCount}/{state.totalServices}サービスの情報を取得しました。
            {state.isResume && state.skippedCount > 0 && (
              <span className="text-green-600 ml-1">
                （うち{state.skippedCount}件は前回取得済み）
              </span>
            )}
          </div>
          <div className="mt-1 text-green-600">
            下書きページで確認・承認してください。
          </div>
        </div>
      )}

      {/* Error message */}
      {state.status === "error" && (
        <div className="p-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200 space-y-2">
          <div>{state.errorMessage}</div>
          <button
            onClick={() => handleFetch("missing")}
            className="px-3 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
          >
            再試行
          </button>
        </div>
      )}
    </div>
  );
}
