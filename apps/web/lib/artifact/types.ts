/**
 * INNOMA Artifact Types (v2)
 *
 * スキーマから型をre-export
 */

export type {
  ContentType,
  Category,
  RichTextNodeType,
  Block,
  SearchFields,
  Artifact,
  InnomaArtifactValidated,
} from "./schema";

// 後方互換性のための型定義
export type RichTextContent = string | RichTextNodeType[];

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type RelatedLinkItem = {
  title: string;
  href: string;
  external?: boolean;
};

export type AttachmentItem = {
  title: string;
  href: string;
  description?: string;
  meta?: string;
  external?: boolean;
};

export type ResourceItem = {
  title: string;
  href: string;
  description?: string;
  meta?: string;
  external?: boolean;
};

export type TableRow = {
  label: string;
  value: string | RichTextNodeType[];
};

export type ContactInfo = {
  department?: string;
  phone?: string;
  fax?: string;
  email?: string;
  hours?: string;
  address?: string;
  map_url?: string;
};

export type StepItem = {
  title: string;
  body: RichTextNodeType[];
};

export type DirectoryItem = {
  name: string;
  address?: string;
  phone?: string;
  hours?: string;
  url?: string;
  description?: string;
};

export type AccordionItem = {
  title: string;
  content: RichTextNodeType[];
};

// 後方互換性のための型（旧スキーマ用）
export type ProcedureStep = {
  title: string;
  content: string;
  checklist?: string[];
};

export type InfoTableRow = {
  label: string;
  value: string;
};

export type InnomaBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

export type ArtifactMetadata = {
  sourceUrl?: string;
  extractedAt?: string;
  municipality?: string;
  prefecture?: string;
  confidence?: number;
  llmModel?: string;
  processingTimeMs?: number;
};

export type InnomaArtifact = {
  schema_version?: string;
  page_id?: string;
  municipality_id?: string;
  path?: string;
  title: string;
  description?: string;
  page_type?: string;
  content_type?: string;
  category?: string;
  metadata?: ArtifactMetadata;
  source?: {
    source_url: string;
    fetched_at?: string;
    content_type?: string;
    content_hash?: string;
  };
  pipeline?: {
    run_id?: string;
    generated_at: string;
    schema_version?: string;
  };
  blocks: InnomaBlock[];
  search?: {
    summary?: string;
    keywords?: string[];
    plain_text?: string;
  };
};

export type EmergencyInfo = {
  type: "disaster" | "alert" | "warning" | "evacuation" | "other";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  content: string;
  publishedAt: string;
  affectedAreas?: string[];
  evacuationShelters?: string[];
  contact?: string;
  url?: string;
};

// RichTextNodeType を import するために型だけ再定義
import type { RichTextNodeType } from "./schema";
