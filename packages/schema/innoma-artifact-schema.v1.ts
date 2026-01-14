// innoma-artifact-schema.v1.ts
// ✅ INNOMA 成果物スキーマ雛形（v1）
// - GOV.UKライクな4ページ種別
// - category は「ページのトピックのみ」で分類（対象者/優先度/形式は見ない）
// - RichText は構造配列
// - source / pipeline はユーザー指定の必須項目

import { z } from "zod";

/* -----------------------------
 * 1) Enum: PageType / Category
 * ----------------------------- */

export const PageType = z.enum([
  "home",        // トップページ
  "topic_index", // トピック集約
  "guide",       // テキスト情報
  "procedure",   // 手続きステップ
]);
export type PageType = z.infer<typeof PageType>;

// ✅ category は「トピックのみ」で判断する（対象者・優先度・形式などは含めない）
export const Category = z.enum([
  "topic",        // トピック集約そのもの
  "guide",        // 案内・説明（制度/ガイド）
  "procedure",    // 申請/届出など
  "facility",     // 施設（利用案内含む）
  "service",      // 支援/助成/事業など
  "news",         // お知らせ
  "recruitment",  // 募集
  "disaster",     // 防災・災害
  "faq",          // よくある質問
]);
export type Category = z.infer<typeof Category>;

/* -----------------------------
 * 2) RichText (構造配列)
 * ----------------------------- */

const Link = z.object({
  href: z.string().url(),
  label: z.string().min(1),
  external: z.boolean().optional(),
});

const TextRun = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  link: Link.optional(),
});

export const RichTextNode = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("paragraph"),
    runs: z.array(TextRun).min(1),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    // 各 item は「ノード列」（段落+入れ子なども表現可能）
    items: z.array(z.array(z.lazy(() => RichTextNode))).min(1),
  }),
  z.object({
    type: z.literal("callout"),
    severity: z.enum(["info", "warning", "danger"]),
    content: z.array(z.lazy(() => RichTextNode)).min(1),
  }),
  z.object({
    type: z.literal("divider"),
  }),
]);
export type RichTextNode = z.infer<typeof RichTextNode>;

/* -----------------------------
 * 3) source / pipeline（必須）
 * ----------------------------- */

export const Source = z.object({
  source_url: z.string().url(),
  fetched_at: z.string().datetime(), // ISO
  content_type: z.string().min(1),   // "text/html" | "application/pdf" | "image/*" etc
  content_hash: z.string().min(1),   // "sha256:...."

  // 取れたら（準必須として扱うが schema 上は optional）
  last_modified: z.string().optional(),
  etag: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

export const Pipeline = z.object({
  run_id: z.string().min(1),
  generated_at: z.string().datetime(),

  schema_version: z.string().min(1),

  extractor_version: z.string().min(1),
  structurer_version: z.string().min(1),
  transformer_version: z.string().min(1),
  renderer_version: z.string().min(1),

  model: z.string().min(1),
});
export type Pipeline = z.infer<typeof Pipeline>;

/* -----------------------------
 * 4) Blocks（最小セット）
 * - 4ページ骨組みに必要なものだけ
 * ----------------------------- */

const BaseBlock = z.object({
  id: z.string().min(1),
});

export const Block = z.discriminatedUnion("type", [
  // 共通
  BaseBlock.extend({
    type: z.literal("Breadcrumbs"),
    props: z.object({
      items: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("Title"),
    props: z.object({ title: z.string().min(1) }),
  }),
  BaseBlock.extend({
    type: z.literal("Intro"),
    props: z.object({ content: z.array(RichTextNode).min(1) }),
  }),
  BaseBlock.extend({
    type: z.literal("Metadata"),
    props: z.object({
      updated_at: z.string().datetime().optional(),
      department: z.string().optional(),
      // ガイド/手続きの補助情報（“対象者/優先度”ではなく、表示上のメタ）
      notes: z.array(z.string()).optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("ContentsNav"),
    props: z.object({
      // 見出しから自動生成する想定。必要なら明示指定。
      headings: z.array(z.object({ text: z.string().min(1), anchor: z.string().min(1) })).optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("RichText"),
    props: z.object({ content: z.array(RichTextNode).min(1) }),
  }),
  BaseBlock.extend({
    type: z.literal("Callout"),
    props: z.object({
      severity: z.enum(["info", "warning", "danger"]),
      title: z.string().optional(),
      content: z.array(RichTextNode).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("InfoTable"),
    props: z.object({
      rows: z.array(z.object({ label: z.string().min(1), value: z.array(RichTextNode).min(1) })).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("Attachments"),
    props: z.object({
      items: z.array(
        z.object({
          title: z.string().min(1),
          href: z.string().url(),
          content_type: z.string().optional(),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("RelatedLinks"),
    props: z.object({
      items: z.array(z.object({ title: z.string().min(1), href: z.string().url() })).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("Contact"),
    props: z.object({
      dept: z.string().optional(),
      tel: z.string().optional(),
      email: z.string().email().optional(),
      hours: z.string().optional(),
      address: z.string().optional(),
    }),
  }),

  // Home用
  BaseBlock.extend({
    type: z.literal("GlobalHeader"),
    props: z.object({
      municipality_name: z.string().min(1),
      search_enabled: z.boolean().default(true).optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("EmergencyBanner"),
    props: z.object({
      title: z.string().min(1),
      content: z.array(RichTextNode).min(1),
      href: z.string().url().optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("Hero"),
    props: z.object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("QuickLinks"),
    props: z.object({
      items: z.array(z.object({ title: z.string().min(1), href: z.string().url() })).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("TopicGrid"),
    props: z.object({
      items: z.array(z.object({ title: z.string().min(1), href: z.string().url(), description: z.string().optional() })).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("PopularContent"),
    props: z.object({
      items: z.array(z.object({ title: z.string().min(1), href: z.string().url() })).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("NewsList"),
    props: z.object({
      items: z.array(
        z.object({
          title: z.string().min(1),
          href: z.string().url(),
          published_at: z.string().datetime().optional(),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("Footer"),
    props: z.object({}),
  }),

  // Topic Index用
  BaseBlock.extend({
    type: z.literal("SectionedLinkList"),
    props: z.object({
      sections: z.array(
        z.object({
          title: z.string().min(1),
          items: z.array(z.object({ title: z.string().min(1), href: z.string().url(), description: z.string().optional() })).min(1),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("RelatedTopics"),
    props: z.object({
      items: z.array(z.object({ title: z.string().min(1), href: z.string().url() })).min(1),
    }),
  }),

  // Procedure用
  BaseBlock.extend({
    type: z.literal("ProcedureSteps"),
    props: z.object({
      steps: z.array(
        z.object({
          title: z.string().min(1),
          content: z.array(RichTextNode).min(1),
          checklist: z.array(z.string().min(1)).optional(),
          links: z.array(Link).optional(),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("RequiredDocuments"),
    props: z.object({
      items: z.array(
        z.object({
          name: z.string().min(1),
          description: z.array(RichTextNode).optional(),
          href: z.string().url().optional(),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("HowToApply"),
    props: z.object({
      methods: z.array(
        z.object({
          type: z.enum(["counter", "mail", "online", "phone", "other"]),
          content: z.array(RichTextNode).min(1),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("AfterYouApply"),
    props: z.object({ content: z.array(RichTextNode).min(1) }),
  }),
]);
export type Block = z.infer<typeof Block>;

/* -----------------------------
 * 5) Search fields（成果物に含める）
 * ----------------------------- */

export const SearchFields = z.object({
  summary: z.string().min(1),
  keywords: z.array(z.string().min(1)).default([]),
  plain_text: z.string().min(1),
});
export type SearchFields = z.infer<typeof SearchFields>;

/* -----------------------------
 * 6) Artifact（成果物の本体）
 * ----------------------------- */

export const ArtifactBase = z.object({
  schema_version: z.string().min(1), // "1.0.0"
  page_id: z.string().min(1),
  municipality_id: z.string().min(1),

  // ルーティング
  path: z.string().min(1), // "/procedures/xxx" など

  // 表示・一覧用
  title: z.string().min(1),
  description: z.string().optional(),

  page_type: PageType,
  category: Category,

  // 証跡
  source: Source,
  pipeline: Pipeline,

  // UI
  blocks: z.array(Block).min(1),

  // 検索
  search: SearchFields,
});
export type ArtifactBase = z.infer<typeof ArtifactBase>;

/* -----------------------------
 * 7) ページ種別ごとの骨組み“制約” (任意だが超おすすめ)
 * - 「最低限必要なブロック順」をスキーマで強制できる
 * ----------------------------- */

const hasBlockType = (blocks: Block[], type: Block["type"]) =>
  blocks.some((b) => b.type === type);

export const Artifact = ArtifactBase.superRefine((val, ctx) => {
  // 共通の最低限
  if (!hasBlockType(val.blocks, "Footer")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: "Footer が必要です" });
  }

  // ページ種別ごとの必須ブロック（“骨組み”）
  if (val.page_type === "home") {
    for (const t of ["GlobalHeader", "Hero", "TopicGrid"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `home には ${t} が必要です` });
      }
    }
  }

  if (val.page_type === "topic_index") {
    for (const t of ["Breadcrumbs", "Title", "SectionedLinkList"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `topic_index には ${t} が必要です` });
      }
    }
  }

  if (val.page_type === "guide") {
    for (const t of ["Breadcrumbs", "Title", "RichText"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `guide には ${t} が必要です` });
      }
    }
  }

  if (val.page_type === "procedure") {
    for (const t of ["Breadcrumbs", "Title", "ProcedureSteps", "Contact"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `procedure には ${t} が必要です` });
      }
    }
  }
});
export type Artifact = z.infer<typeof Artifact>;

/* -----------------------------
 * 8) 骨組みテンプレ（blocks配列の雛形）
 * - 生成側がまずこの順で埋める
 * ----------------------------- */

export const Skeletons = {
  home: [
    "GlobalHeader",
    "EmergencyBanner", // optional
    "Hero",
    "QuickLinks",
    "TopicGrid",
    "PopularContent",
    "NewsList",
    "Contact",
    "Footer",
  ] as const,

  topic_index: [
    "Breadcrumbs",
    "Title",
    "Intro",
    "SectionedLinkList",
    "RelatedTopics",
    "Contact",
    "Footer",
  ] as const,

  guide: [
    "Breadcrumbs",
    "Title",
    "Metadata",
    "ContentsNav",
    "RichText",
    "InfoTable",
    "Attachments",
    "RelatedLinks",
    "Contact",
    "Footer",
  ] as const,

  procedure: [
    "Breadcrumbs",
    "Title",
    "Metadata",
    "Callout",
    "ProcedureSteps",
    "RequiredDocuments",
    "HowToApply",
    "AfterYouApply",
    "Attachments",
    "Contact",
    "Footer",
  ] as const,
};
