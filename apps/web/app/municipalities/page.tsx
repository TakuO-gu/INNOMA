import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import { getMunicipalities, type MunicipalitySummary } from "@/lib/template";

function MunicipalityCard({ municipality }: { municipality: MunicipalitySummary }) {
  return (
    <NextLink
      href={`/${municipality.id}`}
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

        <div className="flex items-center justify-between text-sm text-solid-gray-536">
          <span>ページ数: {municipality.pageCount}</span>
          <span>更新: {new Date(municipality.updatedAt).toLocaleDateString("ja-JP")}</span>
        </div>
      </div>
    </NextLink>
  );
}

export default async function MunicipalitiesPage() {
  // 公開中の自治体のみ取得
  const allMunicipalities = await getMunicipalities();
  const publishedMunicipalities = allMunicipalities.filter(
    (m) => m.status === "published"
  );
  const prefectures = Array.from(
    new Set(publishedMunicipalities.map((m) => m.prefecture))
  );

  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main id="main" className="flex-1">
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
            <div className="mt-4 p-4 bg-solid-gray-50 border border-solid-gray-300 rounded-lg max-w-2xl">
              <p className="text-sm text-solid-gray-600">
                INNOMAでは、人口戦略会議が指定するC-③クラス（自然減対策・社会減対策ともに極めて必要）の
                <strong className="text-solid-gray-900">「消滅可能性自治体」</strong>から優先的に情報を登録しています。
              </p>
            </div>
          </div>
        </section>

        {/* Filter & Results */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-solid-gray-600">
              <span className="font-semibold text-solid-gray-900">{publishedMunicipalities.length}</span>
              件の自治体
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-solid-gray-536">都道府県:</span>
              <select className="px-3 py-2 border border-solid-gray-300 rounded-lg text-sm bg-white text-solid-gray-900 focus:outline-none focus:ring-4 focus:ring-yellow-300 focus:border-black">
                <option value="">すべて</option>
                {prefectures.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedMunicipalities.map((municipality) => (
              <MunicipalityCard key={municipality.id} municipality={municipality} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
