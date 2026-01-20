import Link from "next/link";
import { getMunicipalities } from "@/lib/template";

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

export default async function AdminDashboard() {
  const municipalities = await getMunicipalities();

  const totalPages = municipalities.reduce((sum, m) => sum + m.pageCount, 0);
  const totalPendingDrafts = municipalities.reduce(
    (sum, m) => sum + m.pendingDrafts,
    0
  );
  const publishedCount = municipalities.filter(
    (m) => m.status === "published"
  ).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <Link
          href="/admin/municipalities/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新規自治体追加
        </Link>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">登録自治体数</div>
          <div className="text-3xl font-bold text-gray-900">
            {municipalities.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            公開中: {publishedCount}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">総ページ数</div>
          <div className="text-3xl font-bold text-gray-900">{totalPages}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">未承認の下書き</div>
          <div className="text-3xl font-bold text-gray-900">
            {totalPendingDrafts}
          </div>
          {totalPendingDrafts > 0 && (
            <Link
              href="/admin/drafts"
              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
            >
              確認する →
            </Link>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">テンプレート</div>
          <div className="text-3xl font-bold text-gray-900">
            {municipalities.find((m) => m.id === "sample")?.pageCount ?? 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">ページ (sample)</div>
        </div>
      </div>

      {/* 自治体一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">自治体一覧</h2>
          <Link
            href="/admin/municipalities"
            className="text-sm text-blue-600 hover:underline"
          >
            すべて表示 →
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {municipalities.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              まだ自治体が登録されていません。
              <br />
              <Link
                href="/admin/municipalities/new"
                className="text-blue-600 hover:underline"
              >
                新規自治体を追加
              </Link>
              してください。
            </div>
          ) : (
            municipalities.slice(0, 10).map((municipality) => (
              <div
                key={municipality.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {municipality.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {municipality.prefecture} / ID: {municipality.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={municipality.status} />
                  <div className="text-sm text-gray-500">
                    {municipality.pageCount}ページ
                  </div>
                  <div className="text-sm text-gray-500">
                    変数: {municipality.variableStats.filled}/
                    {municipality.variableStats.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/municipalities/${municipality.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      詳細
                    </Link>
                    <Link
                      href={`/${municipality.id}`}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                      target="_blank"
                    >
                      プレビュー ↗
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
