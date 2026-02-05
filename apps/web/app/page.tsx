import NextLink from "next/link";
import Image from "next/image";
import { Link, Button } from "@/components/dads";
import { getMunicipalities } from "@/lib/template";
import { ScrollAnimations } from "@/components/landing/ScrollAnimations";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";

// 3種のページタイプ
const PAGE_TYPES = [
  {
    id: "service",
    name: "Service",
    nameJa: "サービス",
    description: "主題についての説明ページ。制度の概要、対象者、申請方法などを網羅的に解説します。",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: "#3b82f6",
    example: "児童手当とは？",
  },
  {
    id: "guide",
    name: "Guide",
    nameJa: "ガイド",
    description: "実行手順と実行リンクへのページ。ステップバイステップで手続きの方法を案内します。",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    color: "#8b5cf6",
    example: "児童手当の申請方法",
  },
  {
    id: "answer",
    name: "Answer",
    nameJa: "アンサー",
    description: "自分が対象者かを質問に答えながら見つけるページ。条件分岐で最適な情報に導きます。",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    color: "#ec4899",
    example: "私は児童手当を受けられる？",
  },
];

// UI設計の特徴
const UI_FEATURES = [
  {
    title: "デジタル庁デザインシステム",
    description: "DADS準拠のUIコンポーネントで、一貫性のあるデザインを実現。毎回新しいデザインを作る必要がなくなります。",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    title: "ワーキングメモリーに優しい",
    description: "長文を避け、情報を最適な形式で表示。似た情報は箇条書きへ、比較する情報は表形式へ自動変換します。",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "アクセシビリティ対応",
    description: "WCAG 2.1 AA準拠。スクリーンリーダー対応、キーボードナビゲーション、十分なコントラスト比を確保。",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// 技術的特徴
const TECH_FEATURES = [
  {
    title: "テンプレートベース",
    description: "一度テンプレートを作れば、全国すべての自治体に適用可能。650以上の変数で自治体固有の情報を差し替えます。",
    stat: "650",
    statLabel: "変数",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "AI自動情報取得",
    description: "LLM + Web検索APIで自治体公式サイトから情報を自動収集。PDF/画像もOCRで読み取り可能。",
    stat: "15",
    statLabel: "カテゴリ",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    title: "承認ワークフロー",
    description: "AIが取得した情報は管理者が確認・承認。人間の目で正確性を担保してから公開されます。",
    stat: "100",
    statLabel: "%正確性",
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const allMunicipalities = await getMunicipalities();
  const publishedMunicipalities = allMunicipalities
    .filter((m) => m.status === "published")
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <ScrollAnimations />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-solid-gray-50 overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.svg"
                alt="INNOMA"
                width={120}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </div>
            <nav className="flex items-center gap-6">
              <Link asChild>
                <NextLink href="/municipalities" className="text-solid-gray-600 hover:text-solid-gray-900 transition-colors text-sm font-medium">
                  自治体一覧
                </NextLink>
              </Link>
              <Button asChild size="md" variant="outline" className="flex items-center justify-center">
                <NextLink href="/admin">管理画面</NextLink>
              </Button>
            </nav>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="mb-8">
            <Image
              src="/images/logo.svg"
              alt="INNOMA"
              width={280}
              height={100}
              className="mx-auto h-20 md:h-28 w-auto"
              priority
            />
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-solid-gray-900 mb-6 animate-fade-in-up [animation-delay:200ms] opacity-0 leading-tight">
            誰しもが情報を<span className="text-blue-600">理解できる</span>
          </h1>

          <p className="text-base md:text-lg text-solid-gray-600 mb-8 max-w-xl mx-auto animate-fade-in-up [animation-delay:400ms] opacity-0">
            自治体情報を分かりやすく届けるオープンソースプロジェクト
          </p>

          <div className="flex justify-center animate-fade-in-up [animation-delay:600ms] opacity-0">
            <Button asChild size="lg" variant="solid-fill" className="!px-8 !py-4 !text-lg font-semibold flex items-center justify-center">
              <NextLink href="/municipalities">自治体を探す</NextLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 md:py-32 bg-solid-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-on-scroll">
            <p className="text-blue-600 font-semibold mb-4 tracking-wide">PHILOSOPHY</p>
            <h2 className="text-3xl md:text-5xl font-bold text-solid-gray-900 mb-8 line-decoration">
              INNOMAの思想
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mt-16">
            <div className="animate-on-scroll">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-solid-gray-200 h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-solid-gray-900 mb-4">
                  「情報にアクセスする」とは
                </h3>
                <p className="text-solid-gray-600 leading-relaxed text-lg">
                  単に情報を見つけるだけでなく、<strong className="text-solid-gray-900">その情報を理解する</strong>ことまでを意味します。INNOMAは「見つける」と「理解する」の両方を支援します。
                </p>
              </div>
            </div>

            <div className="animate-on-scroll">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-solid-gray-200 h-full">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-solid-gray-900 mb-4">
                  なぜ必要なのか
                </h3>
                <p className="text-solid-gray-600 leading-relaxed text-lg">
                  PISAの調査によると、日本人の<strong className="text-solid-gray-900">13.8%は長文を理解することが難しい</strong>とされています。少子高齢化が進む日本では、情報を理解しやすく届けることが急務です。
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { value: 13.8, suffix: "%", label: "長文理解が難しい日本人" },
              { value: 4, suffix: "倍", label: "55-65歳 vs 16-34歳" },
              { value: 1741, suffix: "", label: "日本の自治体数" },
              { value: 650, suffix: "+", label: "テンプレート変数" },
            ].map((stat, i) => (
              <div key={i} className="animate-on-scroll text-center p-6 bg-white rounded-xl border border-solid-gray-200">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 stat-number">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-solid-gray-600 text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Information Architecture Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-on-scroll">
            <p className="text-blue-600 font-semibold mb-4 tracking-wide">INFORMATION ARCHITECTURE</p>
            <h2 className="text-3xl md:text-5xl font-bold text-solid-gray-900 mb-6 line-decoration">
              INNOMAの情報設計
            </h2>
            <p className="text-solid-gray-600 text-lg max-w-3xl mt-8">
              GOV.UK、Local Gov Drupalのタクソノミー（分類法）を参考に、ページを「ターゲット」や「メディア形態」ではなく、
              <strong className="text-solid-gray-900">純粋に「題材」の名詞だけで分類</strong>。必要なページのみを作成し、シンプルな構造を維持します。
            </p>
          </div>

          {/* 3 Page Types */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-solid-gray-900 mb-8 animate-on-scroll">3種のページタイプ</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {PAGE_TYPES.map((type) => (
                <div
                  key={type.id}
                  className="animate-on-scroll page-type-card bg-solid-gray-50 rounded-2xl p-8 hover-lift"
                  style={{ "--card-color": type.color } as React.CSSProperties}
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 feature-icon"
                    style={{ backgroundColor: `${type.color}15`, color: type.color }}
                  >
                    {type.icon}
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-2xl font-bold" style={{ color: type.color }}>
                      {type.name}
                    </span>
                    <span className="text-solid-gray-500 text-sm">{type.nameJa}</span>
                  </div>
                  <p className="text-solid-gray-600 leading-relaxed mb-4">
                    {type.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-solid-gray-200">
                    <p className="text-sm text-solid-gray-500">例:</p>
                    <p className="text-solid-gray-900 font-medium">{type.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UI Design Section */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-solid-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-on-scroll">
            <p className="text-blue-600 font-semibold mb-4 tracking-wide">UI DESIGN</p>
            <h2 className="text-3xl md:text-5xl font-bold text-solid-gray-900 mb-6 line-decoration">
              INNOMAのUI設計
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {UI_FEATURES.map((feature, i) => (
              <div key={i} className="animate-on-scroll feature-card">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-solid-gray-200 h-full hover-lift">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600 feature-icon">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-solid-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-solid-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Demo */}
          <div className="mt-20 animate-on-scroll">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-solid-gray-200">
              <h3 className="text-xl font-bold text-solid-gray-900 mb-6">ワーキングメモリーに優しい画面構成</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-red-500 font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    従来の自治体サイト
                  </p>
                  <div className="bg-solid-gray-100 rounded-lg p-4 text-sm text-solid-gray-600 leading-relaxed">
                    住民票の写しの交付を受けるには、本人確認書類（運転免許証、パスポート、マイナンバーカード、健康保険証など）をお持ちの上、市民課窓口までお越しください。手数料は1通300円です。なお、代理人が申請する場合は委任状が必要となります。郵送での申請も可能ですが、その場合は本人確認書類の写しと返信用封筒（切手貼付）を同封してください。
                  </div>
                </div>
                <div>
                  <p className="text-green-500 font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    INNOMAの表示
                  </p>
                  <div className="bg-solid-gray-100 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-solid-gray-900 mb-2">必要なもの</p>
                    <ul className="list-disc list-inside text-solid-gray-600 space-y-1 mb-3">
                      <li>本人確認書類</li>
                      <li>手数料 300円/通</li>
                    </ul>
                    <p className="font-semibold text-solid-gray-900 mb-2">申請方法</p>
                    <div className="flex gap-2 text-solid-gray-600">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">窓口</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">郵送</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 md:py-32 bg-solid-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30"></div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="animate-on-scroll">
            <p className="text-blue-400 font-semibold mb-4 tracking-wide">TECHNOLOGY</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              INNOMAの運用設計
            </h2>
            <p className="text-solid-gray-400 text-lg max-w-3xl">
              テンプレートベースのアーキテクチャとAIによる自動情報取得で、
              <strong className="text-white">低コストかつ高品質</strong>な自治体サイトを全国展開します。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {TECH_FEATURES.map((feature, i) => (
              <div key={i} className="animate-on-scroll">
                <div className="glass-card rounded-2xl p-8 h-full">
                  <div className="text-blue-400 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-solid-gray-400 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <div className="pt-4 border-t border-white/10">
                    <span className="text-4xl font-bold text-blue-400">
                      <AnimatedCounter end={parseInt(feature.stat)} suffix="" />
                    </span>
                    <span className="text-solid-gray-500 ml-2">{feature.statLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Flow Diagram */}
          <div className="mt-20 animate-on-scroll">
            <h3 className="text-xl font-bold mb-8">情報取得フロー</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              {[
                { step: "1", label: "検索クエリ生成", icon: "AI" },
                { step: "2", label: "Web検索実行", icon: "検索" },
                { step: "3", label: "ページ取得", icon: "取得" },
                { step: "4", label: "情報抽出", icon: "抽出" },
                { step: "5", label: "管理者承認", icon: "承認" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 md:gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {item.icon}
                    </div>
                    <p className="text-sm text-solid-gray-400 mt-2 text-center">{item.label}</p>
                  </div>
                  {i < 4 && (
                    <svg className="w-6 h-6 text-blue-600 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Municipalities Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 animate-on-scroll">
            <div>
              <p className="text-blue-600 font-semibold mb-4 tracking-wide">MUNICIPALITIES</p>
              <h2 className="text-3xl md:text-5xl font-bold text-solid-gray-900 line-decoration">
                対応自治体
              </h2>
            </div>
            <Link asChild>
              <NextLink href="/municipalities" className="mt-4 md:mt-0 text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                すべて見る
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </NextLink>
            </Link>
          </div>

          {publishedMunicipalities.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedMunicipalities.map((municipality) => (
                <NextLink
                  key={municipality.id}
                  href={`/${municipality.id}`}
                  className="animate-on-scroll group block p-6 bg-solid-gray-50 rounded-xl border border-solid-gray-200 hover-lift focus-visible:outline focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-solid-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {municipality.name}
                      </h3>
                      <p className="text-sm text-solid-gray-500">
                        {municipality.prefecture}
                      </p>
                    </div>
                    <span className="text-solid-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </NextLink>
              ))}
            </div>
          ) : (
            <div className="animate-on-scroll text-center py-16 bg-solid-gray-50 rounded-2xl">
              <p className="text-solid-gray-500">現在公開中の自治体はありません</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="animate-on-scroll">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              一緒に日本の行政情報を
              <br />
              もっとアクセスしやすく
            </h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              INNOMAはオープンソースプロジェクトです。
              開発への貢献、フィードバック、導入のご相談をお待ちしています。
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg" variant="solid-fill" className="!bg-white !text-blue-700 hover:!bg-blue-50 !px-8 !py-4 !text-lg font-semibold flex items-center justify-center">
                <a href="https://github.com/TakuO-gu/INNOMA" target="_blank" rel="noopener noreferrer">
                  GitHubで見る
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-solid-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Image
                src="/images/logo.svg"
                alt="INNOMA"
                width={140}
                height={50}
                className="h-10 w-auto brightness-0 invert mb-4"
              />
              <p className="text-solid-gray-400 leading-relaxed max-w-sm">
                日本の自治体情報をオープンに、アクセスしやすく。
                誰もが必要な情報を見つけ、理解できる社会を目指します。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">リンク</h4>
              <ul className="space-y-3 text-solid-gray-400">
                <li>
                  <NextLink href="/municipalities" className="hover:text-white transition-colors">
                    自治体一覧
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/admin" className="hover:text-white transition-colors">
                    管理画面
                  </NextLink>
                </li>
                <li>
                  <a
                    href="https://github.com/TakuO-gu/INNOMA"
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
              <h4 className="font-semibold mb-4">技術</h4>
              <ul className="space-y-3 text-solid-gray-400 text-sm">
                <li>Next.js 15</li>
                <li>デジタル庁デザインシステム</li>
                <li>Google Gemini</li>
                <li>Brave Search API</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-solid-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-solid-gray-500 text-sm">
              &copy; {new Date().getFullYear()} INNOMA Project. Open Source under MIT License.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/TakuO-gu/INNOMA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-solid-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
