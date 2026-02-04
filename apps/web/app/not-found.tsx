import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/dads";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main id="main" className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl border border-solid-gray-300 p-8 shadow-sm">
            <div className="text-6xl font-bold text-solid-gray-200 mb-4">404</div>
            <h1 className="text-2xl font-bold text-solid-gray-900 mb-2">
              ページが見つかりません
            </h1>
            <p className="text-solid-gray-600 mb-6">
              お探しのページは存在しないか、移動した可能性があります。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="solid-fill" size="md">
                <NextLink href="/">
                  ホームに戻る
                </NextLink>
              </Button>
              <Button asChild variant="outline" size="md">
                <NextLink href="/municipalities">
                  自治体一覧を見る
                </NextLink>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
