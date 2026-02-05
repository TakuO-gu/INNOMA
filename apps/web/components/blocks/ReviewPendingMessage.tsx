/**
 * レビュー待ちページのメッセージ表示
 *
 * ソース変更が検出され、レビュー待ちのページに表示するメッセージ
 */

import Link from "next/link";

interface ReviewPendingMessageProps {
  /** 自治体の公式サイトURL */
  officialUrl?: string;
  /** 自治体ID */
  municipalityId: string;
}

export default function ReviewPendingMessage({
  officialUrl,
  municipalityId,
}: ReviewPendingMessageProps) {
  return (
    <main id="main" className="min-h-screen bg-solid-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-solid-gray-200 p-8">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-sea-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-solid-gray-900 mb-4">
              このページは現在更新中です
            </h1>

            <p className="text-solid-gray-600 mb-8 leading-relaxed">
              自治体公式サイトの情報が更新された可能性があるため、
              <br />
              内容を確認中です。
            </p>

            <p className="text-solid-gray-600 mb-8">
              最新の情報は自治体公式サイトをご確認ください。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {officialUrl && (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-sea-600 text-white rounded-lg hover:bg-sea-700 transition-colors"
                >
                  公式サイトを開く
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}

              <Link
                href={`/${municipalityId}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-solid-gray-300 text-solid-gray-700 rounded-lg hover:bg-solid-gray-50 transition-colors"
              >
                トップページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
