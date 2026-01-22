import Link from "next/link";
import { notFound } from "next/navigation";
import { getDraft, getDraftComparison } from "@/lib/drafts";
import { getMunicipalityMeta } from "@/lib/template";
import { serviceDefinitions } from "@/lib/llm/variable-priority";
import { DraftActions } from "./DraftActions";
import { VariableContextViewer } from "./VariableContextViewer";

interface Props {
  params: Promise<{
    municipalityId: string;
    service: string;
  }>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-800" },
  pending_review: { label: "レビュー待ち", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済み", color: "bg-green-100 text-green-800" },
  rejected: { label: "却下", color: "bg-red-100 text-red-800" },
};

export default async function DraftDetailPage({ params }: Props) {
  const { municipalityId, service } = await params;

  const draft = await getDraft(municipalityId, service);
  if (!draft) {
    notFound();
  }

  const meta = await getMunicipalityMeta(municipalityId);
  const serviceInfo = serviceDefinitions.find((s) => s.id === service);
  const comparison = await getDraftComparison(municipalityId, service);

  const statusInfo = statusLabels[draft.status] || statusLabels.draft;

  // Prepare changes data for client component
  const changesData = comparison?.changes.map((c) => ({
    variableName: c.variableName,
    changeType: c.changeType,
    oldValue: c.oldValue,
    newValue: c.newValue,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/drafts" className="hover:text-gray-700">
            下書き一覧
          </Link>
          <span>/</span>
          <span>{meta?.name || municipalityId}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {serviceInfo?.nameJa || service} の下書き
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {meta?.name || municipalityId}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {Object.keys(draft.variables).length}
          </div>
          <div className="text-sm text-gray-500">取得済み変数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">
            {draft.missingVariables.length}
          </div>
          <div className="text-sm text-gray-500">未取得変数</div>
        </div>
        {comparison && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
              <div className="text-2xl font-bold text-green-600">
                {comparison.addedCount}
              </div>
              <div className="text-sm text-gray-500">新規追加</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
              <div className="text-2xl font-bold text-blue-600">
                {comparison.modifiedCount}
              </div>
              <div className="text-sm text-gray-500">変更</div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mb-8">
        <DraftActions
          municipalityId={municipalityId}
          service={service}
          status={draft.status}
        />
      </div>

      {/* Variable Context Viewer (Split View) */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">変数とソースの確認</h2>
          <p className="text-sm text-gray-500 mt-1">
            左側で変数を選択すると、右側に取得元のソースコンテンツが表示されます。取得した値がハイライトされます。
          </p>
        </div>
        <VariableContextViewer
          municipalityId={municipalityId}
          service={service}
          variables={draft.variables}
          missingVariables={draft.missingVariables}
          changes={changesData}
        />
      </div>

      {/* Errors */}
      {draft.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">
              エラー ({draft.errors.length})
            </h2>
          </div>
          <div className="px-6 py-4">
            <ul className="space-y-2">
              {draft.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-600">
                  <span className="font-mono bg-red-50 px-1 rounded">
                    [{error.code}]
                  </span>{" "}
                  {error.message}
                  {error.variableName && (
                    <span className="text-gray-500">
                      {" "}
                      (変数: {error.variableName})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-8 text-sm text-gray-500">
        <p>作成日時: {new Date(draft.createdAt).toLocaleString("ja-JP")}</p>
        <p>更新日時: {new Date(draft.updatedAt).toLocaleString("ja-JP")}</p>
      </div>
    </div>
  );
}
