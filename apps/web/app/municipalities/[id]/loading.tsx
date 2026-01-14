import { Header, Footer } from "@/components/layout";

export default function MunicipalityLoading() {
  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Skeleton */}
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-4 w-64 bg-solid-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-6 w-20 bg-solid-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-8 w-48 bg-solid-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-solid-gray-200 rounded animate-pulse"></div>
          </div>
        </section>

        {/* Search Bar Skeleton */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="h-14 max-w-2xl bg-solid-gray-200 rounded-lg animate-pulse"></div>
        </section>

        {/* Topic Cards Grid Skeleton */}
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-solid-gray-300 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-solid-gray-300 bg-solid-gray-50">
                  <div className="h-6 w-24 bg-solid-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="divide-y divide-solid-gray-200">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="px-5 py-3">
                      <div className="h-5 w-full bg-solid-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
