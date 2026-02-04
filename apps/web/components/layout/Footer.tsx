import NextLink from "next/link";

export default function Footer() {
  return (
    <footer className="bg-solid-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-xl font-bold mb-4">INNOMA</p>
            <p className="text-solid-gray-420 text-sm">
              日本の自治体情報をオープンに、アクセスしやすく。
            </p>
          </div>
          <div>
            <p className="font-semibold mb-4">リンク</p>
            <ul className="space-y-2 text-solid-gray-420 text-sm">
              <li>
                <NextLink href="/municipalities" className="hover:text-white transition-colors">
                  自治体一覧
                </NextLink>
              </li>
              <li>
                <a
                  href="https://github.com/YOUR_ORG/INNOMA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-4">プロジェクトについて</p>
            <p className="text-solid-gray-420 text-sm">
              INNOMAはオープンソースプロジェクトです。貢献を歓迎します。
            </p>
          </div>
        </div>
        <div className="border-t border-solid-gray-700 mt-8 pt-8 text-center text-solid-gray-536 text-sm space-y-2">
          <p>
            <a
              href="https://design.digital.go.jp/dads/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline"
            >
              デジタル庁デザインシステムウェブサイト
            </a>
            のコンテンツを加工して作成
          </p>
          <p>&copy; {new Date().getFullYear()} INNOMA Project</p>
        </div>
      </div>
    </footer>
  );
}
