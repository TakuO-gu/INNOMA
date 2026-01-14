import NextLink from "next/link";
import { Header, Footer } from "@/components/layout";
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  Link,
} from "@/components/dads";
import artifact from "@/data/artifacts/sample/services/childcare/nursery-apply.json";

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

export default function NurseryApplyPage() {
  // 各ブロックを取得
  const summaryBlock = artifact.blocks.find((b) => b.type === "Summary") as { type: "Summary"; props: { content: string } } | undefined;

  const calloutBlock = artifact.blocks.find((b) => b.type === "Callout") as {
    type: "Callout";
    props: { severity: string; title?: string; content: RichTextNode[] }
  } | undefined;

  const richTextBlock = artifact.blocks.find((b) => b.type === "RichText") as {
    type: "RichText";
    props: { content: RichTextNode[] }
  } | undefined;

  const taskButtonBlock = artifact.blocks.find((b) => b.type === "TaskButton") as {
    type: "TaskButton";
    props: { label: string; href: string; isTopTask?: boolean }
  } | undefined;

  const infoTableBlock = artifact.blocks.find((b) => b.type === "InfoTable") as {
    type: "InfoTable";
    props: { rows: Array<{ label: string; value: RichTextNode[] }> }
  } | undefined;

  const attachmentsBlock = artifact.blocks.find((b) => b.type === "Attachments") as {
    type: "Attachments";
    props: { items: Array<{ title: string; href: string; content_type?: string }> }
  } | undefined;

  const relatedLinksBlock = artifact.blocks.find((b) => b.type === "RelatedLinks") as {
    type: "RelatedLinks";
    props: { items: Array<{ title: string; href: string }> }
  } | undefined;

  const contactBlock = artifact.blocks.find((b) => b.type === "Contact") as {
    type: "Contact";
    props: { dept?: string; tel?: string; email?: string; hours?: string; address?: string }
  } | undefined;

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
                  <BreadcrumbLink asChild>
                    <NextLink href="/municipalities/sample/services/childcare/nursery">保育園・幼稚園</NextLink>
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
          {/* Callout */}
          {calloutBlock && (
            <div className={`p-4 rounded-lg mb-8 ${
              calloutBlock.props.severity === "warning"
                ? "bg-yellow-50 border border-yellow-300"
                : calloutBlock.props.severity === "danger"
                ? "bg-red-50 border border-red-300"
                : "bg-blue-50 border border-blue-300"
            }`}>
              {calloutBlock.props.title && (
                <div className="font-bold mb-2">{calloutBlock.props.title}</div>
              )}
              <RichTextRenderer nodes={calloutBlock.props.content} />
            </div>
          )}

          {/* Main Content */}
          {richTextBlock && (
            <div className="prose prose-gray max-w-none mb-8">
              <RichTextRenderer nodes={richTextBlock.props.content} />
            </div>
          )}

          {/* Task Button */}
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

          {/* Info Table */}
          {infoTableBlock && (
            <div className="bg-white border border-solid-gray-300 rounded-lg overflow-hidden mb-8">
              <table className="w-full">
                <tbody>
                  {infoTableBlock.props.rows.map((row, i) => (
                    <tr key={i} className="border-b border-solid-gray-200 last:border-b-0">
                      <th className="px-4 py-3 bg-solid-gray-50 text-left font-medium text-solid-gray-700 w-1/3">
                        {row.label}
                      </th>
                      <td className="px-4 py-3">
                        <RichTextRenderer nodes={row.value} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Attachments */}
          {attachmentsBlock && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-solid-gray-900 mb-4">関連書類</h2>
              <ul className="space-y-2">
                {attachmentsBlock.props.items.map((item, i) => (
                  <li key={i}>
                    <Link asChild>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 18h12V6h-4V2H4v16zm8-14l4 4h-4V4zM2 0h12l6 6v14H2V0z"/>
                        </svg>
                        {item.title}
                        {item.content_type === "application/pdf" && (
                          <span className="text-sm text-solid-gray-500">(PDF)</span>
                        )}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
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
              <RichTextRenderer nodes={item} />
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
