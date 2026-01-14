import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import { Link } from "@/components/dads";

type Municipality = {
  id: string;
  name: string;
  prefecture: string;
  description?: string;
  population?: number;
  lastUpdated?: string;
  categories?: string[];
};

const MUNICIPALITIES: Municipality[] = [
  {
    id: "utashinai",
    name: "歌志内市",
    prefecture: "北海道",
    description: "北海道中央部に位置する、かつて炭鉱で栄えた街。日本で最も人口の少ない市として知られています。",
    population: 2800,
    lastUpdated: "2025-11-25",
    categories: ["ニュース", "イベント", "手続き", "施設", "緊急情報"],
  },
  {
    id: "sample",
    name: "サンプル市",
    prefecture: "東京都",
    description: "デモ用のサンプル自治体データ。システムの動作確認用に使用されます。",
    lastUpdated: "2024-12-15",
    categories: ["ニュース", "イベント", "手続き", "施設"],
  },
];

const PREFECTURES = Array.from(new Set(MUNICIPALITIES.map((m) => m.prefecture)));

function MunicipalityCard({ municipality }: { municipality: Municipality }) {
  return (
    <NextLink
      href={`/municipalities/${municipality.id}`}
      className="block bg-white rounded-xl border border-solid-gray-300 hover:border-blue-900 hover:shadow-lg transition-all overflow-hidden focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:bg-yellow-300 focus-visible:rounded"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="inline-block px-2 py-1 text-xs font-medium text-blue-1000 bg-blue-100 rounded mb-2">
              {municipality.prefecture}
            </span>
            <h2 className="text-xl font-bold text-solid-gray-900">
              {municipality.name}
            </h2>
          </div>
        </div>

        {municipality.description && (
          <p className="text-solid-gray-600 text-sm mb-4 line-clamp-2">
            {municipality.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {municipality.categories?.map((category) => (
            <span
              key={category}
              className="px-2 py-1 text-xs text-solid-gray-600 bg-solid-gray-100 rounded"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-solid-gray-536">
          {municipality.population && (
            <span>人口: 約{municipality.population.toLocaleString()}人</span>
          )}
          {municipality.lastUpdated && (
            <span>更新: {municipality.lastUpdated}</span>
          )}
        </div>
      </div>
    </NextLink>
  );
}

export default function MunicipalitiesPage() {
  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-solid-gray-900 mb-4">
              自治体一覧
            </h1>
            <p className="text-solid-gray-600 max-w-2xl">
              INNOMAが対応している自治体の一覧です。各自治体をクリックすると、
              ニュース、イベント、手続き案内などの詳細情報を確認できます。
            </p>
          </div>
        </section>

        {/* Filter & Results */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-solid-gray-600">
              <span className="font-semibold text-solid-gray-900">{MUNICIPALITIES.length}</span>
              件の自治体
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-solid-gray-536">都道府県:</span>
              <select className="px-3 py-2 border border-solid-gray-300 rounded-lg text-sm bg-white text-solid-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black">
                <option value="">すべて</option>
                {PREFECTURES.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MUNICIPALITIES.map((municipality) => (
              <MunicipalityCard key={municipality.id} municipality={municipality} />
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-12 p-6 bg-blue-100 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-1100 mb-2">
              自治体データの追加について
            </h3>
            <p className="text-blue-1000 text-sm mb-4">
              現在、INNOMAはデモ段階です。より多くの自治体データを追加するには、
              Crawlerでウェブサイトをクロールし、Transformerで構造化データに変換する必要があります。
            </p>
            <Link asChild>
              <a
                href="https://github.com/YOUR_ORG/INNOMA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-1000 hover:text-blue-1100 font-medium text-sm"
              >
                GitHubで貢献する
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
