import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  ResourceList,
  ResourceListItem,
  ResourceListLink,
  ResourceListTitle,
  ResourceListDescription,
} from "@/components/dads";

// 環境・ごみのservice_landingページ（Artifactデータがないので仮データ）
const pageData = {
  title: "環境・ごみ",
  description: "サンプル市のごみの出し方、リサイクル、環境保全に関する情報。",
  sections: [
    {
      title: "ごみの出し方",
      items: [
        {
          title: "家庭ごみの出し方",
          href: "/municipalities/sample/services/environment/garbage",
          description: "燃やすごみ、燃やさないごみ、資源ごみの分別方法",
        },
        {
          title: "粗大ごみの出し方",
          href: "/municipalities/sample/services/environment/sodaigomi",
          description: "大型ごみの申込方法と手数料",
        },
        {
          title: "ごみ収集カレンダー",
          href: "/municipalities/sample/services/environment/calendar",
          description: "地区別の収集日カレンダー",
        },
      ],
    },
    {
      title: "リサイクル",
      items: [
        {
          title: "資源ごみの出し方",
          href: "/municipalities/sample/services/environment/recycle",
          description: "びん、缶、ペットボトル、古紙など",
        },
        {
          title: "小型家電リサイクル",
          href: "/municipalities/sample/services/environment/kaden-recycle",
          description: "携帯電話、デジカメなどの回収",
        },
      ],
    },
    {
      title: "届出・申請",
      items: [
        {
          title: "犬の登録",
          href: "/municipalities/sample/services/environment/dog",
          description: "飼い犬の登録と狂犬病予防注射",
        },
      ],
    },
  ],
  contact: {
    dept: "環境課",
    tel: "03-1234-5681",
    email: "kankyo@sample-city.lg.jp",
    hours: "平日 8:30〜17:15",
    address: "サンプル市役所 3階",
  },
};

export default function EnvironmentLandingPage() {
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
                    <NextLink href="/municipalities/sample">サンプル市</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <span className="text-solid-gray-900">{pageData.title}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumbs>

            <h1 className="text-3xl font-bold text-solid-gray-900 mb-4">
              {pageData.title}
            </h1>

            <p className="text-lg text-solid-gray-600 max-w-3xl">
              {pageData.description}
            </p>
          </div>
        </section>

        {/* Service Link List */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          {pageData.sections.map((section, i) => (
            <div key={i} className="mb-8">
              <h2 className="text-xl font-bold text-solid-gray-900 mb-4 pb-2 border-b border-solid-gray-300">
                {section.title}
              </h2>
              <ResourceList>
                {section.items.map((item, j) => (
                  <ResourceListItem key={j} asChild>
                    <ResourceListLink asChild>
                      <NextLink href={item.href}>
                        <ResourceListTitle>{item.title}</ResourceListTitle>
                        {item.description && (
                          <ResourceListDescription>{item.description}</ResourceListDescription>
                        )}
                      </NextLink>
                    </ResourceListLink>
                  </ResourceListItem>
                ))}
              </ResourceList>
            </div>
          ))}
        </section>

        {/* Contact */}
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="bg-white border border-solid-gray-300 rounded-lg p-6">
            <h2 className="text-lg font-bold text-solid-gray-900 mb-4">お問い合わせ</h2>
            <dl className="space-y-2 text-solid-gray-600">
              <div className="flex gap-4">
                <dt className="font-medium w-24">担当課</dt>
                <dd>{pageData.contact.dept}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium w-24">電話</dt>
                <dd>{pageData.contact.tel}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium w-24">メール</dt>
                <dd>{pageData.contact.email}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium w-24">受付時間</dt>
                <dd>{pageData.contact.hours}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-medium w-24">所在地</dt>
                <dd>{pageData.contact.address}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export const metadata = {
  title: `${pageData.title} - サンプル市 - INNOMA`,
  description: pageData.description,
};
