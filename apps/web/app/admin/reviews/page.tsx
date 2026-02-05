/**
 * レビュー待ちページ一覧
 *
 * ソース変更が検出され、レビューが必要なページの一覧を表示
 */

import Link from "next/link";
import { getReviewPendingPages } from "@/lib/review";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await getReviewPendingPages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-solid-gray-900">
            レビュー待ちページ
          </h1>
          <p className="mt-1 text-sm text-solid-gray-600">
            ソース変更が検出され、確認が必要なページ
          </p>
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sun-100 text-sun-800">
          {reviews.length}件
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-solid-gray-200 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-solid-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-solid-gray-900">
            レビュー待ちページはありません
          </h3>
          <p className="mt-2 text-sm text-solid-gray-600">
            すべてのページが最新の状態です。
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-solid-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-solid-gray-200">
            <thead className="bg-solid-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-solid-gray-500 uppercase tracking-wider"
                >
                  自治体
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-solid-gray-500 uppercase tracking-wider"
                >
                  ページ
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-solid-gray-500 uppercase tracking-wider"
                >
                  変更変数数
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-solid-gray-500 uppercase tracking-wider"
                >
                  検出日時
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-solid-gray-500 uppercase tracking-wider"
                >
                  状態
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-solid-gray-200">
              {reviews.map((review) => (
                <tr key={`${review.municipalityId}/${review.pagePath}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/municipalities/${review.municipalityId}`}
                      className="text-sm font-medium text-sea-600 hover:text-sea-800"
                    >
                      {review.municipalityName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-solid-gray-900">
                      /{review.pagePath}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sun-100 text-sun-800">
                      {review.changedVariables.length}件
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-solid-gray-500">
                    {new Date(review.detectedAt).toLocaleString("ja-JP", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.status === "review_required"
                          ? "bg-sun-100 text-sun-800"
                          : "bg-sea-100 text-sea-800"
                      }`}
                    >
                      {review.status === "review_required"
                        ? "確認待ち"
                        : "確認中"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/reviews/${review.municipalityId}/${review.pagePath}`}
                      className="text-sea-600 hover:text-sea-800"
                    >
                      確認する
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
