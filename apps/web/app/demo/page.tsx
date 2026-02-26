import Link from "next/link";

export default function DemoTopPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* ヘッダー */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          INNOMA
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-medium">
          自治体Webサイトをもっとわかりやすく
        </p>
        <p className="text-base text-gray-400 mt-2">
          体験して、その違いを実感しよう
        </p>
      </div>

      {/* 3つのカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {/* A. タイムトライアル */}
        <Link href="/demo/time-trial" className="group block">
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2 border-2 border-transparent group-hover:border-blue-400 p-8 h-full">
            {/* アイコンエリア */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                A
              </span>
              <h2 className="text-2xl font-bold text-gray-800">
                情報探しタイムトライアル
              </h2>
            </div>

            <p className="text-gray-500 leading-relaxed mb-6">
              既存の自治体Webサイトと、INNOMAで作られたWebサイト。
              同じ情報を探すのに、どれくらい時間の差が出るでしょう？
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                スロットで出題
              </span>
              <span className="flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                タイム計測
              </span>
            </div>

            <div className="mt-6 text-blue-500 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              チャレンジする
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* B. 工場見学 */}
        <Link href="/demo/factory" className="group block">
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2 border-2 border-transparent group-hover:border-purple-400 p-8 h-full">
            {/* アイコンエリア */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 20h20M5 20V8l7-5 7 5v12" />
                <path d="M9 20v-4h6v4" />
                <path d="M9 12h.01M15 12h.01" />
              </svg>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                B
              </span>
              <h2 className="text-2xl font-bold text-gray-800">
                イノマ工場見学
              </h2>
            </div>

            <p className="text-gray-500 leading-relaxed mb-6">
              既存のWebサイトがINNOMAでどう生まれ変わるのか。
              AIを使った半自動変換プロセスを、ステップバイステップで体験しよう。
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                5ステップ体験
              </span>
              <span className="flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 16v-4M12 8h.01" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                インタラクティブ
              </span>
            </div>

            <div className="mt-6 text-purple-500 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              見学する
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* C. INNOMAトップページ */}
        <Link href="/" className="group block">
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2 border-2 border-transparent group-hover:border-emerald-400 p-8 h-full">
            {/* アイコンエリア */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                C
              </span>
              <h2 className="text-2xl font-bold text-gray-800">
                INNOMAトップページ
              </h2>
            </div>

            <p className="text-gray-500 leading-relaxed mb-6">
              INNOMAの思想・情報設計・技術的な仕組みを紹介するトップページ。
              プロジェクトの全体像を確認できます。
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                プロジェクト概要
              </span>
              <span className="flex items-center gap-1">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                対応自治体一覧
              </span>
            </div>

            <div className="mt-6 text-emerald-500 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              トップページへ
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* フッター */}
      <div className="mt-16 text-center text-sm text-gray-400">
        <p>INNOMA - 自治体Webサイト刷新プラットフォーム</p>
      </div>
    </main>
  );
}
