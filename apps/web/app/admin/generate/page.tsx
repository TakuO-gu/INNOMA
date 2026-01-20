"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface GenerationJob {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  progress: number;
  message: string;
  logs: string[];
  result?: {
    success: boolean;
    municipality_id: string;
    output_dir: string;
    stats: {
      files_created: number;
      variables_fetched: number;
      variables_replaced: number;
      errors: string[];
    };
  };
}

const AVAILABLE_TOPICS = [
  { id: "出生届・命名", category: "届出・申請・証明書" },
  { id: "婚姻届・離婚届", category: "届出・申請・証明書" },
  { id: "転入届・転出届・転居届", category: "届出・申請・証明書" },
  { id: "戸籍謄本・住民票", category: "届出・申請・証明書" },
  { id: "マイナンバーカード", category: "届出・申請・証明書" },
  { id: "国民健康保険", category: "社会保障・給付金" },
  { id: "児童手当・児童扶養手当", category: "社会保障・給付金" },
  { id: "妊娠届・母子健康手帳", category: "子育て・教育" },
  { id: "保育所・幼稚園・認定こども園", category: "子育て・教育" },
  { id: "予防接種", category: "健康・医療" },
  { id: "ごみの分別・収集日", category: "環境・ごみ" },
  { id: "避難所・ハザードマップ", category: "防災・安全" },
];

export default function GeneratePage() {
  const [municipalityName, setMunicipalityName] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [skipTavily, setSkipTavily] = useState(false);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 自治体名からIDを自動生成
  const generateId = useCallback((name: string) => {
    // 簡易的なローマ字変換（実際は外部APIやライブラリを使用）
    return name
      .replace(/市|町|村|区/g, "")
      .toLowerCase()
      .trim();
  }, []);

  // IDを自動生成
  const handleNameChange = (name: string) => {
    setMunicipalityName(name);
    if (!municipalityId || municipalityId === generateId(municipalityName)) {
      setMunicipalityId(generateId(name));
    }
  };

  // 生成を開始
  const handleGenerate = async () => {
    if (!municipalityName.trim()) {
      alert("自治体名を入力してください");
      return;
    }

    setIsGenerating(true);
    const jobId = `gen-${Date.now()}`;

    setJob({
      id: jobId,
      status: "pending",
      progress: 0,
      message: "生成を準備中...",
      logs: [],
    });

    try {
      const response = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipality_name: municipalityName,
          municipality_id: municipalityId || generateId(municipalityName),
          topics: selectedTopics.length > 0 ? selectedTopics : undefined,
          skip_tavily: skipTavily,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setJob((prev) =>
          prev
            ? {
                ...prev,
                status: "error",
                message: data.error,
                logs: [...prev.logs, `ERROR: ${data.error}`],
              }
            : null
        );
      } else {
        setJob({
          id: jobId,
          status: "completed",
          progress: 100,
          message: "生成完了",
          logs: data.logs || [],
          result: data,
        });
      }
    } catch (error) {
      setJob((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              message: `生成エラー: ${error}`,
              logs: [...prev.logs, `ERROR: ${error}`],
            }
          : null
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // トピック選択を切り替え
  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    );
  };

  // 全選択/全解除
  const toggleAllTopics = () => {
    if (selectedTopics.length === AVAILABLE_TOPICS.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(AVAILABLE_TOPICS.map((t) => t.id));
    }
  };

  // カテゴリごとにトピックをグループ化
  const topicsByCategory = AVAILABLE_TOPICS.reduce(
    (acc, topic) => {
      if (!acc[topic.category]) {
        acc[topic.category] = [];
      }
      acc[topic.category].push(topic);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_TOPICS>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700">
          ← 戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          自治体アーティファクト生成
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* 自治体名入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自治体名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={municipalityName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="例: 高岡市"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isGenerating}
          />
        </div>

        {/* 自治体ID入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自治体ID（URL用、省略時は自動生成）
          </label>
          <input
            type="text"
            value={municipalityId}
            onChange={(e) => setMunicipalityId(e.target.value)}
            placeholder="例: takaoka"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isGenerating}
          />
          <p className="text-sm text-gray-500 mt-1">
            URLは /{municipalityId || generateId(municipalityName) || "xxx"}/
            になります
          </p>
        </div>

        {/* トピック選択 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              生成するトピック（省略時は全て）
            </label>
            <button
              type="button"
              onClick={toggleAllTopics}
              className="text-sm text-blue-600 hover:underline"
              disabled={isGenerating}
            >
              {selectedTopics.length === AVAILABLE_TOPICS.length
                ? "全解除"
                : "全選択"}
            </button>
          </div>
          <div className="space-y-4">
            {Object.entries(topicsByCategory).map(([category, topics]) => (
              <div key={category}>
                <div className="text-sm font-medium text-gray-500 mb-2">
                  {category}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {topics.map((topic) => (
                    <label
                      key={topic.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isGenerating}
                      />
                      {topic.id}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* オプション */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={skipTavily}
              onChange={(e) => setSkipTavily(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <span>
              Tavily検索をスキップ（プレースホルダー
              {"{{変数}}"}
              をそのまま残す）
            </span>
          </label>
        </div>

        {/* 生成ボタン */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleGenerate}
            disabled={!municipalityName.trim() || isGenerating}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? "生成中..." : "生成開始"}
          </button>
        </div>

        {/* 進捗表示 */}
        {job && (
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              生成ステータス
            </h2>

            {/* ステータスバッジ */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : job.status === "error"
                      ? "bg-red-100 text-red-800"
                      : job.status === "running"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {job.status === "completed"
                  ? "完了"
                  : job.status === "error"
                    ? "エラー"
                    : job.status === "running"
                      ? "実行中"
                      : "待機中"}
              </span>
              <span className="text-sm text-gray-600">{job.message}</span>
            </div>

            {/* プログレスバー */}
            <div className="bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  job.status === "error" ? "bg-red-500" : "bg-blue-600"
                }`}
                style={{ width: `${job.progress}%` }}
              />
            </div>

            {/* 結果 */}
            {job.result && (
              <div
                className={`p-4 rounded-lg ${
                  job.result.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {job.result.success ? (
                  <div>
                    <div className="font-medium text-green-800 mb-2">
                      生成完了しました
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>ID: {job.result.municipality_id}</div>
                      <div>
                        作成ファイル数: {job.result.stats.files_created}
                      </div>
                      <div>
                        取得変数数: {job.result.stats.variables_fetched}
                      </div>
                      <div>
                        置換変数数: {job.result.stats.variables_replaced}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/${job.result.municipality_id}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        プレビューを開く →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium text-red-800 mb-2">
                      エラーが発生しました
                    </div>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {job.result.stats.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ログ表示 */}
            {job.logs.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  ログ
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto">
                  {job.logs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
