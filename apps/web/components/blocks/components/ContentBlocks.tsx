"use client";

import React from "react";
import NextLink from "next/link";
import { Link, Accordion, AccordionSummary, AccordionContent } from "@/components/dads";
import type { RichTextContent } from "@/lib/artifact/types";
import type { RichTextNodeType } from "@/lib/artifact/schema";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import { RichTextRenderer, getHeadingSizeClass } from "../RichTextRenderer";
import type { TableRow, AccordionItem } from "../types";

export function TitleBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || (props.title as string) || "";
  return (
    <h1 className="text-std-45B-140 text-solid-gray-900 mb-6">{text}</h1>
  );
}

export function SummaryBlock({ props }: { props: Record<string, unknown> }) {
  const text = (props.text as string) || "";
  return (
    <p className="text-std-17N-170 text-solid-gray-700 mb-8 leading-relaxed">{text}</p>
  );
}

export function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const content = props.content;
  if (!content) return null;
  return (
    <div className="mb-6">
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
    <div className="raw-content space-y-4 mb-6">
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
    <div className="overflow-x-auto mb-6">
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
    <div className="accordion-block mb-6">
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
