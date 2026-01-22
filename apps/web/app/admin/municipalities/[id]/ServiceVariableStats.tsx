"use client";

import { serviceDefinitions } from "@/lib/llm/variable-priority";
import type { VariableStore } from "@/lib/template";

interface ServiceVariableStatsProps {
  variables: VariableStore;
}

export function ServiceVariableStats({ variables }: ServiceVariableStatsProps) {
  const serviceStats = serviceDefinitions.map((service) => {
    const filled = service.variables.filter(
      (varName) => variables[varName]?.value && variables[varName].value.trim() !== ""
    ).length;
    const total = service.variables.length;
    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;

    return {
      id: service.id,
      name: service.name,
      filled,
      total,
      percentage,
    };
  });

  // 合計
  const totalFilled = serviceStats.reduce((sum, s) => sum + s.filled, 0);
  const totalCount = serviceStats.reduce((sum, s) => sum + s.total, 0);
  const totalPercentage = totalCount > 0 ? Math.round((totalFilled / totalCount) * 100) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">サービス別変数設定状況</h2>

      {/* 全体サマリー */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">全体</span>
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

      {/* サービス別 */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {serviceStats.map((service) => (
          <div key={service.id} className="border-b border-gray-100 pb-2 last:border-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700">{service.name}</span>
              <span className="text-xs text-gray-500">
                {service.filled}/{service.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  service.percentage === 100
                    ? "bg-green-500"
                    : service.percentage >= 50
                      ? "bg-yellow-500"
                      : service.percentage > 0
                        ? "bg-orange-500"
                        : "bg-gray-300"
                }`}
                style={{ width: `${service.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
