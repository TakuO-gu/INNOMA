"use client";

import { useMemo, type ReactNode } from "react";
import { loadDefaultJapaneseParser } from "budoux";

const parser = loadDefaultJapaneseParser();

interface BudouXProps {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * BudouXを使用して日本語テキストの自然な改行を実現するコンポーネント
 * word-break: keep-all + wbr要素で自然な改行位置を指定
 *
 * 使用例:
 * <BudouX>これは長い日本語テキストです</BudouX>
 * <BudouX as="h1">見出しテキスト</BudouX>
 */
export function BudouX({ children, as: Tag = "span", className }: BudouXProps) {
  const parsed = useMemo(() => {
    if (typeof children !== "string") return children;
    const chunks = parser.parse(children);
    const result: ReactNode[] = [];
    chunks.forEach((chunk, i) => {
      if (i > 0) {
        result.push(<wbr key={`wbr-${i}`} />);
      }
      result.push(chunk);
    });
    return result;
  }, [children]);

  return (
    <Tag className={`budoux ${className || ""}`}>
      {parsed}
    </Tag>
  );
}

/**
 * テキストにBudouXで改行位置を設定した結果を返す
 * RichTextRendererなど、既存のテキストノードに適用する場合に使用
 */
export function useBudouXParse(text: string): ReactNode[] {
  return useMemo(() => {
    if (typeof text !== "string") return [text];
    const chunks = parser.parse(text);
    const result: ReactNode[] = [];
    chunks.forEach((chunk, i) => {
      if (i > 0) {
        result.push(<wbr key={`wbr-${i}`} />);
      }
      result.push(chunk);
    });
    return result;
  }, [text]);
}

/**
 * プレーンテキストをBudouXで処理してReactNodeを返す
 */
export function budouxParse(text: string): ReactNode[] {
  if (typeof text !== "string") return [text];
  const chunks = parser.parse(text);
  const result: ReactNode[] = [];
  chunks.forEach((chunk, i) => {
    if (i > 0) {
      result.push(<wbr key={`wbr-${i}`} />);
    }
    result.push(chunk);
  });
  return result;
}
