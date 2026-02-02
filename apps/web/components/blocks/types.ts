import type { RichTextNodeType } from "@/lib/artifact/schema";

export interface BaseBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface BreadcrumbItemType {
  label: string;
  href: string;
}

export interface RelatedLinkItem {
  title?: string;
  text?: string;
  href?: string;
  url?: string;
  external?: boolean;
}

export interface ResourceListItemType {
  title: string;
  href: string;
  description?: string;
  meta?: string;
  external?: boolean;
}

export interface TableRow {
  label: string;
  value: string | unknown[];
}

export interface DirectoryItem {
  name: string;
  address?: string;
  phone?: string;
  hours?: string;
  url?: string;
  description?: string;
}

export type StepItemState = "default" | "reached" | "completed" | "error" | "skipped" | "editing";

export interface StepItem {
  title: string;
  body: RichTextNodeType[];
  state?: StepItemState;
}

export interface AccordionItem {
  title: string;
  content: RichTextNodeType[];
}

export interface TopicGridItem {
  title: string;
  href: string;
  description?: string;
  category?: string;
  icon?: string;
}

export interface QuickLinkItem {
  title: string;
  href: string;
}

export interface NewsItem {
  title: string;
  href: string;
  published_at?: string;
  category?: string;
}

export interface RichTextNode {
  type: string;
  text?: string;
  level?: number;
  runs?: Array<{ text: string; bold?: boolean; link?: { href: string; label?: string; external?: boolean } }>;
  ordered?: boolean;
  items?: RichTextNode[][];
}
