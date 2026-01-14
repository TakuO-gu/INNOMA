import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import { SearchBox } from "@/components/search";
import { Link } from "@/components/dads";

type SearchResult = {
  id: string;
  type: "municipality" | "procedure" | "news" | "event" | "facility";
  title: string;
  description?: string;
  municipality?: string;
  prefecture?: string;
  url: string;
  date?: string;
};

// サンプル検索データ（実際はAPIまたはインデックスファイルから取得）
function searchContent(query: string): SearchResult[] {
  const allContent: SearchResult[] = [
    {
      id: "utashinai",
      type: "municipality",
      title: "歌志内市",
      description: "北海道中央部に位置する、かつて炭鉱で栄えた街",
      prefecture: "北海道",
      url: "/municipalities/utashinai",
    },
    {
      id: "sample",
      type: "municipality",
      title: "サンプル市",
      description: "デモ用のサンプル自治体データ",
      prefecture: "東京都",
      url: "/municipalities/sample",
    },
    {
      id: "utashinai-juminhyo",
      type: "procedure",
      title: "住民票の写し等の電子申請",
      description: "マイナンバーカードを使ってオンラインで申請できます",
      municipality: "歌志内市",
      url: "/utashinai/procedures/juminhyo",
    },
    {
      id: "utashinai-influenza",
      type: "news",
      title: "インフルエンザ警報が発令されました",
      description: "北海道内でインフルエンザの流行が拡大しています",
      municipality: "歌志内市",
      date: "2025-11-07",
      url: "/municipalities/utashinai",
    },
    {
      id: "utashinai-suito",
      type: "news",
      title: "水痘（みずぼうそう）の注意報が発令されました",
      municipality: "歌志内市",
      date: "2025-11-21",
      url: "/municipalities/utashinai",
    },
    {
      id: "utashinai-hospital",
      type: "facility",
      title: "歌志内市立病院",
      description: "リハビリテーション室が再開しました",
      municipality: "歌志内市",
      url: "/municipalities/utashinai",
    },
    {
      id: "sample-juminhyo",
      type: "procedure",
      title: "住民票の写しの交付",
      description: "住民票の写しを交付します",
      municipality: "サンプル市",
      url: "/municipalities/sample",
    },
  ];

  if (!query.trim()) return [];

  const q = query.toLowerCase();
  return allContent.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.municipality?.toLowerCase().includes(q) ||
      item.prefecture?.toLowerCase().includes(q)
  );
}

function getTypeLabel(type: SearchResult["type"]): string {
  const labels = {
    municipality: "自治体",
    procedure: "手続き",
    news: "お知らせ",
    event: "イベント",
    facility: "施設",
  };
  return labels[type];
}

function getTypeColor(type: SearchResult["type"]): string {
  const colors = {
    municipality: "bg-blue-100 text-blue-1000",
    procedure: "bg-green-100 text-green-900",
    news: "bg-yellow-100 text-yellow-900",
    event: "bg-magenta-100 text-magenta-900",
    facility: "bg-solid-gray-100 text-solid-gray-700",
  };
  return colors[type];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchContent(q);

  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Search Header */}
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-solid-gray-900 mb-6">検索</h1>
            <SearchBox size="lg" className="max-w-2xl" />
          </div>
        </section>

        {/* Results */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          {q ? (
            <>
              <p className="text-solid-gray-600 mb-6">
                「<span className="font-semibold text-solid-gray-900">{q}</span>」の検索結果:{" "}
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
                          className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                            result.type
                          )}`}
                        >
                          {getTypeLabel(result.type)}
                        </span>
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-solid-gray-900 mb-1">
                            {result.title}
                          </h2>
                          {result.description && (
                            <p className="text-solid-gray-600 text-sm mb-2">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-solid-gray-536">
                            {result.municipality && (
                              <span>{result.municipality}</span>
                            )}
                            {result.prefecture && !result.municipality && (
                              <span>{result.prefecture}</span>
                            )}
                            {result.date && <span>{result.date}</span>}
                          </div>
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
                      <li>自治体名で検索（例: 歌志内市）</li>
                      <li>手続き名で検索（例: 住民票）</li>
                      <li>都道府県名で検索（例: 北海道）</li>
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
                自治体名、手続き名、施設名などで検索できます。
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link asChild>
                  <NextLink
                    href="/search?q=住民票"
                    className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                  >
                    住民票
                  </NextLink>
                </Link>
                <Link asChild>
                  <NextLink
                    href="/search?q=歌志内"
                    className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                  >
                    歌志内
                  </NextLink>
                </Link>
                <Link asChild>
                  <NextLink
                    href="/search?q=北海道"
                    className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                  >
                    北海道
                  </NextLink>
                </Link>
                <Link asChild>
                  <NextLink
                    href="/search?q=病院"
                    className="px-4 py-2 bg-solid-gray-100 text-solid-gray-700 rounded-lg hover:bg-solid-gray-200 transition-colors text-sm"
                  >
                    病院
                  </NextLink>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return searchParams.then(({ q }) => ({
    title: q ? `「${q}」の検索結果 - INNOMA` : "検索 - INNOMA",
    description: "INNOMAで自治体情報を検索",
  }));
}
