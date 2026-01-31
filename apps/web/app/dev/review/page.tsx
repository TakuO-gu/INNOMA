/**
 * UIレビューツール
 * INNOMAのページをプレビューしながらUIをレビューできるデバッグツール
 */

import { listArtifacts } from "@/lib/artifact/loader";
import { ReviewTool } from "./ReviewTool";

export default async function ReviewPage() {
  // 利用可能なArtifactを取得
  const allKeys = await listArtifacts();

  // ページ情報を整理
  const pages = allKeys
    .filter(key => {
      // _templates, _drafts は除外
      if (key.startsWith("_")) return false;
      return true;
    })
    .map(key => {
      // key: "sample/topics/childcare.json" -> municipality: "sample", path: "topics/childcare"
      const parts = key.replace(/\.json$/, "").split("/");
      const municipality = parts[0];
      const path = parts.slice(1).join("/") || "index";
      return {
        key,
        municipality,
        path,
      };
    })
    .sort((a, b) => {
      // 自治体でソート、次にパスでソート
      if (a.municipality !== b.municipality) {
        return a.municipality.localeCompare(b.municipality);
      }
      return a.path.localeCompare(b.path);
    });

  return <ReviewTool pages={pages} />;
}
