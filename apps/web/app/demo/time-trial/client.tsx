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

interface TrialResult {
  question: string;
  municipality: string;
  existingTime: number;
  innomaTime: number;
  timeDiffPercent: number;
  timestamp: number;
}

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

  // 結果履歴（localStorageに保存）
  const [resultHistory, setResultHistory] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("innoma-trial-history");
      if (saved) setResultHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveResult = useCallback((result: TrialResult) => {
    setResultHistory((prev) => {
      const updated = [...prev, result];
      try { localStorage.setItem("innoma-trial-history", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

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

  // INNOMA iframe読み込み完了フラグ
  const [innomaIframeLoaded, setInnomaIframeLoaded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
    }
    return `${secs}.${ms}秒`;
  };

  // タスクパネルのタイマー表示を更新
  const updateTaskPanelTimer = useCallback((timeStr: string) => {
    if (taskPanelWindowRef.current && !taskPanelWindowRef.current.closed) {
      const el = taskPanelWindowRef.current.document.getElementById("timer-display");
      if (el) el.textContent = timeStr;
    }
  }, []);

  // Timer effect for search-existing phase
  useEffect(() => {
    if (phase === "search-existing") {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setExistingTime(elapsed);
        updateTaskPanelTimer(formatTime(elapsed));
      }, 50);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [phase, updateTaskPanelTimer]);

  // Timer effect for search-innoma phase（iframe読み込み完了後に開始）
  useEffect(() => {
    if (phase === "search-innoma" && innomaIframeLoaded) {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setInnomaTime(elapsed);
      }, 50);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [phase, innomaIframeLoaded]);

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

  // ウィンドウ参照
  const officialWindowRef = useRef<Window | null>(null);
  const taskPanelWindowRef = useRef<Window | null>(null);

  const closeSplitWindows = useCallback(() => {
    if (officialWindowRef.current && !officialWindowRef.current.closed) {
      officialWindowRef.current.close();
    }
    officialWindowRef.current = null;
    if (taskPanelWindowRef.current && !taskPanelWindowRef.current.closed) {
      taskPanelWindowRef.current.close();
    }
    taskPanelWindowRef.current = null;
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

  // タスクパネルポップアップを開く
  const openTaskPanelPopup = useCallback((question: QuizQuestion, phaseLabel: string, color: string) => {
    const screenW = window.screen.availWidth;
    const screenH = window.screen.availHeight;
    const popupW = 400;
    const popupLeft = screenW - popupW;
    const panel = window.open(
      "",
      "innoma-task-panel",
      `popup=yes,width=${popupW},height=${screenH},left=${popupLeft},top=0`
    );
    if (!panel) return null;
    panel.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>タイムトライアル</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f9fafb;display:flex;flex-direction:column;min-height:100vh;padding:24px}
.header{background:${color};color:#fff;padding:12px 20px;border-radius:16px;margin-bottom:20px;font-weight:700;font-size:14px}
.mission{background:#fff;border:2px solid ${color}33;border-radius:16px;padding:20px;margin-bottom:20px}
.mission-label{font-size:12px;color:${color};font-weight:700;margin-bottom:6px}
.mission-text{font-size:18px;font-weight:700;color:#1f2937;line-height:1.4}
.mission-sub{font-size:13px;color:#9ca3af;margin-top:6px}
.timer{text-align:center;padding:24px 0}
#timer-display{font-size:64px;font-family:ui-monospace,monospace;font-weight:900;color:${color};letter-spacing:-2px}
.guide{text-align:center;color:#6b7280;font-size:14px;margin-bottom:20px;line-height:1.6}
.btn{display:block;width:100%;padding:16px;border:none;border-radius:16px;font-size:18px;font-weight:700;cursor:pointer;transition:transform .1s}
.btn:active{transform:scale(0.97)}
.btn-primary{background:linear-gradient(135deg,${color},${color}dd);color:#fff;margin-bottom:12px;box-shadow:0 4px 12px ${color}44}
.btn-secondary{background:#f3f4f6;color:#4b5563;font-size:14px;margin-bottom:12px}
.hint{text-align:center;font-size:12px;color:#d1d5db;margin-top:16px}
</style></head><body>
<div class="header">${phaseLabel}</div>
<div class="mission">
<div class="mission-label">ミッション</div>
<div class="mission-text">${question.question}</div>
<div class="mission-sub">${question.prefecture} ${question.municipalityName}</div>
</div>
<div class="timer"><div id="timer-display">0.0秒</div></div>
<div class="guide">公式サイトで情報を探してください。<br>見つけたら「見つけた！」を押してください。</div>
<button class="btn btn-primary" id="found-btn">見つけた！</button>
<button class="btn btn-secondary" id="reopen-btn">既存サイトをもう一度表示する</button>
<div class="hint">答え: 「${question.answer}」</div>
<script>
document.getElementById('found-btn').onclick=function(){window.opener&&window.opener.postMessage({type:'innoma-found-existing'},'*')};
document.getElementById('reopen-btn').onclick=function(){window.opener&&window.opener.postMessage({type:'innoma-reopen-official'},'*')};
</script></body></html>`);
    panel.document.close();
    return panel;
  }, []);

  // Phase 1 開始: 公式サイトを通常タブで開き、タスクパネルをポップアップで表示
  const startExistingSearch = useCallback(() => {
    if (!currentQuestion) return;

    // 公式サイトを通常のChromeウィンドウ（新しいタブ）として開く
    const officialWin = window.open(
      currentQuestion.officialUrl,
      "innoma-official"
    );
    if (officialWin) {
      officialWindowRef.current = officialWin;
    }

    // タスクパネルをポップアップで開く
    const panel = openTaskPanelPopup(currentQuestion, "Phase 1: 既存サイトで探そう", "#f97316");
    if (panel) {
      taskPanelWindowRef.current = panel;
    }

    // Phase 遷移（タイマー開始）
    setPhase("search-existing");
  }, [currentQuestion, openTaskPanelPopup]);

  // waiting phase: フルスクリーン解除後に少し待ってからポップアップ＋タイマー開始
  const WAIT_AFTER_ESC_MS = 5000;
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

  // 既存サイト「見つけた！」
  const foundOnExisting = useCallback(() => {
    stopTimer();
    // 公式サイトとタスクパネルポップアップを閉じる
    closeSplitWindows();
    setInnomaIframeLoaded(false);
    setPhase("search-innoma");
  }, [stopTimer, closeSplitWindows]);

  // ポップアップからのメッセージを受信
  const foundOnExistingRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    foundOnExistingRef.current = foundOnExisting;
  }, [foundOnExisting]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "innoma-found-existing") {
        foundOnExistingRef.current?.();
      } else if (e.data?.type === "innoma-reopen-official" && currentQuestion) {
        const win = window.open(
          currentQuestion.officialUrl,
          "innoma-official"
        );
        if (win) officialWindowRef.current = win;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentQuestion]);

  // INNOMA「見つけた！」
  const foundOnInnoma = useCallback(() => {
    stopTimer();
    setPhase("result");
  }, [stopTimer]);

  // 結果をphase遷移時に保存
  const resultSavedRef = useRef(false);
  useEffect(() => {
    if (phase === "result" && currentQuestion && existingTime > 0 && innomaTime > 0 && !resultSavedRef.current) {
      resultSavedRef.current = true;
      const diff = ((existingTime - innomaTime) / existingTime) * 100;
      saveResult({
        question: currentQuestion.question,
        municipality: currentQuestion.municipalityName,
        existingTime,
        innomaTime,
        timeDiffPercent: Math.round(diff),
        timestamp: Date.now(),
      });
      setFeedback("");
      setFeedbackSubmitted(false);
    }
    if (phase !== "result") {
      resultSavedRef.current = false;
    }
  }, [phase, currentQuestion, existingTime, innomaTime, saveResult]);

  // 最初からやり直す
  const reset = useCallback(() => {
    stopTimer();
    closeSplitWindows();
    setPhase("idle");
    setCurrentQuestion(null);
    setExistingTime(0);
    setInnomaTime(0);
  }, [stopTimer, closeSplitWindows]);

  const timeDiff =
    existingTime > 0 && innomaTime > 0
      ? ((existingTime - innomaTime) / existingTime) * 100
      : 0;

  // 統計計算
  const stats = (() => {
    if (resultHistory.length === 0) return null;
    const totalTrials = resultHistory.length;
    const innomaWins = resultHistory.filter((r) => r.timeDiffPercent > 0).length;
    const avgExisting = resultHistory.reduce((s, r) => s + r.existingTime, 0) / totalTrials;
    const avgInnoma = resultHistory.reduce((s, r) => s + r.innomaTime, 0) / totalTrials;
    const avgDiff = resultHistory.reduce((s, r) => s + r.timeDiffPercent, 0) / totalTrials;
    return { totalTrials, innomaWins, avgExisting, avgInnoma, avgDiff };
  })();

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
                          <div className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center mb-2 transition-all ${
                            escProgress > 0
                              ? "scale-95 border-red-400"
                              : "border-red-300"
                          }`} style={{ backgroundColor: escProgress > 0 ? "#D94040" : "#FF6B6B" }}>
                            <span className="text-white font-mono font-bold text-sm">esc</span>
                          </div>
                          {escProgress > 0 && (
                            <span className="text-xs font-bold text-orange-500">
                              長押し中...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-base font-bold text-gray-700">
                      キーボード左上の
                      <span className="inline-block mx-1 px-2 py-0.5 rounded text-white text-sm font-mono" style={{ backgroundColor: "#FF6B6B" }}>esc</span>
                      キーを長押ししてください
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
                  公式サイトで情報を探してください。
                  <br />
                  見つけたら「見つけた！」を押してください。
                </p>

                {/* メインボタン */}
                <div className="space-y-3">
                  <button
                    onClick={foundOnExisting}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    見つけた！
                  </button>
                  <button
                    onClick={() => {
                      if (currentQuestion) {
                        const win = window.open(
                          currentQuestion.officialUrl,
                          "innoma-official"
                        );
                        if (win) officialWindowRef.current = win;
                      }
                    }}
                    className="w-full py-3 bg-gray-100 text-gray-600 text-sm font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                  >
                    既存サイトをもう一度表示する
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
                  <div className={`text-3xl font-mono font-bold tabular-nums ${innomaIframeLoaded ? "text-blue-600" : "text-gray-300"}`}>
                    {innomaIframeLoaded ? formatTime(innomaTime) : "読込中..."}
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
              <div className="flex-1 relative">
                {!innomaIframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 font-medium">ページを読み込み中...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={`/${currentQuestion.municipalityId}${currentQuestion.innomaPath}`}
                  className="w-full h-full min-h-[460px] border-0"
                  title={`INNOMA ${currentQuestion.municipalityName}`}
                  onLoad={() => setInnomaIframeLoaded(true)}
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

              {/* 累計統計 */}
              {stats && stats.totalTrials > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-200 mb-8">
                  <p className="text-sm font-bold text-purple-600 mb-4 text-center">
                    これまでの統計（{stats.totalTrials}回分）
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">INNOMA勝率</p>
                      <p className="text-2xl font-black text-purple-600">
                        {Math.round((stats.innomaWins / stats.totalTrials) * 100)}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {stats.innomaWins}/{stats.totalTrials}回
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">既存 平均</p>
                      <p className="text-xl font-bold text-orange-500 tabular-nums">
                        {formatTime(stats.avgExisting)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">INNOMA 平均</p>
                      <p className="text-xl font-bold text-blue-500 tabular-nums">
                        {formatTime(stats.avgInnoma)}
                      </p>
                    </div>
                  </div>
                  {stats.avgDiff > 0 && (
                    <p className="text-center text-sm text-purple-500 font-bold mt-3">
                      平均 {Math.round(stats.avgDiff)}% 時間短縮
                    </p>
                  )}
                </div>
              )}

              {/* 感想フォーム */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <p className="text-sm font-bold text-gray-600 mb-3">
                  感想を教えてください
                </p>
                {feedbackSubmitted ? (
                  <div className="text-center py-4">
                    <p className="text-green-600 font-bold">ありがとうございます！</p>
                    <p className="text-sm text-gray-400 mt-1">感想を送信しました</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="使ってみた感想、気づいたことなどを自由にお書きください..."
                      className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 focus:outline-none transition-colors"
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        if (feedback.trim()) {
                          try {
                            const feedbackHistory = JSON.parse(localStorage.getItem("innoma-trial-feedback") || "[]");
                            feedbackHistory.push({
                              feedback: feedback.trim(),
                              question: currentQuestion.question,
                              municipality: currentQuestion.municipalityName,
                              existingTime,
                              innomaTime,
                              timestamp: Date.now(),
                            });
                            localStorage.setItem("innoma-trial-feedback", JSON.stringify(feedbackHistory));
                          } catch {}
                          setFeedbackSubmitted(true);
                        }
                      }}
                      disabled={!feedback.trim()}
                      className="w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      送信
                    </button>
                  </div>
                )}
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
