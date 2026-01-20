/**
 * 自治体内検索ページ
 *
 * 指定した自治体内のArtifactを検索
 */

import NextLink from "next/link";
import { searchMunicipality } from "@/lib/search";
import { getMunicipalityMeta } from "@/lib/template";
import MunicipalitySearchBox from "./MunicipalitySearchBox";

interface PageProps {
  params: Promise<{
    municipality: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    page: "ページ",
    procedure: "手続き",
    emergency: "緊急情報",
    info: "お知らせ",
  };
  return labels[type] || type;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    page: "bg-solid-gray-100 text-solid-gray-700",
    procedure: "bg-green-100 text-green-900",
    emergency: "bg-red-100 text-red-900",
    info: "bg-blue-100 text-blue-900",
  };
  return colors[type] || "bg-solid-gray-100 text-solid-gray-700";
}

export default async function MunicipalitySearchPage({
  params,
  searchParams,
}: PageProps) {
  const { municipality } = await params;
  const { q = "" } = await searchParams;
  const decodedMunicipality = decodeURIComponent(municipality);

  // 自治体メタデータを取得
  const meta = await getMunicipalityMeta(decodedMunicipality);
  const municipalityName = meta?.name || decodedMunicipality;

  // 検索実行
  const results = q
    ? await searchMunicipality(q, { municipalityId: decodedMunicipality })
    : [];

  return (
    <div className="min-h-screen bg-solid-gray-50">
      <main className="flex-1">
        {/* Search Header */}
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-solid-gray-900 mb-2">
              {municipalityName}内を検索
            </h1>
            <p className="text-solid-gray-600 mb-6">
              手続き、サービス、施設などを検索できます
            </p>
            <MunicipalitySearchBox
              municipalityId={decodedMunicipality}
              municipalityName={municipalityName}
              defaultValue={q}
            />
          </div>
        </section>

        {/* Results */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          {q ? (
            <>
              <p className="text-solid-gray-600 mb-6">
                「<span className="font-semibold text-solid-gray-900">{q}</span>
                」の検索結果:{" "}
                <span className="font-semibold">{results.length}</span>件
              </p>

              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result) => (
                    <NextLink
                      key={result.id}
                      href={result.url}
                      className="block bg-white rounded-xl border border-solid-gray-300 p-5 hover:border-blue-900 hover:shadow-md transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:bg-yellow-300 focus-visible:rounded"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${getTypeColor(
                            result.type
                          )}`}
                        >
                          {getTypeLabel(result.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-solid-gray-900 mb-1">
                            {result.title}
                          </h2>
                          {result.summary && (
                            <p className="text-solid-gray-600 text-sm line-clamp-2">
                              {result.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </NextLink>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-solid-gray-300 p-8 text-center">
                  <div className="w-16 h-16 bg-solid-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-solid-gray-420"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-solid-gray-900 mb-2">
                    検索結果がありません
                  </h2>
                  <p className="text-solid-gray-600 mb-4">
                    別のキーワードで検索してみてください。
                  </p>
                  <div className="text-sm text-solid-gray-536">
                    <p className="mb-2">検索のヒント:</p>
                    <ul className="list-disc list-inside text-left max-w-xs mx-auto">
                      <li>手続き名で検索（例: 住民票）</li>
                      <li>サービス名で検索（例: 国民健康保険）</li>
                      <li>キーワードを短くしてみる</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-solid-gray-300 p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-1000"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-solid-gray-900 mb-2">
                キーワードを入力してください
              </h2>
              <p className="text-solid-gray-600 mb-6">
                {municipalityName}の情報を検索できます。
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <NextLink
                  href={`/${decodedMunicipality}/search?q=住民票`}
                  className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                >
                  住民票
                </NextLink>
                <NextLink
                  href={`/${decodedMunicipality}/search?q=届出`}
                  className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                >
                  届出
                </NextLink>
                <NextLink
                  href={`/${decodedMunicipality}/search?q=税`}
                  className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                >
                  税
                </NextLink>
                <NextLink
                  href={`/${decodedMunicipality}/search?q=保険`}
                  className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                >
                  保険
                </NextLink>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { municipality } = await params;
  const { q } = await searchParams;
  const decodedMunicipality = decodeURIComponent(municipality);

  const meta = await getMunicipalityMeta(decodedMunicipality);
  const municipalityName = meta?.name || decodedMunicipality;

  return {
    title: q
      ? `「${q}」の検索結果 - ${municipalityName} - INNOMA`
      : `検索 - ${municipalityName} - INNOMA`,
    description: `${municipalityName}の行政情報を検索`,
  };
}
