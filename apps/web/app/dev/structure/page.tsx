"use client";

import { useState } from "react";
import BlockRenderer from "@/components/blocks/BlockRenderer";

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface StructureResult {
  success: boolean;
  sourceUrl?: string;
  summary?: string;
  blocks?: Block[];
  blockCount?: number;
  processingTimeMs?: number;
  error?: string;
  details?: string;
}

export default function StructurePage() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [municipalityName, setMunicipalityName] = useState("高岡市");
  const [inputMode, setInputMode] = useState<"url" | "content">("content");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructureResult | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "blocks" | "json">("preview");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const body =
        inputMode === "url"
          ? { url, serviceName, municipalityName }
          : { content, serviceName, municipalityName };

      const res = await fetch("/api/dev/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "リクエストに失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleContent = `住民票の写しの交付

【現在の受付状況】
受付中

対象となる方
高岡市に住民登録のある方

必要なもの
・本人確認書類（運転免許証、マイナンバーカードなど）
・印鑑（認印可）

手数料
300円（1通あたり）

届出先
市民課（市役所1階）
電話：0766-20-1234
受付時間：平日8:30〜17:15

手続きの流れ
1. 市民課窓口で申請書に記入
2. 本人確認書類を提示
3. 手数料を支払い
4. 住民票を受け取り

注意事項
本人以外の方が申請する場合は委任状が必要です。委任状には委任者の住所、氏名、生年月日、委任する内容、代理人の住所、氏名を記載し、委任者が自署・押印してください。

根拠法令
「住民基本台帳法第12条」に基づき、住民票の写しを交付します。

関連サービス
・印鑑登録証明書の交付
・戸籍謄本の交付
・マイナンバーカードの申請

よくある質問
Q: コンビニでも取得できますか？
A: マイナンバーカードをお持ちの方は、全国のコンビニで取得できます。

Q: 郵送で請求できますか？
A: はい、郵送でも請求可能です。申請書、本人確認書類のコピー、手数料分の定額小為替、返信用封筒を同封してください。`;

  const loadSample = () => {
    setContent(sampleContent);
    setServiceName("住民票の写しの交付");
    setInputMode("content");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">コンテンツ構造化テスト</h1>
        <p className="text-gray-600 mb-6">
          URLまたはテキストコンテンツからINNOMAブロック構造を自動生成します
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 入力フォーム */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit}>
              {/* 入力モード切替 */}
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={inputMode === "content"}
                    onChange={() => setInputMode("content")}
                  />
                  テキスト入力
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={inputMode === "url"}
                    onChange={() => setInputMode("url")}
                  />
                  URL取得
                </label>
                <button
                  type="button"
                  onClick={loadSample}
                  className="ml-auto text-sm text-blue-600 hover:underline"
                >
                  サンプルを読み込む
                </button>
              </div>

              {/* URL入力 */}
              {inputMode === "url" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.city.takaoka.toyama.jp/..."
                    className="w-full border rounded p-2"
                  />
                </div>
              )}

              {/* テキスト入力 */}
              {inputMode === "content" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    コンテンツ
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="ページのテキストを貼り付け..."
                    rows={12}
                    className="w-full border rounded p-2 font-mono text-sm"
                  />
                </div>
              )}

              {/* サービス名・自治体名 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    サービス名
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="住民票の写しの交付"
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    自治体名
                  </label>
                  <input
                    type="text"
                    value={municipalityName}
                    onChange={(e) => setMunicipalityName(e.target.value)}
                    placeholder="高岡市"
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "処理中..." : "構造化する"}
              </button>
            </form>
          </div>

          {/* 結果表示 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">結果</h2>
              {result?.success && result.blocks && (
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === "preview"
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    プレビュー
                  </button>
                  <button
                    onClick={() => setViewMode("blocks")}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === "blocks"
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    ブロック
                  </button>
                  <button
                    onClick={() => setViewMode("json")}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === "json"
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    JSON
                  </button>
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-2" />
                <p>LLMで構造化中...</p>
              </div>
            )}

            {result && !loading && (
              <>
                {result.success ? (
                  <div>
                    {/* サマリー */}
                    <div className="bg-blue-50 p-3 rounded mb-4">
                      <p className="text-sm font-medium text-blue-800">
                        概要
                      </p>
                      <p className="text-sm">{result.summary}</p>
                    </div>

                    {/* メタ情報 */}
                    <div className="text-sm text-gray-500 mb-4">
                      {result.blockCount}ブロック生成 /{" "}
                      {result.processingTimeMs}ms
                    </div>

                    {/* ビューモード別表示 */}
                    {viewMode === "blocks" && (
                      <div className="space-y-3">
                        {result.blocks?.map((block, i) => (
                          <BlockPreview key={block.id || i} block={block} />
                        ))}
                      </div>
                    )}

                    {viewMode === "json" && (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs max-h-96">
                        {JSON.stringify(result.blocks, null, 2)}
                      </pre>
                    )}

                    {viewMode === "preview" && result.blocks && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 text-xs text-gray-500 border-b">
                          DADSコンポーネントプレビュー
                        </div>
                        <div className="p-4 bg-white max-h-[600px] overflow-y-auto">
                          <BlockRenderer
                            blocks={result.blocks as Parameters<typeof BlockRenderer>[0]["blocks"]}
                            municipalityId="sample"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded">
                    <p className="font-medium text-red-800">{result.error}</p>
                    {result.details && (
                      <p className="text-sm text-red-600 mt-1">
                        {result.details}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {!result && !loading && (
              <p className="text-gray-400 text-center py-8">
                コンテンツを入力して「構造化する」をクリック
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: Block }) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<string, string> = {
    // ページ構造（青系）
    Title: "bg-blue-100 text-blue-800",
    Summary: "bg-blue-100 text-blue-800",
    Section: "bg-blue-100 text-blue-800",
    Breadcrumbs: "bg-blue-100 text-blue-800",
    // ナビゲーション（紫系）
    RelatedLinks: "bg-purple-100 text-purple-800",
    ResourceList: "bg-purple-100 text-purple-800",
    QuickLinks: "bg-purple-100 text-purple-800",
    // 手順・フロー（緑系）
    StepNavigation: "bg-green-100 text-green-800",
    // データ・リスト（黄系）
    Table: "bg-yellow-100 text-yellow-800",
    Accordion: "bg-orange-100 text-orange-800",
    DescriptionList: "bg-amber-100 text-amber-800",
    // 通知・警告（赤系）
    NotificationBanner: "bg-red-100 text-red-800",
    EmergencyBanner: "bg-red-200 text-red-900",
    // 連絡先・施設（シアン系）
    Contact: "bg-cyan-100 text-cyan-800",
    DirectoryList: "bg-cyan-100 text-cyan-800",
    ShelterList: "bg-cyan-100 text-cyan-800",
    HazardMapViewer: "bg-cyan-100 text-cyan-800",
    // カード（ピンク系）
    Card: "bg-pink-100 text-pink-800",
    CardGrid: "bg-pink-100 text-pink-800",
    InfoCard: "bg-pink-100 text-pink-800",
    InfoCardGrid: "bg-pink-100 text-pink-800",
    // トピック・ニュース（黄緑系）
    TopicGrid: "bg-lime-100 text-lime-800",
    TopicList: "bg-lime-100 text-lime-800",
    NewsList: "bg-lime-100 text-lime-800",
    NewsMeta: "bg-lime-100 text-lime-800",
    // アクション（インディゴ系）
    ActionButton: "bg-indigo-100 text-indigo-800",
    TaskButton: "bg-indigo-100 text-indigo-800",
    Attachments: "bg-indigo-100 text-indigo-800",
    // 地区・変数（茶系）
    DistrictSelector: "bg-stone-100 text-stone-800",
    // テキスト・引用（グレー系）
    RichText: "bg-gray-100 text-gray-800",
    Blockquote: "bg-slate-100 text-slate-800",
    StatusBadge: "bg-emerald-100 text-emerald-800",
    // ホームページ（深緑系）
    Hero: "bg-teal-100 text-teal-800",
    // 参照（グレー系）
    Sources: "bg-neutral-100 text-neutral-800",
  };

  const colorClass = typeColors[block.type] || "bg-gray-100 text-gray-800";

  // ブロックの概要を取得
  const getSummary = (): string => {
    const props = block.props;
    if (props.heading) return String(props.heading);
    if (props.title) return String(props.title);
    if (props.department) return `問い合わせ: ${props.department}`;
    if (props.label) return String(props.label); // StatusBadge
    if (props.content && typeof props.content === "string") {
      // Blockquote
      const text = String(props.content);
      return text.length > 30 ? text.slice(0, 30) + "..." : text;
    }
    if (props.term) return String(props.term); // DescriptionList item
    if (props.steps && Array.isArray(props.steps)) {
      return `${props.steps.length}ステップ`;
    }
    if (props.rows && Array.isArray(props.rows)) {
      return `${props.rows.length}行`;
    }
    if (props.items && Array.isArray(props.items)) {
      return `${props.items.length}項目`;
    }
    if (props.description) {
      const text = String(props.description);
      return text.length > 30 ? text.slice(0, 30) + "..." : text;
    }
    return "";
  };

  return (
    <div className="border rounded overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
      >
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
        >
          {block.type}
        </span>
        <span className="text-sm text-gray-700 flex-1">{getSummary()}</span>
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <pre className="bg-gray-50 p-2 text-xs overflow-x-auto border-t">
          {JSON.stringify(block.props, null, 2)}
        </pre>
      )}
    </div>
  );
}
