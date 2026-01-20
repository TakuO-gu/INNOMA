import Link from "next/link";
import { getAllDrafts, getDraftStatistics } from "@/lib/drafts";

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: "下書き", color: "bg-gray-100 text-gray-800" },
  pending_review: { label: "レビュー待ち", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済み", color: "bg-green-100 text-green-800" },
  rejected: { label: "却下", color: "bg-red-100 text-red-800" },
};

export default async function DraftsPage() {
  const drafts = await getAllDrafts();
  const stats = await getDraftStatistics();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">下書き一覧</h1>
        <p className="text-sm text-gray-500 mt-1">
          LLMが取得した情報の確認・承認
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">総下書き数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.pending_review}</div>
          <div className="text-sm text-gray-500">レビュー待ち</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.byStatus.approved}</div>
          <div className="text-sm text-gray-500">承認済み</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.byStatus.draft}</div>
          <div className="text-sm text-gray-500">下書き</div>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p className="mb-4">未承認の下書きはありません</p>
            <p className="text-sm">
              自治体の
              <Link
                href="/admin/municipalities"
                className="text-blue-600 hover:underline mx-1"
              >
                詳細ページ
              </Link>
              から「情報を再取得」を実行すると、<br />
              LLMが取得した情報が下書きとして保存されます。
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  自治体 / サービス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  取得状況
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新日時
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drafts.map((draft) => {
                const statusInfo = statusLabels[draft.status] || statusLabels.draft;
                const fillRate = draft.totalCount > 0
                  ? Math.round((draft.filledCount / draft.totalCount) * 100)
                  : 0;

                return (
                  <tr key={draft.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {draft.municipalityName || draft.municipalityId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {draft.serviceName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${fillRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {draft.filledCount}/{draft.totalCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(draft.updatedAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/admin/drafts/${draft.municipalityId}/${draft.service}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
