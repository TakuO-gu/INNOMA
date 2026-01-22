"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  name: string;
  currentStatus: string;
}

export function PublishButton({ id, name, currentStatus }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isPublished = currentStatus === "published";

  const handleTogglePublish = async () => {
    const newStatus = isPublished ? "draft" : "published";
    const action = isPublished ? "非公開に" : "公開";

    if (
      !confirm(
        `「${name}」を${action}しますか？`
      )
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/municipalities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "操作に失敗しました");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTogglePublish}
      disabled={isLoading}
      className={`px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 ${
        isPublished
          ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          : "text-white bg-green-600 hover:bg-green-700"
      }`}
    >
      {isLoading ? "処理中..." : isPublished ? "非公開にする" : "公開する"}
    </button>
  );
}
