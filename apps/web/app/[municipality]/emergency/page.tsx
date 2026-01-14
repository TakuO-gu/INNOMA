/**
 * Emergency（緊急情報）専用ページ
 *
 * ISR/SSR方針:
 *   - SSR or 極短revalidate（30秒）
 *   - キャッシュを最小化して最新情報を優先
 *
 * ルート:
 *   /[municipality]/emergency
 */

import { notFound } from "next/navigation";
import { loadArtifact } from "@/lib/artifact/loader";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import type { InnomaBlock } from "@/lib/artifact/types";

// SSR設定: 極短revalidate
export const revalidate = 30; // 30秒

// dynamic = 'force-dynamic' を使うとSSRになるが、
// 緊急情報でも30秒程度のキャッシュは許容できるのでISR(30秒)を採用
// export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    municipality: string;
  }>;
}

export default async function EmergencyPage({ params }: PageProps) {
  const { municipality } = await params;
  const artifactKey = `${municipality}/emergency.json`;

  // キャッシュをスキップして最新を取得
  const result = await loadArtifact(artifactKey, { skipCache: true });

  if (!result.success) {
    if (result.error === "not_found") {
      notFound();
    }
    throw new Error(result.message);
  }

  const { artifact } = result;

  // Emergencyブロックのみをフィルタリング
  const emergencyBlocks = artifact.blocks.filter(
    (b): b is Extract<InnomaBlock, { type: "Emergency" }> => b.type === "Emergency"
  );

  if (emergencyBlocks.length === 0) {
    // Emergency情報がない場合は「現在緊急情報はありません」表示
    return (
      <main>
        <div className="dads-page">
          <header>
            <h1 className="dads-heading dads-heading--xl">緊急情報</h1>
          </header>
          <section>
            <p>現在、緊急情報はありません。</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="dads-page">
        <header>
          <h1 className="dads-heading dads-heading--xl">緊急情報</h1>
        </header>
        <BlockRenderer blocks={emergencyBlocks} />
      </div>
    </main>
  );
}

/**
 * メタデータ生成
 */
export async function generateMetadata({ params }: PageProps) {
  const { municipality } = await params;

  return {
    title: `緊急情報 - ${municipality} - INNOMA`,
    description: `${municipality}の緊急情報・災害情報`,
  };
}
