/**
 * プレビュー用ページ
 * インスペクター機能を注入し、要素選択を可能にする
 */

import { notFound } from "next/navigation";
import { loadArtifact, getCompletedPages } from "@/lib/artifact/loader";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { InspectorScript } from "./InspectorScript";

interface PageProps {
  params: Promise<{
    path?: string[];
  }>;
}

function buildArtifactKey(path?: string[]): string {
  if (!path || path.length === 0) {
    return "sample/index.json";
  }
  // path[0] = municipality, path[1...] = actual path
  const [municipality, ...rest] = path;
  if (rest.length === 0) {
    return `${municipality}/index.json`;
  }
  return `${municipality}/${rest.join("/")}.json`;
}

export default async function PreviewPage({ params }: PageProps) {
  const { path } = await params;
  const artifactKey = buildArtifactKey(path);

  const result = await loadArtifact(artifactKey, { skipCache: true });

  if (!result.success) {
    if (result.error === "not_found") {
      notFound();
    }
    throw new Error(result.message);
  }

  const { artifact } = result;

  // municipality_id を取得
  const municipalityId = artifact.municipality_id || (path?.[0] ?? "sample");

  // sourcesがある場合はBlockRendererに渡す
  const sources = (artifact as { sources?: Array<{ id: number; url: string; title?: string; accessedAt?: string; variables?: string[] }> }).sources;

  // 完成済みページのリストを取得
  const completedPages = await getCompletedPages(municipalityId);
  const completedPagesArray = Array.from(completedPages);

  return (
    <>
      <InspectorScript />
      <main className="preview-mode">
        <BlockRenderer
          blocks={artifact.blocks}
          municipalityId={municipalityId}
          sources={sources}
          completedPages={completedPagesArray}
        />
      </main>
    </>
  );
}
