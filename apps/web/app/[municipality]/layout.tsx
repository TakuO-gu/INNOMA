/**
 * 自治体ページ共通レイアウト
 *
 * 全ての自治体ページに共通のヘッダー（INNOMA ロゴ、自治体名、検索バー）を表示
 */

import { getMunicipalityMeta } from "@/lib/template";
import MunicipalityHeader from "@/components/layout/MunicipalityHeader";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    municipality: string;
  }>;
}

export default async function MunicipalityLayout({
  children,
  params,
}: LayoutProps) {
  const { municipality } = await params;
  const decodedMunicipality = decodeURIComponent(municipality);

  // 自治体メタデータを取得（存在しない場合はURLパラメータを使用）
  const meta = await getMunicipalityMeta(decodedMunicipality);
  const municipalityName = meta?.name || decodedMunicipality;

  return (
    <>
      <MunicipalityHeader
        municipalityId={decodedMunicipality}
        municipalityName={municipalityName}
      />
      {children}
    </>
  );
}
