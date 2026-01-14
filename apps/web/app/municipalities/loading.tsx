import { Header, Footer } from "@/components/layout";

export default function MunicipalitiesLoading() {
  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Skeleton */}
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="h-8 w-48 bg-solid-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-5 w-96 bg-solid-gray-200 rounded animate-pulse"></div>
          </div>
        </section>

        {/* Content Skeleton */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-24 bg-solid-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-solid-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-solid-gray-300 p-6"
              >
                <div className="h-5 w-16 bg-solid-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-6 w-32 bg-solid-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-4 w-full bg-solid-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-solid-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-6 w-16 bg-solid-gray-200 rounded animate-pulse"
                    ></div>
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
