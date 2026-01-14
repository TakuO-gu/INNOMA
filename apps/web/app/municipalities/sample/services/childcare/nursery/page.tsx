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
import artifact from "@/data/artifacts/sample/services/childcare/nursery.json";

export default function NurserySublandingPage() {
  // ServiceLinkListブロックを取得
  const serviceLinkListBlock = artifact.blocks.find(
    (b) => b.type === "ServiceLinkList"
  ) as { type: "ServiceLinkList"; props: { sections: Array<{ title: string; items: Array<{ title: string; href: string; description?: string }> }> } } | undefined;

  // Contactブロックを取得
  const contactBlock = artifact.blocks.find(
    (b) => b.type === "Contact"
  ) as { type: "Contact"; props: { dept?: string; tel?: string; email?: string; hours?: string; address?: string } } | undefined;

  // RelatedTopicsブロックを取得
  const relatedTopicsBlock = artifact.blocks.find(
    (b) => b.type === "RelatedTopics"
  ) as { type: "RelatedTopics"; props: { items: Array<{ title: string; href: string }> } } | undefined;

  // Summaryブロックを取得
  const summaryBlock = artifact.blocks.find(
    (b) => b.type === "Summary"
  ) as { type: "Summary"; props: { content: string } } | undefined;

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
                  <BreadcrumbLink asChild>
                    <NextLink href="/municipalities/sample/services/childcare">子育て</NextLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <span className="text-solid-gray-900">{artifact.title}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumbs>

            <h1 className="text-3xl font-bold text-solid-gray-900 mb-4">
              {artifact.title}
            </h1>

            {summaryBlock && (
              <p className="text-lg text-solid-gray-600 max-w-3xl">
                {summaryBlock.props.content}
              </p>
            )}
          </div>
        </section>

        {/* Service Link List */}
        {serviceLinkListBlock && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            {serviceLinkListBlock.props.sections.map((section, i) => (
              <div key={i} className="mb-8">
                <h2 className="text-xl font-bold text-solid-gray-900 mb-4 pb-2 border-b border-solid-gray-300">
                  {section.title}
                </h2>
                <ResourceList>
                  {section.items.map((item, j) => (
                    <ResourceListItem key={j} asChild>
                      <ResourceListLink asChild>
                        <NextLink href={convertToInternalLink(item.href)}>
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
        )}

        {/* Related Topics */}
        {relatedTopicsBlock && (
          <section className="max-w-7xl mx-auto px-4 pb-8">
            <h2 className="text-lg font-bold text-solid-gray-900 mb-4">関連トピック</h2>
            <div className="flex flex-wrap gap-3">
              {relatedTopicsBlock.props.items.map((item, i) => (
                <NextLink
                  key={i}
                  href={item.href}
                  className="px-4 py-2 bg-white border border-solid-gray-300 rounded hover:bg-solid-gray-100 transition-colors"
                >
                  {item.title}
                </NextLink>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        {contactBlock && (
          <section className="max-w-7xl mx-auto px-4 pb-12">
            <div className="bg-white border border-solid-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-bold text-solid-gray-900 mb-4">お問い合わせ</h2>
              <dl className="space-y-2 text-solid-gray-600">
                {contactBlock.props.dept && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">担当課</dt>
                    <dd>{contactBlock.props.dept}</dd>
                  </div>
                )}
                {contactBlock.props.tel && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">電話</dt>
                    <dd>{contactBlock.props.tel}</dd>
                  </div>
                )}
                {contactBlock.props.email && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">メール</dt>
                    <dd>{contactBlock.props.email}</dd>
                  </div>
                )}
                {contactBlock.props.hours && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">受付時間</dt>
                    <dd>{contactBlock.props.hours}</dd>
                  </div>
                )}
                {contactBlock.props.address && (
                  <div className="flex gap-4">
                    <dt className="font-medium w-24">所在地</dt>
                    <dd>{contactBlock.props.address}</dd>
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

// 外部URLを内部リンクに変換
function convertToInternalLink(href: string): string {
  if (href.startsWith("https://www.sample-city.lg.jp/services/childcare/nursery/apply")) {
    return "/municipalities/sample/services/childcare/nursery/apply";
  }
  return href;
}

export const metadata = {
  title: `${artifact.title} - サンプル市 - INNOMA`,
  description: artifact.description,
};
