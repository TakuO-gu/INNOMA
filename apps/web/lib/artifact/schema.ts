import { z } from "zod";

/**
 * InnomaArtifact Zod Schema
 * 型安全なvalidationとランタイムチェック
 */

export const RichTextContentSchema = z.string();

export const BreadcrumbItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const RelatedLinkItemSchema = z.object({
  title: z.string(),
  href: z.string(),
});

export const AttachmentItemSchema = z.object({
  title: z.string(),
  href: z.string(),
  content_type: z.string().optional(),
});

export const ProcedureStepSchema = z.object({
  title: z.string(),
  content: RichTextContentSchema,
  checklist: z.array(z.string()).optional(),
});

export const InfoTableRowSchema = z.object({
  label: z.string(),
  value: RichTextContentSchema,
});

export const EmergencyInfoSchema = z.object({
  type: z.enum(["disaster", "alert", "warning", "evacuation", "other"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string(),
  content: RichTextContentSchema,
  publishedAt: z.string(),
  affectedAreas: z.array(z.string()).optional(),
  evacuationShelters: z.array(z.string()).optional(),
  contact: z.string().optional(),
  url: z.string().optional(),
});

export const InnomaBlockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    type: z.literal("Breadcrumbs"),
    props: z.object({ items: z.array(BreadcrumbItemSchema) }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("Title"),
    props: z.object({ title: z.string() }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("Callout"),
    props: z.object({
      severity: z.enum(["info", "warning", "danger"]),
      title: z.string().optional(),
      content: RichTextContentSchema,
    }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("RichText"),
    props: z.object({ content: RichTextContentSchema }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("InfoTable"),
    props: z.object({ rows: z.array(InfoTableRowSchema) }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("RelatedLinks"),
    props: z.object({ items: z.array(RelatedLinkItemSchema) }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("Attachments"),
    props: z.object({ items: z.array(AttachmentItemSchema) }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("ProcedureSteps"),
    props: z.object({ steps: z.array(ProcedureStepSchema) }),
  }),
  z.object({
    id: z.string(),
    type: z.literal("Emergency"),
    props: EmergencyInfoSchema,
  }),
]);

export const InnomaArtifactSchema = z.object({
  version: z.string().optional().default("1.0"),
  metadata: z
    .object({
      municipality: z.string().optional(),
      prefecture: z.string().optional(),
      sourceUrl: z.string().optional(),
      extractedAt: z.string().optional(),
      lastModified: z.string().optional(),
    })
    .optional(),
  blocks: z.array(InnomaBlockSchema),
});

export type InnomaArtifactValidated = z.infer<typeof InnomaArtifactSchema>;

/**
 * Artifactをvalidateして型安全なオブジェクトを返す
 */
export function validateArtifact(data: unknown): InnomaArtifactValidated {
  return InnomaArtifactSchema.parse(data);
}

/**
 * Artifactをsafe parseしてエラー情報を返す
 */
export function safeValidateArtifact(data: unknown): {
  success: boolean;
  data?: InnomaArtifactValidated;
  error?: z.ZodError;
} {
  const result = InnomaArtifactSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
