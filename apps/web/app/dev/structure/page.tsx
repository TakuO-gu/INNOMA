"use client";

import { useState, useEffect } from "react";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { TEXT_LENGTH_THRESHOLD } from "@/lib/llm/text-length-rules";

type ContentType = "service" | "guide" | "answer";

interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

interface LongTextInfo {
  blockIndex: number;
  blockId: string;
  blockType: string;
  nodeIndex: number;
  nodeType: string;
  text: string;
  itemIndex?: number;
  rowIndex?: number;
}

interface PassInfo {
  initialBlockCount: number;
  pass1BlockCount: number;
  pass1LongTextCount: number;
  pass1LongTexts: LongTextInfo[];
  pass2BlockCount: number;
  pass2LongTextCount: number;
  pass2LongTexts: LongTextInfo[];
  initialBlocks: Block[];
  pass1Blocks: Block[];
  pass2Blocks: Block[];
}

interface StructureResult {
  success: boolean;
  sourceUrl?: string;
  contentType?: ContentType;
  summary?: string;
  blocks?: Block[];
  blockCount?: number;
  processingTimeMs?: number;
  error?: string;
  details?: string;
  passInfo?: PassInfo;
}

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; description: string; color: string }> = {
  service: {
    label: "Service",
    description: "行動させる",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  guide: {
    label: "Guide",
    description: "理解させる",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  answer: {
    label: "Answer",
    description: "判定する",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
};

export default function StructurePage() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [municipalityName, setMunicipalityName] = useState("高岡市");
  const [contentType, setContentType] = useState<ContentType>("guide");
  const [inputMode, setInputMode] = useState<"url" | "content">("content");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructureResult | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "blocks" | "json" | "pass">("preview");
  const [fullscreen, setFullscreen] = useState(false);

  // ESCキーで全画面を閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const body =
        inputMode === "url"
          ? { url, serviceName, municipalityName, contentType }
          : { content, serviceName, municipalityName, contentType };

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

  // サンプルコンテンツ（Service用）
  const sampleServiceContent = `住民票の写しの交付

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

注意事項
本人以外の方が申請する場合は委任状が必要です。

関連サービス
・印鑑登録証明書の交付
・戸籍謄本の交付`;

  // サンプルコンテンツ（Guide用）
  const sampleGuideContent = `児童手当

児童手当とは
子育て世帯の生活の安定と、次代を担う児童の健全な育成を目的とした国の制度です。

受け取れる人
・市内に住所がある
・18歳の年度末までのお子さんを養育している
・公務員ではない（公務員は勤務先から支給）

いくら受け取れるか
お子さんの年齢と人数で決まります。
・3歳未満：月15,000円（第3子以降は30,000円）
・3歳以上：月10,000円（第3子以降は30,000円）

いつ届くか
年6回、偶数月の10日に届きます（2月・4月・6月・8月・10月・12月）。

申請が必要なとき
・お子さんが生まれたとき
・他の市区町村から転入したとき
・公務員でなくなったとき

注意
申請が遅れると、受け取れない月が発生します。15日以内に申請してください。

問い合わせ先
子育て支援課
電話：03-1234-5720
受付時間：平日 8:30〜17:15`;

  // サンプルコンテンツ（Answer用）
  const sampleAnswerContent = `児童手当の対象者判定

対象条件
・18歳の年度末（3月31日）までのお子さんを養育している
・市内に住民登録がある
・公務員以外である（公務員は勤務先から支給）

対象外のケース
・お子さんが18歳の年度末を過ぎている
・住民登録が他の市区町村にある（住民登録のある市区町村で申請）
・公務員である（勤務先の担当部署で手続き）

結果
・すべての条件を満たす → 受け取れます。申請手続きを開始してください。
・住民登録が他市区町村 → 住民登録のある市区町村で申請してください。
・公務員 → 勤務先で申請してください。
・年齢条件を満たさない → 受け取れません。`;

  const loadSample = (type: ContentType) => {
    setContentType(type);
    setInputMode("content");

    switch (type) {
      case "service":
        setContent(sampleServiceContent);
        setServiceName("住民票の写しを請求する");
        break;
      case "guide":
        setContent(sampleGuideContent);
        setServiceName("児童手当");
        break;
      case "answer":
        setContent(sampleAnswerContent);
        setServiceName("児童手当を受け取れますか？");
        break;
    }
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
              {/* ページタイプ選択 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">ページタイプ</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CONTENT_TYPE_INFO) as ContentType[]).map((type) => {
                    const info = CONTENT_TYPE_INFO[type];
                    const isSelected = contentType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContentType(type)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${info.color} border-current`
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`font-medium ${isSelected ? "" : "text-gray-700"}`}>
                          {info.label}
                        </div>
                        <div className={`text-xs ${isSelected ? "" : "text-gray-500"}`}>
                          {info.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => loadSample("service")}
                    className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                  >
                    Service例
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample("guide")}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                  >
                    Guide例
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSample("answer")}
                    className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                  >
                    Answer例
                  </button>
                </div>
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
                    placeholder={
                      contentType === "service" ? "〜を申請する" :
                      contentType === "guide" ? "制度名" :
                      "〜ですか？"
                    }
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
                  {result?.passInfo && (
                    <button
                      onClick={() => setViewMode("pass")}
                      className={`px-3 py-1 text-sm rounded ${
                        viewMode === "pass"
                          ? "bg-white shadow text-orange-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Pass詳細
                    </button>
                  )}
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
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      {result.contentType && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            CONTENT_TYPE_INFO[result.contentType].color
                          }`}
                        >
                          {CONTENT_TYPE_INFO[result.contentType].label}
                        </span>
                      )}
                      <span>
                        {result.blockCount}ブロック / {result.processingTimeMs}ms
                      </span>
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
                        <div className="bg-gray-100 px-3 py-2 text-xs text-gray-500 border-b flex items-center justify-between">
                          <span>DADSコンポーネントプレビュー</span>
                          <button
                            onClick={() => setFullscreen(true)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="全画面表示"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-4 bg-white max-h-[600px] overflow-y-auto">
                          <BlockRenderer
                            blocks={result.blocks as Parameters<typeof BlockRenderer>[0]["blocks"]}
                            municipalityId="sample"
                          />
                        </div>
                      </div>
                    )}

                    {viewMode === "pass" && result.passInfo && (
                      <PassInfoView passInfo={result.passInfo} />
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

      {/* 全画面プレビューモーダル */}
      {fullscreen && result?.blocks && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <h2 className="font-medium">プレビュー</h2>
                {result.contentType && (
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      CONTENT_TYPE_INFO[result.contentType].color
                    }`}
                  >
                    {CONTENT_TYPE_INFO[result.contentType].label}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {serviceName} - {municipalityName}
                </span>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="閉じる"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto py-8 px-4">
                <BlockRenderer
                  blocks={result.blocks as Parameters<typeof BlockRenderer>[0]["blocks"]}
                  municipalityId="sample"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Pass情報の表示コンポーネント
 */
function PassInfoView({ passInfo }: { passInfo: PassInfo }) {
  const [selectedPass, setSelectedPass] = useState<"initial" | "pass1" | "pass2">("pass1");

  const getBlocks = () => {
    switch (selectedPass) {
      case "initial":
        return passInfo.initialBlocks;
      case "pass1":
        return passInfo.pass1Blocks;
      case "pass2":
        return passInfo.pass2Blocks;
    }
  };

  const getLongTexts = () => {
    switch (selectedPass) {
      case "initial":
        return [];
      case "pass1":
        return passInfo.pass1LongTexts;
      case "pass2":
        return passInfo.pass2LongTexts;
    }
  };

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs text-gray-500">Initial</p>
          <p className="text-lg font-bold">{passInfo.initialBlockCount} blocks</p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-xs text-orange-600">Pass 1 (Pattern)</p>
          <p className="text-lg font-bold">{passInfo.pass1BlockCount} blocks</p>
          <p className="text-xs text-orange-500">{passInfo.pass1LongTextCount} long texts</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-xs text-green-600">Pass 2 (LLM)</p>
          <p className="text-lg font-bold">{passInfo.pass2BlockCount} blocks</p>
          <p className="text-xs text-green-500">{passInfo.pass2LongTextCount} remaining</p>
        </div>
      </div>

      {/* Pass選択タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSelectedPass("initial")}
          className={`flex-1 px-3 py-1 text-sm rounded ${
            selectedPass === "initial"
              ? "bg-white shadow text-gray-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Initial ({passInfo.initialBlockCount})
        </button>
        <button
          onClick={() => setSelectedPass("pass1")}
          className={`flex-1 px-3 py-1 text-sm rounded ${
            selectedPass === "pass1"
              ? "bg-white shadow text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pass 1 ({passInfo.pass1BlockCount})
        </button>
        <button
          onClick={() => setSelectedPass("pass2")}
          className={`flex-1 px-3 py-1 text-sm rounded ${
            selectedPass === "pass2"
              ? "bg-white shadow text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pass 2 ({passInfo.pass2BlockCount})
        </button>
      </div>

      {/* 長いテキスト一覧 */}
      {getLongTexts().length > 0 && (
        <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            {TEXT_LENGTH_THRESHOLD}文字超えテキスト ({getLongTexts().length}件)
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {getLongTexts().map((lt, i) => (
              <div key={i} className="bg-white p-2 rounded text-xs">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <span className="font-medium">{lt.blockType}</span>
                  <span className="text-gray-400">→</span>
                  <span>{lt.nodeType}</span>
                  <span className="text-gray-400">({lt.text.length}文字)</span>
                </div>
                <p className="text-gray-700 truncate">{lt.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ブロック一覧 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 text-xs text-gray-500 border-b">
          {selectedPass === "initial" ? "Initial Blocks" : selectedPass === "pass1" ? "Pass 1 Blocks" : "Pass 2 Blocks"}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {getBlocks().map((block, i) => (
            <BlockPreview key={block.id || i} block={block} />
          ))}
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
    // SmartAnswer（紫系）
    SmartAnswer: "bg-violet-100 text-violet-800",
  };

  const colorClass = typeColors[block.type] || "bg-gray-100 text-gray-800";

  // ブロックの概要を取得
  const getSummary = (): string => {
    const props = block.props;
    if (props.heading) return String(props.heading);
    if (props.title) return String(props.title);
    if (props.text) return String(props.text).slice(0, 40) + (String(props.text).length > 40 ? "..." : "");
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
    if (props.questions && Array.isArray(props.questions)) {
      return `${props.questions.length}問 → ${(props.results as unknown[])?.length || 0}結果`;
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
