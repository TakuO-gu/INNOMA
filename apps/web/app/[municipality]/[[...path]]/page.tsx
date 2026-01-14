/**
 * Artifact 配信ページ
 *
 * ISR/SSR方針:
 *   - 通常ページ: ISR（revalidate = 300秒 = 5分）
 *   - Emergencyページ: SSR（revalidate = 0、または極短い30秒）
 *
 * ルート:
 *   /[municipality]/[[...path]]
 *   例: /tokyo-shibuya/procedures/juminhyo
 */

import { notFound } from "next/navigation";
import { loadArtifact } from "@/lib/artifact/loader";
import { hasEmergencyContent, hasHighPriorityEmergency } from "@/lib/artifact/cache";
import BlockRenderer from "@/components/blocks/BlockRenderer";

// ISR設定
// Next.js App Routerでは、ページ単位ではなくセグメント単位でrevalidateを設定
// dynamicParams: true で未知のパスも許可
export const dynamicParams = true;

// デフォルトのrevalidate（通常ページ用）
// Emergencyがある場合は動的に短くする必要があるが、
// Next.jsのApp Routerでは動的revalidateが難しいため、
// Emergency検出時はfetch時のcache: 'no-store'で対応
export const revalidate = 300; // 5分

interface PageProps {
  params: Promise<{
    municipality: string;
    path?: string[];
  }>;
}

/**
 * Artifactキーを生成
 */
function buildArtifactKey(municipality: string, path?: string[]): string {
  if (!path || path.length === 0) {
    return `${municipality}/index.json`;
  }
  return `${municipality}/${path.join("/")}.json`;
}

export default async function ArtifactPage({ params }: PageProps) {
  const { municipality, path } = await params;
  const artifactKey = buildArtifactKey(municipality, path);

  const result = await loadArtifact(artifactKey);

  if (!result.success) {
    if (result.error === "not_found") {
      notFound();
    }
    // その他のエラーはエラーページで処理
    throw new Error(result.message);
  }

  const { artifact } = result;

  // Emergency検出でヘッダー情報を追加（クライアントサイドでの更新頻度調整用）
  const isEmergency = hasEmergencyContent(artifact);
  const isHighPriority = hasHighPriorityEmergency(artifact);

  return (
    <main
      data-emergency={isEmergency ? "true" : undefined}
      data-priority={isHighPriority ? "high" : undefined}
    >
      <BlockRenderer blocks={artifact.blocks} />
    </main>
  );
}

/**
 * メタデータ生成
 */
export async function generateMetadata({ params }: PageProps) {
  const { municipality, path } = await params;
  const artifactKey = buildArtifactKey(municipality, path);

  const result = await loadArtifact(artifactKey);

  if (!result.success) {
    return {
      title: "Not Found",
    };
  }

  const { artifact } = result;
  const titleBlock = artifact.blocks.find((b) => b.type === "Title");
  const title = titleBlock && titleBlock.type === "Title" ? titleBlock.props.title : municipality;

  return {
    title: `${title} - INNOMA`,
    description: artifact.metadata?.municipality
      ? `${artifact.metadata.municipality}の行政情報`
      : undefined,
  };
}
