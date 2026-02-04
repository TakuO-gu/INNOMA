import "./globals.css";

export const metadata = {
  title: "INNOMA",
  description: "INNOMA web",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        {/* スキップリンク: JIS X 8341-3:2016 2.4.1対応 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-yellow-300 focus:text-solid-gray-900 focus:rounded focus:outline focus:outline-4 focus:outline-black"
        >
          本文へ移動
        </a>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
