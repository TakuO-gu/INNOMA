import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "INNOMA Admin",
  description: "INNOMA管理画面",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                INNOMA Admin
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  ダッシュボード
                </Link>
                <Link
                  href="/admin/generate"
                  className="text-gray-600 hover:text-gray-900"
                >
                  自治体生成
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
