import React from "react";
import NextLink from "next/link";
import Image from "next/image";
import { Link, Button } from "@/components/dads";
import { getMunicipalities } from "@/lib/template";
import { ScrollAnimations } from "@/components/landing/ScrollAnimations";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import Footer from "@/components/layout/Footer";

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
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-end">
            <nav className="flex items-center gap-6">
              <Link asChild>
                <NextLink href="/municipalities" className="text-solid-gray-600 hover:text-solid-gray-900 transition-colors text-sm font-medium">
                  自治体一覧
                </NextLink>
              </Link>
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

          <p className="text-base md:text-lg text-solid-gray-600 mb-8 max-w-xl mx-auto animate-fade-in-up [animation-delay:200ms] opacity-0">
            INformationNormalizationMatrix
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

          <div className="flex justify-center mt-16">
            <div className="animate-on-scroll max-w-2xl">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-solid-gray-200">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-solid-gray-900 mb-4">
                  JIS X 8341-3:2016 適合レベルAA
                </h3>
                <p className="text-solid-gray-600 leading-relaxed text-lg">
                  日本の<strong className="text-solid-gray-900">ウェブアクセシビリティ規格に準拠</strong>。スクリーンリーダー対応、キーボードナビゲーション、十分なコントラスト比を確保し、誰もが快適に情報にアクセスできる設計を実現しています。
                </p>
              </div>
            </div>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "検索クエリ生成",
                  description: "LLMが自治体名と変数名から最適な検索クエリを自動生成。自治体の特性を考慮した精度の高い検索を実現します。",
                  tech: "Google Gemini",
                },
                {
                  step: "2",
                  title: "Web検索実行",
                  description: "生成されたクエリでBrave Search APIを使用して検索。自治体公式サイトや信頼できる情報源を優先的に取得します。",
                  tech: "Brave Search API",
                },
                {
                  step: "3",
                  title: "ページ取得",
                  description: "検索結果のURLからHTMLコンテンツを取得。PDF・画像もOCRで読み取り、あらゆる形式の情報に対応します。",
                  tech: "Web Scraping + OCR",
                },
                {
                  step: "4",
                  title: "情報抽出",
                  description: "取得したページからLLMが必要な情報を抽出・構造化。テンプレート変数に最適な形式で情報を整理します。",
                  tech: "Google Gemini",
                },
                {
                  step: "5",
                  title: "管理者承認",
                  description: "抽出された情報を管理者が確認・承認。AIと人間のチェックで正確性を担保します。",
                  tech: "承認ワークフロー",
                },
                {
                  step: "6",
                  title: "公開",
                  description: "承認された情報が自動的にWebサイトに反映され、住民が最新の正確な情報にアクセスできるようになります。",
                  tech: "自動デプロイ",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-200"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-xs text-blue-400 font-semibold">{item.tech}</p>
                    </div>
                  </div>
                  <p className="text-sm text-solid-gray-400 leading-relaxed">
                    {item.description}
                  </p>
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

      <Footer />
    </div>
  );
}
