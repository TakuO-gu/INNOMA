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
 * Note: Next.js App Router already decodes URL params, but we decode again for safety
 */
function buildArtifactKey(municipality: string, path?: string[]): string {
  // Decode municipality and path components
  const decodedMunicipality = decodeURIComponent(municipality);
  if (!path || path.length === 0) {
    return `${decodedMunicipality}/index.json`;
  }
  const decodedPath = path.map(p => decodeURIComponent(p));
  return `${decodedMunicipality}/${decodedPath.join("/")}.json`;
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

  // artifact.municipality_id または URL パラメータを使用
  const municipalityId = artifact.municipality_id || municipality;

  return (
    <main
      data-emergency={isEmergency ? "true" : undefined}
      data-priority={isHighPriority ? "high" : undefined}
    >
      <BlockRenderer blocks={artifact.blocks} municipalityId={municipalityId} />
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
  // v2スキーマ: artifact.title、v1スキーマ: titleブロックから取得
  const title = artifact.title || (() => {
    const titleBlock = artifact.blocks.find((b) => b.type === "Title");
    if (titleBlock && titleBlock.type === "Title") {
      return (titleBlock.props as { text?: string; title?: string }).text || (titleBlock.props as { title?: string }).title;
    }
    return municipality;
  })();

  // v2スキーマ: artifact.description / artifact.municipality_id
  const description = artifact.description ||
    (artifact.municipality_id ? `${artifact.municipality_id}の行政情報` : undefined);

  return {
    title: `${title} - INNOMA`,
    description,
  };
}
