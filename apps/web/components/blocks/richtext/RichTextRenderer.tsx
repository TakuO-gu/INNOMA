import React from "react";
import type { RichTextContent } from "@/lib/artifact/types";

export default function RichTextRenderer({ content }: { content: RichTextContent }) {
  // シンプルなHTML文字列としてレンダリング（必要に応じてMarkdown対応も可）
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
