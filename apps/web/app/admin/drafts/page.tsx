import Link from "next/link";

export default function DraftsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">下書き一覧</h1>
        <p className="text-sm text-gray-500 mt-1">
          LLMが取得した情報の確認・承認
        </p>
      </div>

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

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          今後実装予定の機能
        </h2>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• LLM情報取得結果の下書き一覧表示</li>
          <li>• 下書きの確認・編集・承認</li>
          <li>• 一括承認機能</li>
          <li>• 変更差分の表示</li>
        </ul>
      </div>
    </div>
  );
}
