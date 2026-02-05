"use client";

import { VariableTable } from "./VariableTable";

interface Variable {
  name: string;
  value: string;
  source: string;
  sourceUrl?: string;
  confidence?: number;
  updatedAt: string;
}

interface VariableTableWrapperProps {
  variables: Variable[];
  municipalityId: string;
}

export function VariableTableWrapper({ variables, municipalityId }: VariableTableWrapperProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">変数一覧</h2>
        <p className="text-sm text-gray-500 mt-1">
          設定済み: {variables.length}件
        </p>
      </div>
      <VariableTable variables={variables} municipalityId={municipalityId} />
    </div>
  );
}
