/**
 * レビュー詳細ページ
 *
 * 特定のページのソース変更内容を確認し、承認または却下する
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageReviewStatus } from "@/lib/review";
import { getMunicipalityMeta, getVariableStore } from "@/lib/template";
import ReviewActions from "./ReviewActions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    municipalityId: string;
    pagePath: string[];
  }>;
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { municipalityId, pagePath } = await params;
  const pagePathStr = pagePath.join("/");

  const [review, meta, variableStore] = await Promise.all([
    getPageReviewStatus(municipalityId, pagePathStr),
    getMunicipalityMeta(municipalityId),
    getVariableStore(municipalityId),
  ]);

  if (!review || !meta) {
    notFound();
  }

  // 変更が検出された変数の詳細
  const changedVariableDetails = review.changedVariables.map((varName) => {
    const variable = variableStore[varName];
    return {
      name: varName,
      currentValue: variable?.value || null,
      sourceUrl: variable?.sourceUrl || null,
      sourceChangedAt: variable?.sourceChangedAt || null,
      lastSourceCheckAt: variable?.lastSourceCheckAt || null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/reviews"
          className="text-solid-gray-500 hover:text-solid-gray-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-solid-gray-900">
            レビュー詳細
          </h1>
          <p className="mt-1 text-sm text-solid-gray-600">
            {meta.municipalityName || meta.name} / {pagePathStr}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メイン情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 変更された変数 */}
          <div className="bg-white rounded-lg border border-solid-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-solid-gray-200 bg-solid-gray-50">
              <h2 className="text-lg font-medium text-solid-gray-900">
                変更が検出された変数
              </h2>
            </div>
            <div className="divide-y divide-solid-gray-200">
              {changedVariableDetails.map((variable) => (
                <div key={variable.name} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-solid-gray-900">
                        {variable.name}
                      </h3>
                      {variable.currentValue && (
                        <p className="mt-1 text-sm text-solid-gray-600">
                          現在の値: {variable.currentValue}
                        </p>
                      )}
                      {variable.sourceUrl && (
                        <a
                          href={variable.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-sea-600 hover:text-sea-800 inline-flex items-center gap-1"
                        >
                          ソースURL
                          <svg
                            className="h-3 w-3"
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
                    </div>
                    {variable.sourceChangedAt && (
                      <span className="text-xs text-solid-gray-500">
                        {new Date(variable.sourceChangedAt).toLocaleString(
                          "ja-JP"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ページプレビュー */}
          <div className="bg-white rounded-lg border border-solid-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-solid-gray-200 bg-solid-gray-50">
              <h2 className="text-lg font-medium text-solid-gray-900">
                ページプレビュー
              </h2>
            </div>
            <div className="p-6">
              <div className="flex gap-4">
                <a
                  href={`/${municipalityId}/${pagePathStr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-solid-gray-300 rounded-lg text-sm font-medium text-solid-gray-700 hover:bg-solid-gray-50"
                >
                  現在のページを確認
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
                {meta.officialUrl && (
                  <a
                    href={meta.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-solid-gray-300 rounded-lg text-sm font-medium text-solid-gray-700 hover:bg-solid-gray-50"
                  >
                    公式サイトを確認
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
              </div>
            </div>
          </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* ステータス */}
          <div className="bg-white rounded-lg border border-solid-gray-200 p-6">
            <h2 className="text-lg font-medium text-solid-gray-900 mb-4">
              ステータス
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-solid-gray-500">状態</dt>
                <dd className="mt-1">
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
                </dd>
              </div>
              <div>
                <dt className="text-sm text-solid-gray-500">検出日時</dt>
                <dd className="mt-1 text-sm text-solid-gray-900">
                  {new Date(review.detectedAt).toLocaleString("ja-JP")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-solid-gray-500">変更変数数</dt>
                <dd className="mt-1 text-sm text-solid-gray-900">
                  {review.changedVariables.length}件
                </dd>
              </div>
            </dl>
          </div>

          {/* アクション */}
          <ReviewActions
            municipalityId={municipalityId}
            pagePath={pagePathStr}
          />
        </div>
      </div>
    </div>
  );
}
