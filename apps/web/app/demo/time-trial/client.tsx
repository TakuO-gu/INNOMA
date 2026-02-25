"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { QuizQuestion } from "@/lib/demo/quiz-data";

interface SlotData {
  municipalities: { id: string; name: string; prefecture: string }[];
  categories: string[];
}

type Phase =
  | "idle" // スロット待ち
  | "spinning" // スロット回転中
  | "ready" // 問題決定、開始前
  | "search-existing" // 既存サイトで検索中
  | "search-innoma" // INNOMAサイトで検索中
  | "result"; // 結果表示

export function TimeTrialClient({
  questions,
  slotData,
}: {
  questions: QuizQuestion[];
  slotData: SlotData;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [slotMunicipalityIndex, setSlotMunicipalityIndex] = useState(0);
  const [slotCategoryIndex, setSlotCategoryIndex] = useState(0);
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);

  // タイマー
  const [existingTime, setExistingTime] = useState(0);
  const [innomaTime, setInnomaTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // iframe
  const [iframeError, setIframeError] = useState(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer effect for search phases
  useEffect(() => {
    if (phase === "search-existing" || phase === "search-innoma") {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (phase === "search-existing") {
          setExistingTime(elapsed);
        } else {
          setInnomaTime(elapsed);
        }
      }, 50);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [phase]);

  // スロット回転開始
  const spin = useCallback(() => {
    if (questions.length === 0) return;

    setPhase("spinning");
    setIsSlotSpinning(true);
    setIframeError(false);
    setExistingTime(0);
    setInnomaTime(0);

    // スロットアニメーション
    let count = 0;
    const maxCount = 30;
    const interval = setInterval(() => {
      setSlotMunicipalityIndex(
        Math.floor(Math.random() * slotData.municipalities.length)
      );
      setSlotCategoryIndex(
        Math.floor(Math.random() * slotData.categories.length)
      );
      count++;

      if (count >= maxCount) {
        clearInterval(interval);

        // ランダムに問題を選択
        const q = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(q);

        // スロットを正解の位置に合わせる
        const mIdx = slotData.municipalities.findIndex(
          (m) => m.id === q.municipalityId
        );
        const cIdx = slotData.categories.indexOf(q.category);
        setSlotMunicipalityIndex(mIdx >= 0 ? mIdx : 0);
        setSlotCategoryIndex(cIdx >= 0 ? cIdx : 0);
        setIsSlotSpinning(false);
        setPhase("ready");
      }
    }, 80);
  }, [questions, slotData]);

  // 既存サイト検索開始
  const startExistingSearch = useCallback(() => {
    setPhase("search-existing");
  }, []);

  // 既存サイト「見つけた！」
  const foundOnExisting = useCallback(() => {
    stopTimer();
    setPhase("search-innoma");
  }, [stopTimer]);

  // INNOMA「見つけた！」
  const foundOnInnoma = useCallback(() => {
    stopTimer();
    setPhase("result");
  }, [stopTimer]);

  // 最初からやり直す
  const reset = useCallback(() => {
    stopTimer();
    setPhase("idle");
    setCurrentQuestion(null);
    setExistingTime(0);
    setInnomaTime(0);
    setIframeError(false);
  }, [stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
    }
    return `${secs}.${ms}秒`;
  };

  const timeDiff =
    existingTime > 0 && innomaTime > 0
      ? ((existingTime - innomaTime) / existingTime) * 100
      : 0;

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
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            情報探しタイムトライアル
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* スロットマシン */}
        {(phase === "idle" || phase === "spinning" || phase === "ready") && (
          <div className="w-full max-w-2xl">
            {/* スロットUI */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <h2 className="text-center text-2xl font-bold text-gray-700 mb-6">
                {phase === "idle"
                  ? "スロットを回して出題！"
                  : phase === "spinning"
                    ? "抽選中..."
                    : "問題が決まりました！"}
              </h2>

              {/* スロットリール */}
              <div className="flex items-center gap-4 justify-center mb-8">
                {/* 自治体リール */}
                <div className="relative w-40 h-16 bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl border-2 border-gray-300 overflow-hidden">
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800 ${
                      isSlotSpinning ? "animate-pulse" : ""
                    }`}
                  >
                    {slotData.municipalities[slotMunicipalityIndex]?.name ||
                      "---"}
                  </div>
                  {isSlotSpinning && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60 pointer-events-none" />
                  )}
                </div>

                <span className="text-2xl text-gray-400 font-bold">×</span>

                {/* カテゴリリール */}
                <div className="relative w-32 h-16 bg-gradient-to-b from-gray-100 to-gray-50 rounded-xl border-2 border-gray-300 overflow-hidden">
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800 ${
                      isSlotSpinning ? "animate-pulse" : ""
                    }`}
                  >
                    {slotData.categories[slotCategoryIndex] || "---"}
                  </div>
                  {isSlotSpinning && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* スピンボタン or 問題表示 */}
              {phase === "idle" && (
                <div className="text-center">
                  <button
                    onClick={spin}
                    disabled={questions.length === 0}
                    className="px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SPIN!
                  </button>
                  {questions.length === 0 && (
                    <p className="text-red-400 text-sm mt-3">
                      クイズデータがありません
                    </p>
                  )}
                </div>
              )}

              {phase === "spinning" && (
                <div className="text-center">
                  <div className="inline-block px-10 py-4 bg-gray-300 text-white text-xl font-bold rounded-2xl">
                    回転中...
                  </div>
                </div>
              )}

              {phase === "ready" && currentQuestion && (
                <div className="space-y-6">
                  {/* 問題文 */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <p className="text-sm text-blue-500 font-bold mb-2">
                      ミッション
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {currentQuestion.question}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {currentQuestion.prefecture}{" "}
                      {currentQuestion.municipalityName}
                    </p>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={startExistingSearch}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      スタート！まず既存サイトで探そう
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 既存サイト検索フェーズ */}
        {phase === "search-existing" && currentQuestion && (
          <div className="w-full max-w-6xl flex-1 flex flex-col">
            {/* 問題 & タイマー */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-orange-500 font-bold">
                  Phase 1: 既存サイトで探そう
                </p>
                <p className="text-lg font-bold text-gray-800 truncate">
                  {currentQuestion.question}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-orange-600 tabular-nums">
                  {formatTime(existingTime)}
                </div>
              </div>
            </div>

            {/* サイト表示エリア */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
              <div className="bg-orange-50 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">
                  {currentQuestion.municipalityName}公式サイト
                </span>
                <a
                  href={currentQuestion.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-500 hover:text-orange-700 flex items-center gap-1"
                >
                  別タブで開く
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
              <div className="flex-1 relative">
                {!iframeError ? (
                  <iframe
                    src={currentQuestion.officialUrl}
                    className="w-full h-full min-h-[460px] border-0"
                    onError={() => setIframeError(true)}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    title={`${currentQuestion.municipalityName}公式サイト`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[460px] bg-gray-50 gap-4">
                    <p className="text-gray-500">
                      iframe表示がブロックされています
                    </p>
                    <a
                      href={currentQuestion.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                      別タブで公式サイトを開く
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
                    <p className="text-sm text-gray-400">
                      タイマーは動いています。情報を見つけたら下のボタンを押してください
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 見つけた！ボタン */}
            <div className="mt-4 text-center">
              <button
                onClick={foundOnExisting}
                className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                見つけた！
              </button>
              <p className="text-sm text-gray-400 mt-2">
                答え: 「{currentQuestion.answer}」を見つけたらクリック
              </p>
            </div>
          </div>
        )}

        {/* INNOMA検索フェーズ */}
        {phase === "search-innoma" && currentQuestion && (
          <div className="w-full max-w-6xl flex-1 flex flex-col">
            {/* 途中経過 */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-500 font-bold">
                    Phase 2: 今度はINNOMAで探そう！
                  </p>
                  <p className="text-lg font-bold text-gray-800 truncate">
                    {currentQuestion.question}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    既存サイト: {formatTime(existingTime)}
                  </div>
                  <div className="text-3xl font-mono font-bold text-blue-600 tabular-nums">
                    {formatTime(innomaTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* INNOMAサイト表示 */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
              <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  INNOMA - {currentQuestion.municipalityName}
                </span>
                <a
                  href={`/${currentQuestion.municipalityId}${currentQuestion.innomaPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  別タブで開く
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
              <div className="flex-1">
                <iframe
                  src={`/${currentQuestion.municipalityId}${currentQuestion.innomaPath}`}
                  className="w-full h-full min-h-[460px] border-0"
                  title={`INNOMA ${currentQuestion.municipalityName}`}
                />
              </div>
            </div>

            {/* 見つけた！ボタン */}
            <div className="mt-4 text-center">
              <button
                onClick={foundOnInnoma}
                className="px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                見つけた！
              </button>
              <p className="text-sm text-gray-400 mt-2">
                答え: 「{currentQuestion.answer}」を見つけたらクリック
              </p>
            </div>
          </div>
        )}

        {/* 結果画面 */}
        {phase === "result" && currentQuestion && (
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-center text-3xl font-black text-gray-800 mb-2">
                結果発表
              </h2>
              <p className="text-center text-gray-400 mb-8">
                {currentQuestion.question}
              </p>

              {/* タイム比較 */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* 既存サイト */}
                <div className="bg-orange-50 rounded-2xl p-6 text-center border-2 border-orange-200">
                  <p className="text-sm font-bold text-orange-500 mb-2">
                    既存サイト
                  </p>
                  <p className="text-4xl font-mono font-black text-orange-600 tabular-nums">
                    {formatTime(existingTime)}
                  </p>
                </div>

                {/* INNOMA */}
                <div className="bg-blue-50 rounded-2xl p-6 text-center border-2 border-blue-200">
                  <p className="text-sm font-bold text-blue-500 mb-2">
                    INNOMA
                  </p>
                  <p className="text-4xl font-mono font-black text-blue-600 tabular-nums">
                    {formatTime(innomaTime)}
                  </p>
                </div>
              </div>

              {/* 差分表示 */}
              {timeDiff > 0 ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 text-center border-2 border-green-200 mb-8">
                  <p className="text-lg text-green-600 font-bold">
                    INNOMAなら
                  </p>
                  <p className="text-5xl font-black text-green-600 my-2">
                    {Math.round(timeDiff)}%
                  </p>
                  <p className="text-lg text-green-600 font-bold">
                    時間短縮！
                  </p>
                </div>
              ) : timeDiff < 0 ? (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 text-center border-2 border-yellow-200 mb-8">
                  <p className="text-lg text-yellow-600 font-bold">
                    今回は既存サイトの方が速かった！
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    慣れたサイトは速いかも。でもINNOMAなら誰でも迷わない設計です
                  </p>
                </div>
              ) : null}

              {/* 正解表示 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-8 text-center">
                <p className="text-sm text-gray-400">正解</p>
                <p className="text-2xl font-bold text-gray-800">
                  {currentQuestion.answer}
                </p>
              </div>

              {/* アクション */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  もう一回！
                </button>
                <Link
                  href="/demo"
                  className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  トップへ戻る
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
