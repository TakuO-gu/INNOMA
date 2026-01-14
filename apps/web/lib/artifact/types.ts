export type RichTextContent = string;

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type RelatedLinkItem = {
  title: string;
  href: string;
};

export type AttachmentItem = {
  title: string;
  href: string;
  content_type?: string;
};

export type ProcedureStep = {
  title: string;
  content: RichTextContent;
  checklist?: string[];
};

export type InfoTableRow = {
  label: string;
  value: RichTextContent;
};

export type EmergencyInfo = {
  type: "disaster" | "alert" | "warning" | "evacuation" | "other";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  content: RichTextContent;
  publishedAt: string;
  affectedAreas?: string[];
  evacuationShelters?: string[];
  contact?: string;
  url?: string;
};

export type InnomaBlock =
  | { id: string; type: "Breadcrumbs"; props: { items: BreadcrumbItem[] } }
  | { id: string; type: "Title"; props: { title: string } }
  | { id: string; type: "Callout"; props: { severity: "info" | "warning" | "danger"; title?: string; content: RichTextContent } }
  | { id: string; type: "RichText"; props: { content: RichTextContent } }
  | { id: string; type: "InfoTable"; props: { rows: InfoTableRow[] } }
  | { id: string; type: "RelatedLinks"; props: { items: RelatedLinkItem[] } }
  | { id: string; type: "Attachments"; props: { items: AttachmentItem[] } }
  | { id: string; type: "ProcedureSteps"; props: { steps: ProcedureStep[] } }
  | { id: string; type: "Emergency"; props: EmergencyInfo };

export type ArtifactMetadata = {
  municipality?: string;
  prefecture?: string;
  sourceUrl?: string;
  extractedAt?: string;
  lastModified?: string;
};

export type InnomaArtifact = {
  version?: string;
  metadata?: ArtifactMetadata;
  blocks: InnomaBlock[];
};
