"use client";

import React from "react";
import NextLink from "next/link";
import { Link, Accordion, AccordionSummary, AccordionContent } from "@/components/dads";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import { RichTextRenderer, getHeadingSizeClass } from "../RichTextRenderer";
import type { TableRow, AccordionItem } from "../types";
import { budouxParse } from "@/components/BudouX";

export function TitleBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || (props.title as string) || "";
  return (
    <h1 className="mt-6 text-std-45B-140 text-solid-gray-900 budoux">{budouxParse(text)}</h1>
  );
}

export function SummaryBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || "";
  return (
    <p className="mt-6 text-std-17N-170 text-solid-gray-700 mb-8 leading-relaxed budoux">{budouxParse(text)}</p>
  );
}

export function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const content = props.content;
  if (!content) return null;
  return (
    <div className="mt-12 mb-6">
      <RichTextRenderer content={content as RichTextContent | RichTextNodeType[]} />
    </div>
  );
}

export function RawContentBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const headings = (props.headings as Array<{ level: number; text: string }>) || [];
  const main = (props.main as Array<{ type: string; text?: string; items?: string[]; rows?: string[][] }>) || [];
  const links = (props.links as Array<{ text: string; href: string }>) || [];

  return (
    <div className="mt-12 raw-content space-y-4 mb-6">
      {headings.map((h, i) => {
        const Tag = `h${Math.min(h.level + 1, 6)}` as keyof JSX.IntrinsicElements;
        const sizeClass = getHeadingSizeClass(h.level + 1);
        return (
          <Tag key={`h-${i}`} className={sizeClass}>{h.text}</Tag>
        );
      })}

      {main.map((item, i) => {
        if (item.type === "p") {
          return <p key={`p-${i}`} className="text-std-16N-170 text-solid-gray-800 mb-4">{item.text}</p>;
        }
        if (item.type === "ul") {
          return (
            <ul key={`ul-${i}`} className="list-disc list-inside mb-4 space-y-1 text-std-16N-170 text-solid-gray-800">
              {item.items?.map((li, j) => <li key={j}>{li}</li>)}
            </ul>
          );
        }
        if (item.type === "ol") {
          return (
            <ol key={`ol-${i}`} className="list-decimal list-inside mb-4 space-y-1 text-std-16N-170 text-solid-gray-800">
              {item.items?.map((li, j) => <li key={j}>{li}</li>)}
            </ol>
          );
        }
        if (item.type === "table" && item.rows) {
          return (
            <div key={`table-${i}`} className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse">
                <tbody>
                  {item.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-solid-gray-300">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2 border border-solid-gray-300 text-std-16N-170">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}

      {links.length > 0 && (
        <div className="mt-4">
          <h3 className="text-std-17B-170 text-solid-gray-900 mb-2">関連リンク</h3>
          <ul className="space-y-1">
            {links.map((link, i) => {
              const isExternal = link.href.startsWith("mailto:") || link.href.startsWith("http");
              const resolvedHref = isExternal ? link.href : prefixInternalLink(link.href, municipalityId);
              return (
                <li key={i}>
                  {isExternal ? (
                    <Link href={resolvedHref} target="_blank" rel="noopener noreferrer">
                      {link.text}
                    </Link>
                  ) : (
                    <Link asChild>
                      <NextLink href={resolvedHref}>{link.text}</NextLink>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function TableBlock({ props }: { props: Record<string, unknown> }) {
  const rawRows = (props.rows as TableRow[]) || [];

  return (
    <div className="mt-12 overflow-x-auto mb-6">
      <table className="min-w-full">
        <tbody className="divide-y divide-solid-gray-300">
          {rawRows.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="px-4 py-3 text-left text-std-16N-170 font-medium text-solid-gray-700 bg-solid-gray-50 w-1/3">
                {row.label}
              </th>
              <td className="px-4 py-3 text-std-16N-170 text-solid-gray-800">
                {Array.isArray(row.value) ? (
                  <RichTextRenderer content={row.value as RichTextNodeType[]} />
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccordionBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as AccordionItem[]) || [];

  return (
    <div className="mt-12 accordion-block mb-6">
      {items.map((item, i) => (
        <Accordion key={i}>
          <AccordionSummary>
            <span className="text-std-16N-170 text-solid-gray-900">{item.title}</span>
          </AccordionSummary>
          <AccordionContent>
            <RichTextRenderer content={item.content} />
          </AccordionContent>
        </Accordion>
      ))}
    </div>
  );
}

/**
 * DescriptionListBlock - シンプルな名前-値ペアの表示
 * Tableより軽量で、3項目以下のシンプルな情報に適切
 */
export function DescriptionListBlock({ props }: { props: Record<string, unknown> }) {
  const heading = props.heading as string | undefined;
  const items = (props.items as Array<{ term: string; description: string }>) || [];

  return (
    <div className="mt-12 description-list-block mb-6">
      {heading && (
        <h3 className="text-std-20B-150 text-solid-gray-900 mb-4">{heading}</h3>
      )}
      <dl className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-std-16B-170 text-solid-gray-700 sm:w-1/3 sm:flex-shrink-0">
              {item.term}
            </dt>
            <dd className="text-std-16N-170 text-solid-gray-800 mt-1 sm:mt-0">
              {item.description}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * BlockquoteBlock - 法令引用・規則の表示
 */
export function BlockquoteBlock({ props }: { props: Record<string, unknown> }) {
  const content = (props.content as string) || "";
  const cite = props.cite as string | undefined;

  return (
    <figure className="mt-12 blockquote-block mb-6">
      <blockquote className="border-l-4 border-solid-gray-400 pl-4 py-2 italic text-std-16N-170 text-solid-gray-700">
        {content}
      </blockquote>
      {cite && (
        <figcaption className="mt-2 text-std-14N-170 text-solid-gray-500">
          — {cite}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * StatusBadgeBlock - ステータス表示
 */
export function StatusBadgeBlock({ props }: { props: Record<string, unknown> }) {
  const label = (props.label as string) || "";
  const variant = (props.variant as "success" | "warning" | "error" | "info") || "info";

  const variantStyles: Record<string, string> = {
    success: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    error: "bg-red-100 text-red-800 border-red-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <span
      className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-std-14B-170 border ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

/**
 * CardBlock - 関連サービス、複数窓口のカード表示
 */
export function CardBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId } = useMunicipality();
  const title = (props.title as string) || "";
  const description = props.description as string | undefined;
  const href = props.href as string | undefined;
  const image = props.image as string | undefined;

  const content = (
    <div className="mt-12 card-block border border-solid-gray-300 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {image && (
        <div className="aspect-video bg-solid-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-std-14N-170 text-solid-gray-600">{description}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    const isExternal = href.startsWith("http");
    const resolvedHref = isExternal ? href : prefixInternalLink(href, municipalityId);

    if (isExternal) {
      return (
        <a href={resolvedHref} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }
    return (
      <NextLink href={resolvedHref} className="block">
        {content}
      </NextLink>
    );
  }

  return content;
}

/**
 * SectionBlock - h2/h3レベルのセクションを明示的に表現
 */
export function SectionBlock({ props }: { props: Record<string, unknown> }) {
  const heading = (props.heading as string) || "";
  const level = (props.level as 2 | 3 | 4) || 2;
  const content = props.content;

  const HeadingTag = `h${level}` as "h2" | "h3" | "h4";

  const headingStyles: Record<number, string> = {
    2: "text-std-32B-150 text-solid-gray-900 mb-6",
    3: "text-std-24B-150 text-solid-gray-900 mb-4",
    4: "text-std-20B-150 text-solid-gray-900 mb-4",
  };

  return (
    <section className="mt-24">
      <HeadingTag className={`${headingStyles[level]} budoux`}>
        {budouxParse(heading)}
      </HeadingTag>
      {content != null && (
        <div className="section-content">
          <RichTextRenderer content={content as RichTextContent | RichTextNodeType[]} />
        </div>
      )}
    </section>
  );
}
