import Link from "next/link";
import type { Metadata } from "next";
import NotificationBell from "./components/NotificationBell";

export const metadata: Metadata = {
  title: "INNOMA Admin",
  description: "INNOMA管理画面",
};

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
    >
      {children}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                INNOMA Admin
              </Link>
              <nav className="flex items-center gap-1">
                <NavLink href="/admin">ダッシュボード</NavLink>
                <NavLink href="/admin/municipalities">自治体一覧</NavLink>
                <NavLink href="/admin/municipalities/new">新規追加</NavLink>
                <NavLink href="/admin/drafts">下書き</NavLink>
                <NavLink href="/admin/reviews">レビュー</NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-700"
                target="_blank"
              >
                サイトを表示 ↗
              </Link>
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
