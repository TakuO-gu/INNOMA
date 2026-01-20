import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import {
  Link,
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  EmergencyBanner,
  EmergencyBannerHeading,
  EmergencyBannerBody,
  ResourceList,
  ResourceListItem,
  ResourceListLink,
  ResourceListTitle,
  ResourceListDescription,
} from "@/components/dads";
import { SearchBox } from "@/components/search";
import { loadArtifact } from "@/lib/artifact/loader";
import type { InnomaArtifactValidated } from "@/lib/artifact/schema";

/**
 * ブロック配列から指定タイプの最初のブロックを取得（柔軟な型用）
 */
function findBlockByType(
  blocks: InnomaArtifactValidated["blocks"],
  type: string
): InnomaArtifactValidated["blocks"][number] | undefined {
  return blocks.find((b) => b.type === type);
}

// 自治体IDから表示名へのマッピング（Artifactがない場合のフォールバック用）
const MUNICIPALITY_NAMES: Record<string, { name: string; prefecture: string }> = {
  sample: { name: "サンプル市", prefecture: "東京都" },
  utashinai: { name: "歌志内市", prefecture: "北海道" },
};

type TopicItem = {
  title: string;
  href: string;
  description?: string;
  category?: string;
};

type EmergencyInfo = {
  title: string;
  content?: Array<{ type: string; runs?: Array<{ text: string }> }>;
  href?: string;
  severity?: string;
};

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Artifactを読み込み
  const artifactKey = `${id}/home.json`;
  const result = await loadArtifact(artifactKey);

  // Artifactが見つからない場合
  if (!result.success) {
    // フォールバック: 既知の自治体IDかチェック
    if (!MUNICIPALITY_NAMES[id]) {
      notFound();
    }
    // 静的なフォールバックページを表示
    return <FallbackMunicipalityPage id={id} />;
  }

  const artifact = result.artifact;

  // ブロックからデータを抽出
  const emergencyBanner = findBlockByType(artifact.blocks, "EmergencyBanner");
  const topicGrid = findBlockByType(artifact.blocks, "TopicGrid");
  const contact = findBlockByType(artifact.blocks, "Contact");

  // メタデータの取得（v2形式: artifact直下、v1形式: 非推奨）
  // v2スキーマでは municipality_id と source.fetched_at を使用
  const artifactAny = artifact as Record<string, unknown>;
  const municipalityName = artifact.title || MUNICIPALITY_NAMES[id]?.name || id;
  const prefecture = MUNICIPALITY_NAMES[id]?.prefecture || "";
  const extractedAt = artifact.source?.fetched_at || (artifactAny.metadata as Record<string, string> | undefined)?.extractedAt;

  // TopicGridからトピック一覧を取得
  const topics: TopicItem[] = (topicGrid?.props?.items as TopicItem[]) || [];

  // EmergencyBannerからデータを取得
  const emergencyInfo: EmergencyInfo | null = emergencyBanner
    ? (emergencyBanner.props as EmergencyInfo)
    : null;

  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Breadcrumbs className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <NextLink href="/">ホーム</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <NextLink href="/municipalities">自治体一覧</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <span className="text-solid-gray-900">{municipalityName}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumbs>
            {prefecture && (
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 text-sm font-medium text-blue-1000 bg-blue-100 rounded">
                  {prefecture}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-solid-gray-900 mb-2">
              {municipalityName}
            </h1>
            {extractedAt && (
              <p className="text-solid-gray-600">
                更新日: {new Date(extractedAt).toLocaleDateString("ja-JP")}
              </p>
            )}
          </div>
        </section>

        {/* Emergency Info */}
        {emergencyInfo && (
          <section className="max-w-7xl mx-auto px-4 py-4">
            <EmergencyBanner>
              <EmergencyBannerHeading level="h2">緊急情報</EmergencyBannerHeading>
              <EmergencyBannerBody>
                <div>
                  {emergencyInfo.href ? (
                    <Link asChild>
                      <NextLink href={convertToInternalLink(emergencyInfo.href, id)}>
                        {emergencyInfo.title}
                      </NextLink>
                    </Link>
                  ) : (
                    <span className="font-bold">{emergencyInfo.title}</span>
                  )}
                  {emergencyInfo.content && emergencyInfo.content[0]?.runs && (
                    <p className="mt-1 text-sm">
                      {emergencyInfo.content[0].runs.map((r) => r.text).join("")}
                    </p>
                  )}
                </div>
              </EmergencyBannerBody>
            </EmergencyBanner>
          </section>
        )}

        {/* Search Bar */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <SearchBox
            placeholder={`${municipalityName}の情報を検索...`}
            size="lg"
            className="max-w-2xl"
          />
        </section>

        {/* Topics Resource List */}
        {topics.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 pb-12">
            <ResourceList>
              {topics.map((topic, i) => (
                <ResourceListItem key={i} asChild>
                  <ResourceListLink asChild>
                    <NextLink href={convertToInternalLink(topic.href, id)}>
                      <ResourceListTitle>{topic.title}</ResourceListTitle>
                      {topic.description && (
                        <ResourceListDescription>
                          {topic.description}
                        </ResourceListDescription>
                      )}
                    </NextLink>
                  </ResourceListLink>
                </ResourceListItem>
              ))}
            </ResourceList>
          </section>
        )}

        {/* Contact */}
        {contact && (
          <section className="max-w-7xl mx-auto px-4 pb-12">
            <div className="bg-white border border-solid-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-bold text-solid-gray-900 mb-4">
                お問い合わせ
              </h2>
              <dl className="space-y-2 text-solid-gray-600">
                {(contact.props as Record<string, string>).dept && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">担当課</dt>
                    <dd>{(contact.props as Record<string, string>).dept}</dd>
                  </div>
                )}
                {(contact.props as Record<string, string>).tel && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">電話</dt>
                    <dd>{(contact.props as Record<string, string>).tel}</dd>
                  </div>
                )}
                {(contact.props as Record<string, string>).email && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">メール</dt>
                    <dd>{(contact.props as Record<string, string>).email}</dd>
                  </div>
                )}
                {(contact.props as Record<string, string>).hours && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">受付時間</dt>
                    <dd>{(contact.props as Record<string, string>).hours}</dd>
                  </div>
                )}
                {(contact.props as Record<string, string>).address && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">所在地</dt>
                    <dd>{(contact.props as Record<string, string>).address}</dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

/**
 * 外部URLを内部リンクに変換
 */
function convertToInternalLink(href: string, municipalityId: string): string {
  // 既に内部リンクの場合はそのまま返す
  if (href.startsWith("/")) {
    return href;
  }

  // サンプル市の外部URLを内部パスに変換
  if (href.includes("sample-city.lg.jp")) {
    const url = new URL(href);
    return `/municipalities/${municipalityId}${url.pathname}`;
  }

  // その他の外部URLはそのまま返す
  return href;
}

/**
 * Artifactがない場合のフォールバックページ
 */
function FallbackMunicipalityPage({ id }: { id: string }) {
  const info = MUNICIPALITY_NAMES[id];

  return (
    <div className="min-h-screen bg-solid-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-white border-b border-solid-gray-300">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Breadcrumbs className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <NextLink href="/">ホーム</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <NextLink href="/municipalities">自治体一覧</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <span className="text-solid-gray-900">{info?.name || id}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumbs>
            {info?.prefecture && (
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 text-sm font-medium text-blue-1000 bg-blue-100 rounded">
                  {info.prefecture}
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-solid-gray-900 mb-2">
              {info?.name || id}
            </h1>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white border border-solid-gray-300 rounded-lg p-8 text-center">
            <p className="text-lg text-solid-gray-600 mb-4">
              この自治体のデータは現在準備中です。
            </p>
            <p className="text-solid-gray-500">
              クローラーでデータを取得後、表示されます。
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Artifactを読み込み
  const artifactKey = `${id}/home.json`;
  const result = await loadArtifact(artifactKey);

  if (!result.success) {
    const info = MUNICIPALITY_NAMES[id];
    if (!info) {
      return { title: "Not Found - INNOMA" };
    }
    return {
      title: `${info.name} - INNOMA`,
      description: `${info.name}（${info.prefecture}）の行政情報。`,
    };
  }

  const artifact = result.artifact;
  const municipalityName = artifact.title || id;
  const prefecture = MUNICIPALITY_NAMES[id]?.prefecture || "";
  const description = artifact.description || artifact.search?.summary;

  return {
    title: `${municipalityName} - INNOMA`,
    description:
      description ||
      `${municipalityName}${prefecture ? `（${prefecture}）` : ""}の行政情報。届出、子育て、健康、税金などの手続き案内を確認できます。`,
  };
}
