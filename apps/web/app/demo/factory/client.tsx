"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Municipality {
  id: string;
  name: string;
  prefecture: string;
  officialUrl: string;
}

interface SampleVariable {
  key: string;
  question: string;
  answer: string;
  category: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_TITLES: Record<Step, string> = {
  1: "既存サイトを見る",
  2: "テンプレートをクローン",
  3: "AIが情報を収集",
  4: "ドラフトを確認・承認",
  5: "完成ページを見る",
};

const STEP_DESCRIPTIONS: Record<Step, string> = {
  1: "現在の自治体Webサイトの状態を確認しましょう",
  2: "INNOMAの統一テンプレートをこの自治体用に複製します",
  3: "AIが既存サイトから自動的に情報を抽出します",
  4: "AIが集めた情報を人間が確認・承認します",
  5: "INNOMA式の完成ページを確認しましょう",
};

export function FactoryTourClient({
  municipality,
  sampleVariables,
}: {
  municipality: Municipality;
  sampleVariables: SampleVariable[];
}) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [step2Progress, setStep2Progress] = useState(0);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Collecting, setStep3Collecting] = useState(false);
  const [step3CollectedCount, setStep3CollectedCount] = useState(0);
  const [step3Done, setStep3Done] = useState(false);
  const [step4Approved, setStep4Approved] = useState<Set<number>>(new Set());
  const [step4AllApproved, setStep4AllApproved] = useState(false);

  // Step 2: クローンアニメーション
  const startClone = useCallback(() => {
    setStep2Progress(0);
    const interval = setInterval(() => {
      setStep2Progress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep2Done(true);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  }, []);

  // Step 3: AI収集シミュレーション
  const startCollection = useCallback(() => {
    setStep3Collecting(true);
    setStep3CollectedCount(0);
    let count = 0;
    const maxCount = sampleVariables.length;
    const interval = setInterval(() => {
      count++;
      setStep3CollectedCount(count);
      if (count >= maxCount) {
        clearInterval(interval);
        setStep3Done(true);
      }
    }, 800);
  }, [sampleVariables.length]);

  // Step 4: 承認
  const toggleApproval = useCallback(
    (index: number) => {
      setStep4Approved((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    []
  );

  // Step 4: 全承認チェック
  useEffect(() => {
    setStep4AllApproved(step4Approved.size >= sampleVariables.length);
  }, [step4Approved, sampleVariables.length]);

  const goNext = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  }, [currentStep]);

  const approveAll = useCallback(() => {
    const all = new Set<number>();
    sampleVariables.forEach((_, i) => all.add(i));
    setStep4Approved(all);
  }, [sampleVariables]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/demo"
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2 text-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            トップへ戻る
          </Link>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            イノマ工場見学
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 py-6 max-w-5xl mx-auto w-full">
        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3, 4, 5] as Step[]).map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === currentStep
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110"
                    : step < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {step < currentStep ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {step < 5 && (
                <div
                  className={`w-8 md:w-16 h-1 mx-1 rounded ${
                    step < currentStep ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ステップタイトル */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Step {currentStep}: {STEP_TITLES[currentStep]}
          </h2>
          <p className="text-gray-500 mt-1">
            {STEP_DESCRIPTIONS[currentStep]}
          </p>
        </div>

        {/* ステップコンテンツ */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          {/* Step 1: 既存サイトを見る */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <h3 className="font-bold text-orange-700 mb-2">
                  {municipality.prefecture} {municipality.name} の公式サイト
                </h3>
                <p className="text-sm text-orange-600 mb-4">
                  一般的な自治体サイトは、情報量が多く、必要な情報にたどり着くのが難しいことがあります。
                </p>
                <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden">
                  <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-400 truncate">
                      {municipality.officialUrl}
                    </div>
                  </div>
                  <iframe
                    src={municipality.officialUrl}
                    className="w-full h-[400px] border-0"
                    sandbox="allow-same-origin allow-scripts"
                    title={`${municipality.name}公式サイト`}
                  />
                </div>
                <div className="mt-3 text-center">
                  <a
                    href={municipality.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-500 hover:text-orange-700 inline-flex items-center gap-1"
                  >
                    別タブで確認する
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-2">
                  よくある課題
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">&#x2717;</span>
                    どこに何があるかわからない複雑なメニュー構造
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">&#x2717;</span>
                    PDF添付だけで内容がわからないページ
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">&#x2717;</span>
                    自治体ごとにバラバラなデザイン・構成
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">&#x2717;</span>
                    スマートフォン対応が不十分
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: テンプレートをクローン */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                <h3 className="font-bold text-purple-700 mb-2">
                  INNOMA統一テンプレート
                </h3>
                <p className="text-sm text-purple-600 mb-4">
                  デジタル庁のデザインシステムに準拠した、全自治体共通のテンプレートを用意しています。
                  住民票、戸籍、国民健康保険、児童手当、介護保険...あらゆる行政サービスのページが整備されています。
                </p>

                {/* テンプレートカード群 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    "住民票",
                    "戸籍",
                    "印鑑登録",
                    "転入届",
                    "国保",
                    "介護保険",
                    "児童手当",
                    "ごみ収集",
                    "住民税",
                    "固定資産税",
                    "防災情報",
                    "マイナンバー",
                  ].map((name) => (
                    <div
                      key={name}
                      className="bg-white rounded-lg p-3 border border-purple-100 text-center text-sm font-medium text-purple-700"
                    >
                      {name}
                    </div>
                  ))}
                </div>

                {/* クローンボタン&プログレス */}
                {!step2Done ? (
                  <div className="text-center space-y-4">
                    {step2Progress === 0 ? (
                      <button
                        onClick={startClone}
                        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        {municipality.name}用にクローンする
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-full bg-purple-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-100"
                            style={{ width: `${step2Progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-purple-500">
                          テンプレートをクローン中... {step2Progress}%
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                    <div className="text-green-500 text-3xl mb-2">&#x2713;</div>
                    <p className="font-bold text-green-700">
                      {municipality.name}用テンプレートの準備完了！
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      12カテゴリ・40ページ以上のテンプレートがクローンされました
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-2">
                  テンプレートの特徴
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#x2713;</span>
                    GOV.UK式のフラットなURL構造
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#x2713;</span>
                    デジタル庁デザインシステム（DADS）準拠
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#x2713;</span>
                    JIS X 8341-3:2016 アクセシビリティ対応
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">&#x2713;</span>
                    343以上の変数で自治体ごとにカスタマイズ可能
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 3: AIが情報を収集 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="font-bold text-blue-700 mb-2">
                  AI自動情報収集
                </h3>
                <p className="text-sm text-blue-600 mb-4">
                  Google Gemini + Brave
                  Searchを使って、既存サイトから情報を自動抽出します。
                  電話番号、手数料、窓口情報、手続き方法などを自動的に見つけ出します。
                </p>

                {!step3Collecting && !step3Done ? (
                  <div className="text-center">
                    <button
                      onClick={startCollection}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      AI情報収集を開始
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sampleVariables.map((v, i) => (
                      <div
                        key={v.key}
                        className={`flex items-center gap-3 bg-white rounded-xl p-3 border transition-all duration-500 ${
                          i < step3CollectedCount
                            ? "border-green-200 opacity-100"
                            : "border-gray-100 opacity-30"
                        }`}
                      >
                        {/* ステータス */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          {i < step3CollectedCount ? (
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </div>
                          ) : i === step3CollectedCount && step3Collecting ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center animate-spin">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100" />
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {v.question.replace(
                              `${municipality.name}の`,
                              ""
                            )}
                          </p>
                          {i < step3CollectedCount && (
                            <p className="text-sm text-green-600 font-bold">
                              {v.answer}
                            </p>
                          )}
                        </div>

                        {/* カテゴリタグ */}
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">
                          {v.category}
                        </span>
                      </div>
                    ))}

                    {step3Done && (
                      <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200 mt-4">
                        <div className="text-green-500 text-3xl mb-2">
                          &#x2713;
                        </div>
                        <p className="font-bold text-green-700">
                          情報収集完了！
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          {sampleVariables.length}
                          件の情報を自動抽出しました
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-2">
                  収集プロセス
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                  <span className="bg-white px-3 py-1 rounded-full border">
                    検索クエリ生成
                  </span>
                  <span className="text-gray-300">&rarr;</span>
                  <span className="bg-white px-3 py-1 rounded-full border">
                    Web検索
                  </span>
                  <span className="text-gray-300">&rarr;</span>
                  <span className="bg-white px-3 py-1 rounded-full border">
                    ページ取得
                  </span>
                  <span className="text-gray-300">&rarr;</span>
                  <span className="bg-white px-3 py-1 rounded-full border">
                    情報抽出
                  </span>
                  <span className="text-gray-300">&rarr;</span>
                  <span className="bg-white px-3 py-1 rounded-full border">
                    検証
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: ドラフトを確認・承認 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                <h3 className="font-bold text-amber-700 mb-2">
                  ドラフト確認・承認
                </h3>
                <p className="text-sm text-amber-600 mb-4">
                  AIが集めた情報は、必ず人間が確認します。
                  正確性に問題がなければ承認し、間違いがあれば修正できます。
                </p>

                <div className="space-y-3">
                  {sampleVariables.map((v, i) => (
                    <div
                      key={v.key}
                      className={`flex items-center gap-3 bg-white rounded-xl p-3 border transition-all ${
                        step4Approved.has(i)
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <button
                        onClick={() => toggleApproval(i)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          step4Approved.has(i)
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-green-400"
                        }`}
                      >
                        {step4Approved.has(i) && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">
                          {v.question.replace(`${municipality.name}の`, "")}
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          {v.answer}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-500 rounded-full flex-shrink-0">
                        AI取得
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={approveAll}
                    className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors text-sm"
                  >
                    すべて承認
                  </button>
                </div>

                {step4AllApproved && (
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200 mt-4">
                    <div className="text-green-500 text-3xl mb-2">&#x2713;</div>
                    <p className="font-bold text-green-700">
                      すべてのドラフトが承認されました！
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      変数がテンプレートに反映されます
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-2">
                  承認ワークフロー
                </h4>
                <p className="text-sm text-gray-600">
                  AIの出力は常に人間が確認します。信頼度が低い情報は自動的にフラグが立ち、
                  手動確認が促されます。承認後、テンプレートの変数に値が反映されます。
                </p>
              </div>
            </div>
          )}

          {/* Step 5: 完成ページを見る */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 className="font-bold text-green-700 mb-2">
                  完成！INNOMA式ページ
                </h3>
                <p className="text-sm text-green-600 mb-4">
                  テンプレート + AIが集めた情報が組み合わさり、
                  統一デザインの市民向けページが完成しました。
                </p>

                {/* Before / After 比較 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-center text-sm font-bold text-orange-500 mb-2">
                      Before（既存サイト）
                    </p>
                    <div className="bg-white rounded-xl border-2 border-orange-200 overflow-hidden">
                      <iframe
                        src={municipality.officialUrl}
                        className="w-full h-[300px] border-0"
                        sandbox="allow-same-origin allow-scripts"
                        title="Before"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-center text-sm font-bold text-blue-500 mb-2">
                      After（INNOMA）
                    </p>
                    <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
                      <iframe
                        src={`/${municipality.id}`}
                        className="w-full h-[300px] border-0"
                        title="After"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <a
                    href={`/${municipality.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                  >
                    INNOMA版サイトを別タブで見る
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h4 className="font-bold text-purple-700 mb-3">
                  INNOMAの成果
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-purple-600">
                      40+
                    </p>
                    <p className="text-xs text-gray-500">ページ数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-purple-600">
                      343
                    </p>
                    <p className="text-xs text-gray-500">変数数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-purple-600">
                      15
                    </p>
                    <p className="text-xs text-gray-500">
                      サービスカテゴリ
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-purple-600">
                      25+
                    </p>
                    <p className="text-xs text-gray-500">対応自治体</p>
                  </div>
                </div>
              </div>

              {/* トップへ戻る */}
              <div className="text-center">
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  トップへ戻る
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            前へ
          </button>

          <span className="text-sm text-gray-400">
            {currentStep} / 5
          </span>

          <button
            onClick={goNext}
            disabled={currentStep === 5}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center gap-2"
          >
            次へ
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
