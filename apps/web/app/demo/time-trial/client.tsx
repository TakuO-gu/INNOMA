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
  | "waiting" // フルスクリーン解除待ち（esc長押し完了後）
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
    setExistingTime(0);
    setInnomaTime(0);

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

        const q = questions[Math.floor(Math.random() * questions.length)];
        setCurrentQuestion(q);

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

  // 公式サイトポップアップウィンドウ
  const officialWindowRef = useRef<Window | null>(null);

  const closeSplitWindows = useCallback(() => {
    if (officialWindowRef.current && !officialWindowRef.current.closed) {
      officialWindowRef.current.close();
    }
    officialWindowRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      closeSplitWindows();
    };
  }, [closeSplitWindows]);

  // Escキー長押しスタート
  const [escProgress, setEscProgress] = useState(0); // 0〜100
  const escStartRef = useRef<number | null>(null);
  const escRafRef = useRef<number | null>(null);
  const startExistingSearchRef = useRef<(() => void) | null>(null);

  const ESC_HOLD_MS = 1500; // 長押し時間

  // Phase 1 開始: 公式サイトをポップアップで開き、メインタブにタスクパネルを表示
  // ※ 役割を逆にする: ユーザーが操作するのはポップアップ（公式サイト）で、
  //   メインタブ（タスクパネル）は裏に回らないので常にアクセス可能
  const startExistingSearch = useCallback(() => {
    if (!currentQuestion) return;

    const screenW = window.screen.availWidth;
    const screenH = window.screen.availHeight;
    // 公式サイトを画面の左半分にポップアップで開く（右側にタスクパネルを並べる）
    const popupW = Math.round(screenW / 2);
    const officialWin = window.open(
      currentQuestion.officialUrl,
      "innoma-official",
      `popup=yes,width=${popupW},height=${screenH},left=0,top=0`
    );
    if (officialWin) {
      officialWindowRef.current = officialWin;
    }

    // Phase 遷移（タイマー開始）
    setPhase("search-existing");
  }, [currentQuestion]);

  // waiting phase: フルスクリーン解除後に少し待ってからポップアップ＋タイマー開始
  const WAIT_AFTER_ESC_MS = 1500;
  const [waitCountdown, setWaitCountdown] = useState(0); // 0〜100

  useEffect(() => {
    if (phase !== "waiting") return;

    const start = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / WAIT_AFTER_ESC_MS) * 100, 100);
      setWaitCountdown(progress);
      if (progress >= 100) {
        // 待機完了 → ポップアップを開いてタイマー開始
        startExistingSearchRef.current?.();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      setWaitCountdown(0);
    };
  }, [phase]);

  // Escキー長押しスタートのeffect
  useEffect(() => {
    startExistingSearchRef.current = startExistingSearch;
  }, [startExistingSearch]);

  useEffect(() => {
    if (phase !== "ready") return;

    const updateProgress = () => {
      if (escStartRef.current === null) return;
      const elapsed = Date.now() - escStartRef.current;
      const progress = Math.min((elapsed / ESC_HOLD_MS) * 100, 100);
      setEscProgress(progress);
      if (progress >= 100) {
        // 長押し完了 → waiting phaseに移行（フルスクリーン解除を待つ）
        escStartRef.current = null;
        escRafRef.current = null;
        setEscProgress(0);
        setPhase("waiting");
      } else {
        escRafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && escStartRef.current === null) {
        e.preventDefault();
        escStartRef.current = Date.now();
        escRafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        escStartRef.current = null;
        if (escRafRef.current) {
          cancelAnimationFrame(escRafRef.current);
          escRafRef.current = null;
        }
        setEscProgress(0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (escRafRef.current) {
        cancelAnimationFrame(escRafRef.current);
      }
      escStartRef.current = null;
      setEscProgress(0);
    };
  }, [phase, ESC_HOLD_MS]);

  // 既存サイト「見つけた！」（元タブのフォールバック用）
  const foundOnExisting = useCallback(() => {
    stopTimer();
    closeSplitWindows();
    setPhase("search-innoma");
  }, [stopTimer, closeSplitWindows]);

  // INNOMA「見つけた！」
  const foundOnInnoma = useCallback(() => {
    stopTimer();
    setPhase("result");
  }, [stopTimer]);

  // 最初からやり直す
  const reset = useCallback(() => {
    stopTimer();
    closeSplitWindows();
    setPhase("idle");
    setCurrentQuestion(null);
    setExistingTime(0);
    setInnomaTime(0);
  }, [stopTimer, closeSplitWindows]);

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
        {(phase === "idle" || phase === "spinning" || phase === "ready" || phase === "waiting") && (
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <h2 className="text-center text-2xl font-bold text-gray-700 mb-6">
                {phase === "idle"
                  ? "スロットを回して出題！"
                  : phase === "spinning"
                    ? "抽選中..."
                    : phase === "waiting"
                      ? "準備中..."
                      : "問題が決まりました！"}
              </h2>

              {/* スロットリール */}
              <div className="flex items-center gap-4 justify-center mb-8">
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

                  {/* Escキー長押しスタート */}
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="relative w-48 h-48 mx-auto">
                        {/* 円形プログレス */}
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50" cy="50" r="44"
                            fill="none" stroke="#f3f4f6" strokeWidth="6"
                          />
                          <circle
                            cx="50" cy="50" r="44"
                            fill="none"
                            stroke="url(#esc-gradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 44}`}
                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - escProgress / 100)}`}
                            className="transition-none"
                          />
                          <defs>
                            <linearGradient id="esc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* 中央のescキー表示 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`w-16 h-10 rounded-lg border-2 flex items-center justify-center mb-2 transition-all ${
                            escProgress > 0
                              ? "bg-orange-500 border-orange-600 scale-95"
                              : "bg-gray-800 border-gray-700"
                          }`}>
                            <span className="text-white font-mono font-bold text-sm">esc</span>
                          </div>
                          <span className={`text-xs font-bold ${
                            escProgress > 0 ? "text-orange-500" : "text-gray-400"
                          }`}>
                            {escProgress > 0 ? "長押し中..." : "長押しでスタート"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      キーボード左上の
                      <span className="inline-block mx-1 px-2 py-0.5 bg-gray-800 text-white text-xs font-mono font-bold rounded">
                        esc
                      </span>
                      キーを長押ししてスタート！
                    </p>
                    <p className="text-xs text-gray-400">
                      公式サイトがポップアップで開きます
                    </p>
                  </div>
                </div>
              )}

              {/* waiting phase: フルスクリーン解除待ち */}
              {phase === "waiting" && currentQuestion && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                    <p className="text-sm text-orange-500 font-bold mb-2">
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

                  <div className="text-center space-y-4">
                    {/* カウントダウンプログレス */}
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="44"
                          fill="none" stroke="#f3f4f6" strokeWidth="6"
                        />
                        <circle
                          cx="50" cy="50" r="44"
                          fill="none"
                          stroke="url(#wait-gradient)"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - waitCountdown / 100)}`}
                          className="transition-none"
                        />
                        <defs>
                          <linearGradient id="wait-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-700">
                          {Math.ceil((WAIT_AFTER_ESC_MS / 1000) * (1 - waitCountdown / 100))}
                        </span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-700">
                      ウィンドウを並べて準備してください
                    </p>
                    <p className="text-sm text-gray-400">
                      まもなく公式サイトが開きます...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 既存サイト検索中 - メインタブがタスクパネル、公式サイトはポップアップ */}
        {phase === "search-existing" && currentQuestion && (
          <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
            <div className="bg-gradient-to-b from-orange-50 to-white rounded-3xl shadow-2xl border-2 border-orange-200 overflow-hidden">
              {/* フェーズヘッダー */}
              <div className="bg-orange-500 px-6 py-3">
                <p className="text-white font-bold text-sm tracking-wide">
                  Phase 1: 既存サイトで探そう
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* ミッション */}
                <div>
                  <p className="text-xs text-orange-400 font-bold mb-1">
                    ミッション
                  </p>
                  <p className="text-xl font-bold text-gray-800 leading-snug">
                    {currentQuestion.question}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {currentQuestion.prefecture}{" "}
                    {currentQuestion.municipalityName}
                  </p>
                </div>

                {/* タイマー */}
                <div className="text-center py-3">
                  <div className="text-6xl font-mono font-black text-orange-600 tabular-nums">
                    {formatTime(existingTime)}
                  </div>
                </div>

                {/* ガイド */}
                <p className="text-sm text-gray-500 text-center">
                  ポップアップの公式サイトで情報を探してください。
                  <br />
                  見つけたらこのタブに戻って「見つけた！」を押してください。
                </p>

                {/* メインボタン */}
                <div className="space-y-3">
                  <button
                    onClick={foundOnExisting}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    見つけた！
                  </button>
                </div>

                {/* 正解ヒント */}
                <p className="text-xs text-gray-300 text-center">
                  答え: 「{currentQuestion.answer}」
                </p>
              </div>
            </div>
          </div>
        )}

        {/* INNOMA検索フェーズ */}
        {phase === "search-innoma" && currentQuestion && (
          <div className="w-full max-w-6xl flex-1 flex flex-col">
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

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-orange-50 rounded-2xl p-6 text-center border-2 border-orange-200">
                  <p className="text-sm font-bold text-orange-500 mb-2">
                    既存サイト
                  </p>
                  <p className="text-4xl font-mono font-black text-orange-600 tabular-nums">
                    {formatTime(existingTime)}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 text-center border-2 border-blue-200">
                  <p className="text-sm font-bold text-blue-500 mb-2">
                    INNOMA
                  </p>
                  <p className="text-4xl font-mono font-black text-blue-600 tabular-nums">
                    {formatTime(innomaTime)}
                  </p>
                </div>
              </div>

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

              <div className="bg-gray-50 rounded-xl p-4 mb-8 text-center">
                <p className="text-sm text-gray-400">正解</p>
                <p className="text-2xl font-bold text-gray-800">
                  {currentQuestion.answer}
                </p>
              </div>

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
