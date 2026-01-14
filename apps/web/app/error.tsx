"use client";

import { useEffect } from "react";
import NextLink from "next/link";
import { Button } from "@/components/dads";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-solid-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl border border-solid-gray-300 p-8 shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-solid-gray-900 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-solid-gray-600 mb-6">
            申し訳ありません。予期しないエラーが発生しました。
            しばらくしてから再度お試しください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} variant="solid-fill" size="md">
              再試行
            </Button>
            <Button asChild variant="outline" size="md">
              <NextLink href="/">
                ホームに戻る
              </NextLink>
            </Button>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs text-solid-gray-420">
              エラーID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
