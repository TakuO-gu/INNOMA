"use client";

import { Link } from "@/components/dads";
import { budouxParse } from "@/components/BudouX";

interface AttachmentItem {
  title: string;
  href: string;
  content_type?: string;
  size?: string;
}

interface AttachmentsBlockProps {
  props: Record<string, unknown>;
}

/**
 * コンテンツタイプからアイコンを取得
 */
function getFileIcon(contentType?: string): string {
  if (!contentType) return "📎";

  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("word") || contentType.includes("docx")) return "📝";
  if (contentType.includes("excel") || contentType.includes("xlsx") || contentType.includes("spreadsheet")) return "📊";
  if (contentType.includes("image")) return "🖼️";
  if (contentType.includes("zip") || contentType.includes("archive")) return "📦";

  return "📎";
}

/**
 * コンテンツタイプからラベルを取得
 */
function getFileTypeLabel(contentType?: string): string {
  if (!contentType) return "";

  if (contentType.includes("pdf")) return "PDF";
  if (contentType.includes("word") || contentType.includes("docx")) return "Word";
  if (contentType.includes("excel") || contentType.includes("xlsx") || contentType.includes("spreadsheet")) return "Excel";
  if (contentType.includes("image/png")) return "PNG";
  if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) return "JPEG";
  if (contentType.includes("zip")) return "ZIP";

  return "";
}

/**
 * Attachmentsブロック
 * PDFなどの添付ファイルをダウンロードリンクとして表示
 */
export function AttachmentsBlock({ props }: AttachmentsBlockProps) {
  const items = (props.items as AttachmentItem[]) || [];
  const title = (props.title as string) || "関連書類";

  if (items.length === 0) {
    return null;
  }

  // 未設定の変数（{{...}}）を含むアイテムをフィルタリング
  const validItems = items.filter(item =>
    item.href && !item.href.includes("{{") && item.href !== ""
  );

  if (validItems.length === 0) {
    return (
      <div className="mt-12 attachments-block">
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-3 budoux">{budouxParse(title)}</h3>
        <p className="text-sm text-solid-gray-500">
          関連書類のURLは現在設定されていません。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 attachments-block">
      <h3 className="text-std-17B-170 text-solid-gray-900 mb-3 budoux">{budouxParse(title)}</h3>
      <ul className="space-y-2">
        {validItems.map((item, index) => {
          const icon = getFileIcon(item.content_type);
          const typeLabel = getFileTypeLabel(item.content_type);

          return (
            <li key={index} className="flex items-center gap-2">
              <span className="text-lg" aria-hidden="true">{icon}</span>
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-std-16N-170"
              >
                {item.title}
                {typeLabel && (
                  <span className="ml-2 text-xs text-solid-gray-500">
                    ({typeLabel})
                  </span>
                )}
              </Link>
              {item.size && (
                <span className="text-xs text-solid-gray-500">
                  {item.size}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default AttachmentsBlock;
