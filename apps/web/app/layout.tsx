import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'INNOMA - すべての市民に届く、迷わない自治体サイトへ',
  description: 'INNOMAは地方公共団体のWeb体験を再設計するOSSプラットフォームです。アクセシビリティAA準拠、自治体横断検索、多言語・読み上げ対応。',
  keywords: ['INNOMA', '自治体', 'アクセシビリティ', 'DA-DS', 'デジタル庁', '行政サービス'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              INNOMA
            </h1>
            <p className="text-sm text-gray-600">
              すべての市民に届く、迷わない自治体サイトへ
            </p>
          </div>
        </header>
        {children}
        <footer className="bg-gray-50 border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <p className="text-sm text-gray-600 text-center">
              INNOMA - Open Source Municipal Web Platform
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
              アクセシビリティAA準拠 | DA-DS対応 | MIT License
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
