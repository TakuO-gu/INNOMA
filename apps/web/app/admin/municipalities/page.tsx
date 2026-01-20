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

export default async function MunicipalitiesPage() {
  const municipalities = await getMunicipalities();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">自治体一覧</h1>
          <p className="text-sm text-gray-500 mt-1">
            登録済みの自治体を管理します
          </p>
        </div>
        <Link
          href="/admin/municipalities/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新規自治体追加
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                自治体名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ページ数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                変数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                最終更新
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {municipalities.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  自治体が登録されていません。
                  <Link
                    href="/admin/municipalities/new"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    新規追加
                  </Link>
                </td>
              </tr>
            ) : (
              municipalities.map((municipality) => (
                <tr key={municipality.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {municipality.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {municipality.prefecture} / {municipality.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={municipality.status} />
                    {municipality.pendingDrafts > 0 && (
                      <span className="ml-2 text-xs text-yellow-600">
                        ({municipality.pendingDrafts}件の下書き)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {municipality.pageCount}ページ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {municipality.variableStats.filled}/
                      {municipality.variableStats.total}
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{
                          width: `${(municipality.variableStats.filled / municipality.variableStats.total) * 100}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(municipality.updatedAt).toLocaleDateString(
                      "ja-JP"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link
                      href={`/admin/municipalities/${municipality.id}`}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      詳細
                    </Link>
                    <Link
                      href={`/${municipality.id}`}
                      className="text-gray-500 hover:text-gray-700"
                      target="_blank"
                    >
                      プレビュー ↗
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
