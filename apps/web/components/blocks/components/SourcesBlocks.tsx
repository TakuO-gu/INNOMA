"use client";

import React from "react";
import type { Source } from "@/lib/artifact/innoma-artifact-schema.v2";
import { Link } from "@/components/dads";
import { budouxParse } from "@/components/BudouX";

interface SourcesBlockProps {
  props: Record<string, unknown>;
  sources?: Source[];
}

/**
 * SourcesBlock - Wikipedia風の参照一覧を表示
 *
 * ページ下部に配置し、テキスト内の[1], [2]などの参照番号に対応する
 * 出典URLを一覧表示します。
 */
export function SourcesBlock({ props, sources }: SourcesBlockProps) {
  // sourcesが空の場合は何も表示しない
  if (!sources || sources.length === 0) {
    return null;
  }

  const heading = (props.heading as string) || "出典";

  return (
    <section className="sources-block mt-16 pt-8 border-t border-solid-gray-300">
      <h2 className="text-std-20B-150 text-solid-gray-900 mb-4 budoux">{budouxParse(heading)}</h2>
      <ol className="list-none space-y-2 text-std-14N-170 text-solid-gray-700">
        {sources
          .sort((a, b) => a.id - b.id)
          .map((source) => (
            <li key={source.id} id={`source-${source.id}`} className="flex items-start gap-2">
              <span className="text-solid-gray-500 font-mono shrink-0">[{source.id}]</span>
              <div className="flex flex-col">
                <Link
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all"
                >
                  {source.title || source.url}
                </Link>
                {source.accessedAt && (
                  <span className="text-std-12N-170 text-solid-gray-500 mt-0.5">
                    （{formatAccessedAt(source.accessedAt)} 参照）
                  </span>
                )}
              </div>
            </li>
          ))}
      </ol>
    </section>
  );
}

/**
 * アクセス日時をフォーマット
 */
function formatAccessedAt(isoString: string): string {
  try {
    const date = new Date(isoString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } catch {
    return isoString;
  }
}
