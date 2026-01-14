import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  Link,
} from "@/components/dads";
import artifact from "@/data/artifacts/sample/services/environment/sodaigomi.json";

type RichTextNode = {
  type: string;
  text?: string;
  level?: number;
  runs?: Array<{ text: string; bold?: boolean; link?: { href: string; label: string } }>;
  ordered?: boolean;
  items?: RichTextNode[][];
  severity?: string;
  content?: RichTextNode[];
};

export default function SodaigomiPage() {
  // 各ブロックを取得
  const summaryBlock = artifact.blocks.find((b) => b.type === "Summary") as { type: "Summary"; props: { content: string } } | undefined;

  const richTextBlocks = artifact.blocks.filter((b) => b.type === "RichText") as Array<{
    type: "RichText";
    id: string;
    props: { content: RichTextNode[] }
  }>;

  const taskButtonBlock = artifact.blocks.find((b) => b.type === "TaskButton") as {
    type: "TaskButton";
    props: { label: string; href: string; isTopTask?: boolean }
  } | undefined;

  const infoTableBlock = artifact.blocks.find((b) => b.type === "InfoTable") as {
    type: "InfoTable";
    props: { rows: Array<{ label: string; value: RichTextNode[] }> }
  } | undefined;

  const relatedLinksBlock = artifact.blocks.find((b) => b.type === "RelatedLinks") as {
    type: "RelatedLinks";
    props: { items: Array<{ title: string; href: string }> }
  } | undefined;

  const contactBlock = artifact.blocks.find((b) => b.type === "Contact") as {
    type: "Contact";
    props: { dept?: string; tel?: string; email?: string; hours?: string; address?: string }
  } | undefined;

  // richtext-1 と richtext-2 を個別に取得
  const mainRichText = richTextBlocks.find((b) => b.id === "richtext-1");
  const phoneRichText = richTextBlocks.find((b) => b.id === "richtext-2");

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
                    <NextLink href="/municipalities/sample/services/environment">環境・ごみ</NextLink>
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

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Main Content */}
          {mainRichText && (
            <div className="prose prose-gray max-w-none mb-8">
              <RichTextRenderer nodes={mainRichText.props.content} />
            </div>
          )}

          {/* Info Table (手数料表) */}
          {infoTableBlock && (
            <div className="bg-white border border-solid-gray-300 rounded-lg overflow-hidden mb-8">
              <table className="w-full">
                <tbody>
                  {infoTableBlock.props.rows.map((row, i) => (
                    <tr key={i} className="border-b border-solid-gray-200 last:border-b-0">
                      <th className="px-4 py-3 bg-solid-gray-50 text-left font-medium text-solid-gray-700 w-2/3">
                        {row.label}
                      </th>
                      <td className="px-4 py-3 text-right font-bold">
                        <RichTextRenderer nodes={row.value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Task Button (インターネット申込) */}
          {taskButtonBlock && (
            <div className="mb-8">
              <a
                href={taskButtonBlock.props.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {taskButtonBlock.props.label}
              </a>
            </div>
          )}

          {/* Phone Contact Info */}
          {phoneRichText && (
            <div className="bg-solid-gray-100 border border-solid-gray-300 rounded-lg p-6 mb-8">
              <RichTextRenderer nodes={phoneRichText.props.content} />
            </div>
          )}

          {/* Related Links */}
          {relatedLinksBlock && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-solid-gray-900 mb-4">関連ページ</h2>
              <ul className="space-y-2">
                {relatedLinksBlock.props.items.map((item, i) => (
                  <li key={i}>
                    <Link asChild>
                      <a href={item.href}>
                        {item.title}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {contactBlock && (
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// RichTextNodeをレンダリングするコンポーネント
function RichTextRenderer({ nodes }: { nodes: RichTextNode[] }) {
  return (
    <>
      {nodes.map((node, i) => (
        <RichTextNodeRenderer key={i} node={node} />
      ))}
    </>
  );
}

function RichTextNodeRenderer({ node }: { node: RichTextNode }) {
  switch (node.type) {
    case "heading":
      const HeadingTag = `h${node.level || 2}` as keyof JSX.IntrinsicElements;
      return <HeadingTag className="text-xl font-bold mt-6 mb-3">{node.text}</HeadingTag>;

    case "paragraph":
      return (
        <p className="mb-4">
          {node.runs?.map((run, i) => (
            <span key={i} className={run.bold ? "font-bold" : ""}>
              {run.link ? (
                <Link asChild>
                  <a href={run.link.href}>{run.text}</a>
                </Link>
              ) : (
                run.text
              )}
            </span>
          ))}
        </p>
      );

    case "list":
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <ListTag className={`mb-4 pl-6 ${node.ordered ? "list-decimal" : "list-disc"}`}>
          {node.items?.map((item, i) => (
            <li key={i} className="mb-1">
              <RichTextRenderer nodes={item as unknown as RichTextNode[]} />
            </li>
          ))}
        </ListTag>
      );

    case "callout":
      return (
        <div className={`p-4 rounded-lg mb-4 ${
          node.severity === "warning"
            ? "bg-yellow-50 border border-yellow-300"
            : node.severity === "danger"
            ? "bg-red-50 border border-red-300"
            : "bg-blue-50 border border-blue-300"
        }`}>
          {node.content && <RichTextRenderer nodes={node.content} />}
        </div>
      );

    default:
      return null;
  }
}

export const metadata = {
  title: `${artifact.title} - サンプル市 - INNOMA`,
  description: artifact.description,
};
