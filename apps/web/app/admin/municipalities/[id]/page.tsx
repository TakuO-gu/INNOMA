import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMunicipality,
  getMunicipalityMeta,
  getVariableStore,
} from "@/lib/template";
import { DeleteButton } from "./DeleteButton";
import { VariableTable } from "./VariableTable";

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-green-100 text-green-800",
    draft: "bg-gray-100 text-gray-800",
    fetching: "bg-blue-100 text-blue-800",
    pending_review: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  const labels: Record<string, string> = {
    published: "公開中",
    draft: "作成中",
    fetching: "取得中",
    pending_review: "レビュー待ち",
    error: "エラー",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default async function MunicipalityDetailPage({ params }: PageProps) {
  const { id } = await params;

  const summary = await getMunicipality(id);
  if (!summary) {
    notFound();
  }

  const meta = await getMunicipalityMeta(id);
  const variables = await getVariableStore(id);

  const variableEntries = Object.entries(variables).map(([name, data]) => ({
    name,
    value: data.value,
    source: data.source,
    sourceUrl: data.sourceUrl,
    confidence: data.confidence,
    updatedAt: data.updatedAt,
  }));

  const isSample = id === "sample";

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/municipalities"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 自治体一覧に戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{summary.name}</h1>
            <StatusBadge status={summary.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {summary.prefecture} / ID: {id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${id}`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            target="_blank"
          >
            プレビュー ↗
          </Link>
          {!isSample && <DeleteButton id={id} name={summary.name} />}
        </div>
      </div>

      {/* 基本情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">自治体ID</dt>
              <dd className="text-sm font-mono text-gray-900">{id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">都道府県</dt>
              <dd className="text-sm text-gray-900">{summary.prefecture}</dd>
            </div>
            {meta?.officialUrl && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">公式サイト</dt>
                <dd className="text-sm text-blue-600 hover:underline">
                  <a href={meta.officialUrl} target="_blank" rel="noopener">
                    {meta.officialUrl}
                  </a>
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">作成日</dt>
              <dd className="text-sm text-gray-900">
                {meta?.createdAt
                  ? new Date(meta.createdAt).toLocaleDateString("ja-JP")
                  : "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">最終更新</dt>
              <dd className="text-sm text-gray-900">
                {new Date(summary.updatedAt).toLocaleDateString("ja-JP")}
              </dd>
            </div>
            {meta?.lastFetchAt && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">最終LLM取得</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(meta.lastFetchAt).toLocaleDateString("ja-JP")}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">統計</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">ページ数</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {summary.pageCount}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-gray-500">変数設定率</dt>
              <dd className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {summary.variableStats.filled}/{summary.variableStats.total}
                </span>
                <span className="text-xs text-gray-500">
                  (
                  {Math.round(
                    (summary.variableStats.filled /
                      summary.variableStats.total) *
                      100
                  )}
                  %)
                </span>
              </dd>
            </div>
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(summary.variableStats.filled / summary.variableStats.total) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">未承認の下書き</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {summary.pendingDrafts}件
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* アクション */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">アクション</h2>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            情報を再取得
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            手動編集
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          LLM情報取得機能は今後実装予定です
        </p>
      </div>

      {/* 変数一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">変数一覧</h2>
          <p className="text-sm text-gray-500 mt-1">
            設定済み: {variableEntries.length}件
          </p>
        </div>
        <VariableTable variables={variableEntries} />
      </div>
    </div>
  );
}
