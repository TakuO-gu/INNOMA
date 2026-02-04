"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Link } from "@/components/dads";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";

interface SmartAnswerOption {
  label: string;
  nextQuestionId?: string;
  resultId?: string;
}

interface SmartAnswerQuestion {
  id: string;
  text: string;
  options: SmartAnswerOption[];
}

interface SmartAnswerRelatedLink {
  title: string;
  href: string;
}

interface SmartAnswerResult {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  relatedLinks?: SmartAnswerRelatedLink[];
}

export function SmartAnswerBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const questions = useMemo(
    () => (props.questions as SmartAnswerQuestion[]) || [],
    [props.questions]
  );
  const results = useMemo(
    () => (props.results as SmartAnswerResult[]) || [],
    [props.results]
  );

  // 回答履歴: { questionId, selectedOptionIndex }[]
  const [history, setHistory] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  // 現在の質問ID（nullの場合は結果表示）
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(questions[0]?.id || "");
  // 結果ID
  const [resultId, setResultId] = useState<string | null>(null);

  const currentQuestion = questions.find((q) => q.id === currentQuestionId);
  const currentResult = resultId ? results.find((r) => r.id === resultId) : null;

  // 選択肢をクリックした時
  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion) return;

      const option = currentQuestion.options[optionIndex];
      if (!option) return;

      // 履歴に追加
      setHistory((prev) => [...prev, { questionId: currentQuestion.id, selectedIndex: optionIndex }]);

      if (option.resultId) {
        // 結果へ遷移
        setCurrentQuestionId("");
        setResultId(option.resultId);
      } else if (option.nextQuestionId) {
        // 次の質問へ
        setCurrentQuestionId(option.nextQuestionId);
      }
    },
    [currentQuestion]
  );

  // 戻るボタン
  const handleBack = useCallback(() => {
    if (history.length === 0) return;

    const newHistory = [...history];
    const lastEntry = newHistory.pop();
    setHistory(newHistory);

    if (lastEntry) {
      setCurrentQuestionId(lastEntry.questionId);
      setResultId(null);
    }
  }, [history]);

  // 最初からやり直す
  const handleRestart = useCallback(() => {
    setHistory([]);
    setCurrentQuestionId(questions[0]?.id || "");
    setResultId(null);
  }, [questions]);

  // 質問表示
  if (currentQuestion && !resultId) {
    return (
      <div className="smart-answer mt-8">
        {/* 質問 */}
        <h2 className="text-std-24B-150 text-solid-gray-900 mb-8">
          {currentQuestion.text}
        </h2>

        {/* 選択肢 */}
        <div className="flex flex-row justify-center gap-4 mb-8">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              className="min-w-32 px-8 py-4 text-std-17B-170 bg-white border-2 border-blue-1000 text-blue-1000 rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 戻るボタン */}
        {history.length > 0 && (
          <div className="mt-8">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-std-16N-170 text-blue-1000 hover:text-blue-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              前の質問に戻る
            </button>
          </div>
        )}
      </div>
    );
  }

  // 結果表示
  if (currentResult) {
    const resolvedActionHref = currentResult.actionHref
      ? currentResult.actionHref.startsWith("http")
        ? currentResult.actionHref
        : prefixInternalLink(currentResult.actionHref, municipalityId)
      : null;

    return (
      <div className="smart-answer-result mt-8">
        {/* 結果タイトル */}
        <h2 className="text-std-24B-150 text-solid-gray-900 mb-4">
          {currentResult.title}
        </h2>

        {/* 結果説明 */}
        {currentResult.description && (
          <p className="text-std-16N-170 text-solid-gray-700 mb-8">
            {currentResult.description}
          </p>
        )}

        {/* CTAボタン */}
        {currentResult.actionLabel && resolvedActionHref && (
          <div className="mb-8">
            <a
              href={resolvedActionHref}
              className="inline-flex items-center px-6 py-3 bg-blue-1000 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors"
            >
              {currentResult.actionLabel}
              {resolvedActionHref.startsWith("http") && (
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}
            </a>
          </div>
        )}

        {/* 戻る・やり直しボタン */}
        <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-solid-gray-200">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-std-16N-170 text-blue-1000 hover:text-blue-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            前の質問に戻る
          </button>
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 text-std-16N-170 text-solid-gray-600 hover:text-solid-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            最初からやり直す
          </button>
        </div>

        {/* 関連リンク */}
        {currentResult.relatedLinks && currentResult.relatedLinks.length > 0 && (
          <div className="mt-8 pt-8 border-t border-solid-gray-200">
            <h3 className="text-std-17B-170 text-solid-gray-900 mb-4">関連情報</h3>
            <ul className="space-y-2">
              {currentResult.relatedLinks.map((link, index) => {
                const resolvedHref = link.href.startsWith("http")
                  ? link.href
                  : prefixInternalLink(link.href, municipalityId);
                return (
                  <li key={index}>
                    <Link
                      href={resolvedHref}
                      className="text-std-16N-170 text-blue-1000 hover:text-blue-900"
                    >
                      {link.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // フォールバック
  return null;
}
