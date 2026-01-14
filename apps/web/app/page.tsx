import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          すべての自治体サイトを
          <br />
          「迷わず辿り着ける・読める・操作できる」体験に
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          INNOMAは、地方公共団体のWeb体験を再設計するOSSプラットフォームです。
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/municipalities"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            自治体を探す
          </Link>
          <a
            href="https://github.com/anthropics/innoma"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-900 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            GitHub
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="p-6 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ♿ アクセシビリティAA準拠
          </h3>
          <p className="text-gray-600">
            WCAG 2.1 AA準拠で、高齢者・障害者を含むすべての市民が使いやすいUIを提供します。
          </p>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            🔍 自治体横断検索
          </h3>
          <p className="text-gray-600">
            複数の自治体サイトを横断して、必要な情報を一度に検索できます。
          </p>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            🌏 多言語・読み上げ対応
          </h3>
          <p className="text-gray-600">
            日本語だけでなく、多言語対応とスクリーンリーダー完全対応で情報を届けます。
          </p>
        </div>
      </section>

      <section className="bg-gray-50 p-8 rounded-lg mb-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          パイプラインアーキテクチャ
        </h3>
        <div className="font-mono text-sm text-gray-700 mb-4">
          <code>
            [URL List] → Crawler → OCR → LLM(JSON) → BestUXUI → React+DA-DS → Next.js → CDN
          </code>
        </div>
        <p className="text-gray-600">
          自治体サイトを自動クロール・OCR処理・LLMによる構造化を経て、
          DA-DS（デジタル庁デザインシステム）準拠のReactコンポーネントに変換し、
          Next.jsでレンダリングします。
        </p>
      </section>

      <section className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          オープンソースで開発中
        </h3>
        <p className="text-gray-600 mb-6">
          INNOMAは完全OSSで運用されており、どなたでも開発・改善に参加できます。
        </p>
        <a
          href="https://discord.gg/4v6JQv9atR"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Discordコミュニティに参加
        </a>
      </section>
    </main>
  );
}
