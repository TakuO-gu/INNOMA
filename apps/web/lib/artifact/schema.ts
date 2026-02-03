/**
 * INNOMA Artifact Schema (v2)
 *
 * ローカルのスキーマ定義 + apps/web固有のユーティリティ
 */

import { z } from "zod";

// ローカルのスキーマからすべてを再エクスポート
export * from "./innoma-artifact-schema.v2";

// 内部使用のためにインポート
import {
  ContentType,
  ServiceCategory,
  Audience,
  HeadingSchema,
  LinkSchema,
  type Block,
} from "./innoma-artifact-schema.v2";

/* =============================================================================
 * apps/web固有の追加機能
 * ============================================================================= */

// 移行期間用の緩いスキーマ（apps/web固有）
const FlexibleBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
});

/**
 * 移行期間用の緩いArtifactスキーマ
 * v1/v2どちらの形式も受け付ける
 */
export const InnomaArtifactSchema = z.object({
  schema_version: z.string().optional().default("2.0.0"),
  page_id: z.string().optional(),
  municipality_id: z.string().optional(),
  path: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  // v1/v2両対応: stringまたはContentType enum
  content_type: z.union([ContentType, z.string()]).optional(),
  service_category: z.union([ServiceCategory, z.string()]).optional(),
  category: z.union([ServiceCategory, z.string()]).optional(), // v1互換
  audience: z.array(z.union([Audience, z.string()])).optional(),
  source: z.object({
    source_url: z.string(),
    crawl_file: z.string().optional(),
    fetched_at: z.string().optional(),
    content_type: z.string().optional(),
    content_hash: z.string().optional(),
  }).optional(),
  pipeline: z.object({
    run_id: z.string().optional(),
    generated_at: z.string(),
    schema_version: z.string().optional(),
  }).optional(),
  raw: z.object({
    headings: z.array(HeadingSchema).optional(),
    main: z.array(z.any()).optional(),
    links: z.array(LinkSchema).optional(),
  }).optional(),
  blocks: z.array(FlexibleBlockSchema),
  // 情報ソース（Wikipedia風の参照表示用）
  sources: z.array(z.object({
    id: z.number(),
    url: z.string(),
    title: z.string().optional(),
    accessedAt: z.string().optional(),
    variables: z.array(z.string()).optional(),
  })).optional(),
  search: z.object({
    summary: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    plain_text: z.string().optional(),
  }).optional(),
});

export type InnomaArtifactValidated = z.infer<typeof InnomaArtifactSchema>;

/**
 * 厳密なv2バリデーション用（InnomaArtifactSchemaとの互換性用）
 * @deprecated validateArtifact を使用してください
 */
export function validateInnomaArtifact(data: unknown): InnomaArtifactValidated {
  return InnomaArtifactSchema.parse(data);
}

/**
 * 安全なv2バリデーション用（InnomaArtifactSchemaとの互換性用）
 * @deprecated safeValidateArtifact を使用してください
 */
export function safeValidateInnomaArtifact(data: unknown): {
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

/**
 * Blockの型でフィルタリング（InnomaArtifactValidated用）
 */
export function getBlocksByTypeFromValidated<T extends Block["type"]>(
  artifact: InnomaArtifactValidated,
  type: T
): Extract<Block, { type: T }>[] {
  return artifact.blocks.filter((b): b is Extract<Block, { type: T }> => b.type === type);
}

/**
 * 最初のBlockを取得（InnomaArtifactValidated用）
 */
export function getFirstBlockByTypeFromValidated<T extends Block["type"]>(
  artifact: InnomaArtifactValidated,
  type: T
): Extract<Block, { type: T }> | undefined {
  return artifact.blocks.find((b): b is Extract<Block, { type: T }> => b.type === type);
}
