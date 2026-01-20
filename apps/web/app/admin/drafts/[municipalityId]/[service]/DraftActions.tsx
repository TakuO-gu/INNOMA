"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DraftStatus } from "@/lib/drafts/types";

interface Props {
  municipalityId: string;
  service: string;
  status: DraftStatus;
}

export function DraftActions({ municipalityId, service, status }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  const handleAction = async (actionType: "approve" | "reject" | "delete") => {
    setIsLoading(true);
    setAction(actionType);

    try {
      const response = await fetch(
        `/api/admin/drafts/${municipalityId}/${service}`,
        {
          method: actionType === "delete" ? "DELETE" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body:
            actionType !== "delete"
              ? JSON.stringify({ action: actionType })
              : undefined,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "操作に失敗しました");
      }

      if (actionType === "delete") {
        router.push("/admin/drafts");
      } else {
        router.refresh();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "操作に失敗しました");
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const canApprove = status === "draft" || status === "pending_review";
  const canReject = status === "draft" || status === "pending_review";

  return (
    <div className="flex items-center gap-4">
      {canApprove && (
        <button
          onClick={() => handleAction("approve")}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading && action === "approve" ? "処理中..." : "承認して反映"}
        </button>
      )}

      {canReject && (
        <button
          onClick={() => handleAction("reject")}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
        >
          {isLoading && action === "reject" ? "処理中..." : "却下"}
        </button>
      )}

      <button
        onClick={() => handleAction("delete")}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        {isLoading && action === "delete" ? "処理中..." : "削除"}
      </button>

      {status === "approved" && (
        <span className="text-sm text-green-600">
          この下書きは承認済みです。変更は自治体データに反映されています。
        </span>
      )}

      {status === "rejected" && (
        <span className="text-sm text-red-600">
          この下書きは却下されました。
        </span>
      )}
    </div>
  );
}
