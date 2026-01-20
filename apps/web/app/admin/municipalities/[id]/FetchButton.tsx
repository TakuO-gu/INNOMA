"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

export function FetchButton({ id }: Props) {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFetch = async () => {
    setIsFetching(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/municipalities/${id}/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "情報取得に失敗しました");
      }

      setResult({
        success: true,
        message: `${data.successCount}/${data.totalServices}サービスの情報を取得しました。下書きページで確認してください。`,
      });

      router.refresh();
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "情報取得に失敗しました",
      });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleFetch}
        disabled={isFetching}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isFetching ? "取得中..." : "情報を再取得"}
      </button>
      {result && (
        <div
          className={`mt-2 p-3 rounded-md text-sm ${
            result.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
