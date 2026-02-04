"use client";

/**
 * レビューアクションボタン
 *
 * 承認・却下・情報再取得のアクション
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewActionsProps {
  municipalityId: string;
  pagePath: string;
}

export default function ReviewActions({
  municipalityId,
  pagePath,
}: ReviewActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "dismiss") => {
    setIsLoading(action);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/reviews/${municipalityId}/${pagePath}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to perform action");
      }

      // 成功したらレビュー一覧に戻る
      router.push("/admin/reviews");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-solid-gray-200 p-6">
      <h2 className="text-lg font-medium text-solid-gray-900 mb-4">
        アクション
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleAction("approve")}
          disabled={isLoading !== null}
          className="w-full flex items-center justify-center px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading === "approve" ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              処理中...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              承認して公開
            </>
          )}
        </button>

        <button
          onClick={() => handleAction("dismiss")}
          disabled={isLoading !== null}
          className="w-full flex items-center justify-center px-4 py-2 border border-solid-gray-300 text-solid-gray-700 rounded-lg hover:bg-solid-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading === "dismiss" ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-solid-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              処理中...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              誤検知として却下
            </>
          )}
        </button>
      </div>

      <p className="mt-4 text-xs text-solid-gray-500">
        「承認して公開」を選択すると、ページが再び公開されます。
        <br />
        「誤検知として却下」を選択すると、変更はなかったものとして処理されます。
      </p>
    </div>
  );
}
