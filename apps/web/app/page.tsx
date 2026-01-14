import NextLink from "next/link";
import { Link, Button } from "@/components/dads";

const FEATURES = [
  {
    title: "自治体情報の検索",
    description: "全国の自治体の行政情報を簡単に検索・閲覧できます。",
    icon: "🔍",
  },
  {
    title: "手続きガイド",
    description: "住民票、戸籍、各種届出などの手続き方法を確認できます。",
    icon: "📋",
  },
  {
    title: "緊急情報",
    description: "災害情報や緊急のお知らせをリアルタイムで確認できます。",
    icon: "🚨",
  },
  {
    title: "施設案内",
    description: "公共施設の場所、営業時間、連絡先を確認できます。",
    icon: "🏛️",
  },
];

const SAMPLE_MUNICIPALITIES = [
  {
    id: "utashinai",
    name: "歌志内市",
    prefecture: "北海道",
    description: "北海道中央部に位置する、かつて炭鉱で栄えた街",
  },
  {
    id: "sample",
    name: "サンプル市",
    prefecture: "東京都",
    description: "デモ用のサンプル自治体データ",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-solid-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-solid-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <NextLink href="/" className="text-2xl font-bold text-solid-gray-900">
            INNOMA
          </NextLink>
          <nav className="flex gap-6">
            <Link asChild>
              <NextLink href="/municipalities">自治体一覧</NextLink>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            日本の自治体情報を
            <br className="hidden md:block" />
            もっとアクセスしやすく
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            INNOMAは、全国の自治体ウェブサイトから情報を収集・構造化し、
            誰もが簡単にアクセスできる形で提供するオープンソースプロジェクトです。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="solid-fill" className="bg-white text-blue-900 hover:bg-blue-50 border-0">
              <NextLink href="/municipalities">自治体を探す</NextLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-blue-800">
              <a
                href="https://github.com/YOUR_ORG/INNOMA"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHubで見る
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-solid-gray-900 text-center mb-12">
            INNOMAでできること
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-xl border border-solid-gray-300 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-solid-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-solid-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Municipalities Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-solid-gray-900">対応自治体</h2>
            <Link asChild>
              <NextLink href="/municipalities">すべて見る →</NextLink>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {SAMPLE_MUNICIPALITIES.map((municipality) => (
              <NextLink
                key={municipality.id}
                href={`/municipalities/${municipality.id}`}
                className="block p-6 bg-solid-gray-50 rounded-xl border border-solid-gray-300 hover:border-blue-400 hover:shadow-md transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-2 focus-visible:bg-yellow-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-solid-gray-900 mb-1">
                      {municipality.name}
                    </h3>
                    <p className="text-sm text-solid-gray-600 mb-2">
                      {municipality.prefecture}
                    </p>
                    <p className="text-solid-gray-700 text-sm">
                      {municipality.description}
                    </p>
                  </div>
                  <span className="text-solid-gray-420 text-2xl">→</span>
                </div>
              </NextLink>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-solid-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-solid-gray-900 mb-6">
            INNOMAとは
          </h2>
          <p className="text-solid-gray-700 mb-8 leading-relaxed">
            INNOMA（イノーマ）は、日本全国の自治体ウェブサイトから情報を収集し、
            構造化されたデータとして提供するオープンソースプロジェクトです。
            Webクローラー、AIによるページ分類・データ変換、
            デジタル庁デザインシステム（DADS）に準拠したUIコンポーネントを活用し、
            誰もがアクセスしやすい行政情報の提供を目指しています。
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-5 rounded-lg border border-solid-gray-300">
              <h3 className="font-semibold text-solid-gray-900 mb-2">
                オープンソース
              </h3>
              <p className="text-sm text-solid-gray-600">
                すべてのコードはGitHubで公開されており、誰でも貢献できます。
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-solid-gray-300">
              <h3 className="font-semibold text-solid-gray-900 mb-2">
                DADS準拠
              </h3>
              <p className="text-sm text-solid-gray-600">
                デジタル庁デザインシステムに準拠した、アクセシブルなUIを提供します。
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-solid-gray-300">
              <h3 className="font-semibold text-solid-gray-900 mb-2">
                機械可読データ
              </h3>
              <p className="text-sm text-solid-gray-600">
                構造化されたJSONデータとして、APIからもアクセス可能です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-solid-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">INNOMA</h3>
              <p className="text-solid-gray-420 text-sm">
                日本の自治体情報をオープンに、アクセスしやすく。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">リンク</h4>
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
              <h4 className="font-semibold mb-4">プロジェクトについて</h4>
              <p className="text-solid-gray-420 text-sm">
                INNOMAはオープンソースプロジェクトです。
                貢献を歓迎します。
              </p>
            </div>
          </div>
          <div className="border-t border-solid-gray-700 mt-8 pt-8 text-center text-solid-gray-536 text-sm">
            <p>&copy; {new Date().getFullYear()} INNOMA Project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
