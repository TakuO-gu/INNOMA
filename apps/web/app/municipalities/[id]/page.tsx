import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { Link, Breadcrumbs, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, EmergencyBanner, EmergencyBannerHeading, EmergencyBannerBody, ResourceList, ResourceListItem, ResourceListLink, ResourceListTitle, ResourceListDescription } from "@/components/dads";
import { SearchBox } from "@/components/search";

type TopicItem = {
  title: string;
};

type Topic = {
  name: string;
  description: string;
  href?: string;
  items: TopicItem[];
};

type EmergencyItem = {
  title: string;
  importance: "high" | "medium" | "low";
  url?: string;
};

type MunicipalData = {
  metadata: {
    sourceUrl: string;
    extractedAt: string;
    municipality: string;
    prefecture: string;
  };
  emergencyInfo: EmergencyItem[];
  topics: Topic[];
};

function getMunicipalData(id: string): MunicipalData | null {
  const baseUrl = `/municipalities/${id}`;
  const data: Record<string, MunicipalData> = {
    utashinai: {
      metadata: {
        sourceUrl: "https://www.city.utashinai.hokkaido.jp/",
        extractedAt: "2025-11-25T03:02:35.762Z",
        municipality: "歌志内市",
        prefecture: "北海道",
      },
      emergencyInfo: [
        {
          title: "避難所について",
          importance: "high",
          url: `${baseUrl}/emergency`,
        },
      ],
      topics: [
        {
          name: "出生・死亡・婚姻届",
          description: "出生届、死亡届、婚姻届、離婚届",
          items: [
            { title: "出生届" },
            { title: "死亡届" },
            { title: "婚姻届" },
            { title: "離婚届" },
            { title: "埋葬・火葬許可" },
          ],
        },
        {
          name: "子育て・教育",
          description: "児童手当、保育園、学校、子ども医療費助成",
          items: [
            { title: "児童手当" },
            { title: "保育園・幼稚園" },
            { title: "小学校・中学校" },
            { title: "子ども医療費助成" },
          ],
        },
        {
          name: "福祉・介護",
          description: "介護保険、障害者福祉、高齢者支援",
          items: [
            { title: "介護保険" },
            { title: "障害者福祉" },
            { title: "高齢者福祉サービス" },
            { title: "生活保護" },
          ],
        },
        {
          name: "健康・医療",
          description: "国民健康保険、予防接種、健康診断",
          items: [
            { title: "国民健康保険" },
            { title: "後期高齢者医療" },
            { title: "予防接種" },
            { title: "健康診断・検診" },
          ],
        },
        {
          name: "年金・保険",
          description: "国民年金、各種保険",
          items: [
            { title: "国民年金" },
            { title: "国民健康保険" },
            { title: "年金相談" },
          ],
        },
        {
          name: "税金",
          description: "市民税・道民税、固定資産税、軽自動車税",
          items: [
            { title: "市民税・道民税" },
            { title: "固定資産税" },
            { title: "軽自動車税" },
            { title: "納税証明書" },
          ],
        },
        {
          name: "住まい・まちづくり",
          description: "公営住宅、建築、都市計画",
          items: [
            { title: "公営住宅" },
            { title: "建築確認申請" },
            { title: "空き家対策" },
          ],
        },
        {
          name: "ごみ・環境・ペット",
          description: "ごみの出し方、リサイクル、犬の届出",
          items: [
            { title: "ごみの出し方" },
            { title: "粗大ごみ" },
            { title: "リサイクル" },
            { title: "犬の登録" },
          ],
        },
        {
          name: "防災・安全",
          description: "避難所、防災情報、消防",
          items: [
            { title: "避難所・避難場所" },
            { title: "防災マップ" },
            { title: "消防・救急" },
          ],
        },
      ],
    },
    sample: {
      metadata: {
        sourceUrl: "https://www.sample-city.lg.jp/",
        extractedAt: "2025-01-14T00:00:00.000Z",
        municipality: "サンプル市",
        prefecture: "東京都",
      },
      emergencyInfo: [
        {
          title: "台風15号に関する情報",
          importance: "high",
          url: `${baseUrl}/emergency/typhoon15`,
        },
      ],
      topics: [
        {
          name: "届出・届出・家族",
          description: "出生届、婚姻届、転入届など",
          items: [
            { title: "出生届" },
            { title: "死亡届" },
            { title: "婚姻届" },
            { title: "転入届" },
            { title: "転出届" },
          ],
        },
        {
          name: "子育て",
          description: "保育園、児童手当、子育て支援",
          href: `${baseUrl}/services/childcare`,
          items: [
            { title: "保育園の入園申込" },
            { title: "児童手当" },
            { title: "子ども医療費助成" },
            { title: "学童保育" },
          ],
        },
        {
          name: "福祉・介護",
          description: "介護保険、障害者支援、生活保護",
          items: [
            { title: "介護保険" },
            { title: "障害者福祉" },
            { title: "生活保護" },
          ],
        },
        {
          name: "健康・医療",
          description: "国民健康保険、予防接種、検診",
          items: [
            { title: "国民健康保険" },
            { title: "予防接種" },
            { title: "健康診断・検診" },
          ],
        },
        {
          name: "税金",
          description: "住民税、固定資産税、納税",
          items: [
            { title: "住民税" },
            { title: "固定資産税" },
            { title: "納税証明書" },
          ],
        },
        {
          name: "環境・ごみ",
          description: "ごみの出し方、リサイクル",
          href: `${baseUrl}/services/environment`,
          items: [
            { title: "ごみの出し方" },
            { title: "粗大ごみ" },
            { title: "リサイクル" },
          ],
        },
        {
          name: "住まい・施設",
          description: "公営住宅、公共施設",
          items: [
            { title: "公営住宅" },
            { title: "公共施設案内" },
          ],
        },
        {
          name: "防災・災害",
          description: "避難所、ハザードマップ",
          items: [
            { title: "避難所一覧" },
            { title: "ハザードマップ" },
            { title: "防災訓練" },
          ],
        },
        {
          name: "高齢者・介護",
          description: "介護保険、高齢者支援",
          items: [
            { title: "介護保険" },
            { title: "高齢者支援サービス" },
          ],
        },
      ],
    },
  };
  return data[id] || null;
}


export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getMunicipalData(id);

  if (!data) {
    notFound();
  }

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
                  <span className="text-solid-gray-900">{data.metadata.municipality}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumbs>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 text-sm font-medium text-blue-1000 bg-blue-100 rounded">
                {data.metadata.prefecture}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-solid-gray-900 mb-2">
              {data.metadata.municipality}
            </h1>
            <p className="text-solid-gray-600">
              更新日: {new Date(data.metadata.extractedAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
        </section>

        {/* Emergency Info */}
        {data.emergencyInfo.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-4">
            <EmergencyBanner>
              <EmergencyBannerHeading level="h2">緊急情報</EmergencyBannerHeading>
              <EmergencyBannerBody>
                <ul className="space-y-1">
                  {data.emergencyInfo.map((info, i) => (
                    <li key={i}>
                      {info.url ? (
                        <Link asChild>
                          <NextLink href={info.url}>
                            {info.title}
                          </NextLink>
                        </Link>
                      ) : (
                        <span>{info.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </EmergencyBannerBody>
            </EmergencyBanner>
          </section>
        )}

        {/* Search Bar */}
        <section className="max-w-7xl mx-auto px-4 py-6">
          <SearchBox
            placeholder={`${data.metadata.municipality}の情報を検索...`}
            size="lg"
            className="max-w-2xl"
          />
        </section>

        {/* Topics Resource List */}
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <ResourceList>
            {data.topics.map((topic, i) => (
              <ResourceListItem key={i} asChild>
                <ResourceListLink asChild>
                  <NextLink href={topic.href || `/municipalities/${id}/${encodeURIComponent(topic.name)}`}>
                    <ResourceListTitle>{topic.name}</ResourceListTitle>
                    <ResourceListDescription>{topic.description}</ResourceListDescription>
                  </NextLink>
                </ResourceListLink>
              </ResourceListItem>
            ))}
          </ResourceList>
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
  const data = getMunicipalData(id);
  if (!data) {
    return { title: "Not Found - INNOMA" };
  }
  return {
    title: `${data.metadata.municipality} - INNOMA`,
    description: `${data.metadata.municipality}（${data.metadata.prefecture}）の行政情報。届出、子育て、健康、税金などの手続き案内を確認できます。`,
  };
}
