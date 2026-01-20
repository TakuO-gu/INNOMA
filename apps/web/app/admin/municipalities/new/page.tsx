"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PREFECTURES } from "@/lib/template/types";

export default function NewMunicipalityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    prefecture: "東京都",
    officialUrl: "",
    startFetch: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/municipalities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "自治体の追加に失敗しました");
      }

      // 成功したら詳細ページへリダイレクト
      router.push(`/admin/municipalities/${formData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 英小文字、数字、ハイフンのみ許可
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setFormData({ ...formData, id: value });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/admin/municipalities"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 自治体一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          新規自治体追加
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          sampleテンプレートを元に新しい自治体を作成します
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-6">
            {/* 自治体ID */}
            <div>
              <label
                htmlFor="id"
                className="block text-sm font-medium text-gray-700"
              >
                自治体ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id"
                value={formData.id}
                onChange={handleIdChange}
                placeholder="aogashima"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                URLパスに使用されます（英小文字、数字、ハイフンのみ）
              </p>
            </div>

            {/* 自治体名 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                自治体名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="青ヶ島村"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                required
              />
            </div>

            {/* 都道府県 */}
            <div>
              <label
                htmlFor="prefecture"
                className="block text-sm font-medium text-gray-700"
              >
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                id="prefecture"
                value={formData.prefecture}
                onChange={(e) =>
                  setFormData({ ...formData, prefecture: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                required
              >
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>

            {/* 公式サイトURL */}
            <div>
              <label
                htmlFor="officialUrl"
                className="block text-sm font-medium text-gray-700"
              >
                公式サイトURL
              </label>
              <input
                type="url"
                id="officialUrl"
                value={formData.officialUrl}
                onChange={(e) =>
                  setFormData({ ...formData, officialUrl: e.target.value })
                }
                placeholder="https://www.vill.aogashima.tokyo.jp/"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                LLMが情報を取得する際に参照します
              </p>
            </div>

            {/* LLM取得オプション */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="startFetch"
                checked={formData.startFetch}
                onChange={(e) =>
                  setFormData({ ...formData, startFetch: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="startFetch"
                className="ml-2 text-sm text-gray-700"
              >
                追加後すぐにLLM情報取得を開始する
              </label>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/municipalities"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "追加中..." : "追加"}
          </button>
        </div>
      </form>
    </div>
  );
}
