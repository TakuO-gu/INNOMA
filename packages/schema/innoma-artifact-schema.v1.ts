// innoma-artifact-schema.v1.ts
// ✅ INNOMA 成果物スキーマ（v1）
// - LocalGov Drupal Services module準拠のページ種別
// - GOV.UK + 日本独自のトピック分類（Category）
// - RichText は構造配列
// - source / pipeline はユーザー指定の必須項目

import { z } from "zod";

/* -----------------------------
 * 1) Enum: PageType（LocalGov Drupal Services module準拠）
 * 参考: https://docs.localgovdrupal.org/content/features/services
 * ----------------------------- */

export const PageType = z.enum([
  "home",                // トップページ
  "service_landing",     // サービスのトップレベル集約（例：「届出・届出」セクションのトップ）
  "service_sublanding",  // サービスの中間集約（サブカテゴリ）
  "service_page",        // 1つのタスクを完結させるページ（フォームへのCTA等）
]);
export type PageType = z.infer<typeof PageType>;

/* -----------------------------
 * 2) Enum: Category（トピック分類）
 * GOV.UK準拠 + 日本独自の拡張
 * 参考: https://www.gov.uk/browse
 * ----------------------------- */

export const Category = z.enum([
  // GOV.UK標準ベース
  "benefits_welfare",        // 福祉・給付・支援（生活保護、各種手当等）
  "births_deaths_family",    // 届出・戸籍・家族（出生届、婚姻届、死亡届等）
  "business",                // 事業者向け（届出、許認可、融資等）
  "childcare_parenting",     // 子育て（保育園、児童手当、母子保健等）
  "citizenship_community",   // 市民参加・地域（選挙、町内会、ボランティア等）
  "education_learning",      // 教育・学習（学校、生涯学習、図書館等）
  "environment",             // 環境・ごみ・リサイクル
  "housing_local_services",  // 住まい・施設・地域サービス（公営住宅、公民館等）
  "health",                  // 健康・医療・保険（国保、予防接種、検診等）
  "money_tax",               // 税金・届出（住民税、固定資産税、納税等）
  "transport",               // 交通・道路（駐輪場、道路、公共交通等）
  "working_jobs",            // 就労・募集（求人、職業訓練、職員募集等）

  // 🇯🇵 日本独自
  "emergency_disaster",      // 防災・災害（避難所、ハザードマップ、防災訓練等）
  "elderly_care",            // 高齢者・介護（介護保険、高齢者支援、認知症等）
]);
export type Category = z.infer<typeof Category>;

/* -----------------------------
 * 3) RichText (構造配列)
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
 * 4) source / pipeline（必須）
 * ----------------------------- */

export const Source = z.object({
  source_url: z.string().url(),
  fetched_at: z.string().datetime(),
  content_type: z.string().min(1),
  content_hash: z.string().min(1),
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
 * 5) Blocks（LocalGov Drupal準拠）
 * ----------------------------- */

const BaseBlock = z.object({
  id: z.string().min(1),
});

export const Block = z.discriminatedUnion("type", [
  // ========== 共通ブロック ==========
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
    type: z.literal("Summary"),
    props: z.object({ content: z.string().min(1) }),
  }),
  BaseBlock.extend({
    type: z.literal("Metadata"),
    props: z.object({
      updated_at: z.string().datetime().optional(),
      department: z.string().optional(),
      notes: z.array(z.string()).optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("ContentsNav"),
    props: z.object({
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
  BaseBlock.extend({
    type: z.literal("Footer"),
    props: z.object({}),
  }),

  // ========== Home用 ==========
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
      severity: z.enum(["critical", "high", "medium", "low"]).optional(),
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
      items: z.array(z.object({
        title: z.string().min(1),
        href: z.string().url(),
        description: z.string().optional(),
        category: Category.optional(),
      })).min(1),
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
          category: z.string().optional(),
        })
      ).min(1),
    }),
  }),

  // ========== Service Landing / Sublanding用 ==========
  BaseBlock.extend({
    type: z.literal("ServiceLinkList"),
    props: z.object({
      sections: z.array(
        z.object({
          title: z.string().min(1),
          items: z.array(z.object({
            title: z.string().min(1),
            href: z.string().url(),
            description: z.string().optional(),
          })).min(1),
        })
      ).min(1),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("TopTask"),
    props: z.object({
      label: z.string().min(1),
      href: z.string().url(),
      description: z.string().optional(),
    }),
  }),
  BaseBlock.extend({
    type: z.literal("RelatedTopics"),
    props: z.object({
      items: z.array(z.object({ title: z.string().min(1), href: z.string().url() })).min(1),
    }),
  }),

  // ========== Service Page用（CTAボタン付き） ==========
  BaseBlock.extend({
    type: z.literal("TaskButton"),
    props: z.object({
      label: z.string().min(1),
      href: z.string().url(),
      isTopTask: z.boolean().optional(),
    }),
  }),
]);
export type Block = z.infer<typeof Block>;

/* -----------------------------
 * 6) Search fields（成果物に含める）
 * ----------------------------- */

export const SearchFields = z.object({
  summary: z.string().min(1),
  keywords: z.array(z.string().min(1)).default([]),
  plain_text: z.string().min(1),
});
export type SearchFields = z.infer<typeof SearchFields>;

/* -----------------------------
 * 7) Artifact（成果物の本体）
 * ----------------------------- */

export const ArtifactBase = z.object({
  schema_version: z.string().min(1),
  page_id: z.string().min(1),
  municipality_id: z.string().min(1),
  path: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  page_type: PageType,
  category: Category,
  source: Source,
  pipeline: Pipeline,
  blocks: z.array(Block).min(1),
  search: SearchFields,
});
export type ArtifactBase = z.infer<typeof ArtifactBase>;

/* -----------------------------
 * 8) ページ種別ごとの骨組み制約
 * ----------------------------- */

const hasBlockType = (blocks: Block[], type: Block["type"]) =>
  blocks.some((b) => b.type === type);

export const Artifact = ArtifactBase.superRefine((val, ctx) => {
  // 共通の最低限
  if (!hasBlockType(val.blocks, "Footer")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: "Footer が必要です" });
  }

  // ページ種別ごとの必須ブロック
  if (val.page_type === "home") {
    for (const t of ["GlobalHeader", "Hero", "TopicGrid"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `home には ${t} が必要です` });
      }
    }
  }

  if (val.page_type === "service_landing") {
    for (const t of ["Breadcrumbs", "Title", "ServiceLinkList"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `service_landing には ${t} が必要です` });
      }
    }
  }

  if (val.page_type === "service_sublanding") {
    for (const t of ["Breadcrumbs", "Title", "ServiceLinkList"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `service_sublanding には ${t} が必要です` });
      }
    }
  }

  if (val.page_type === "service_page") {
    for (const t of ["Breadcrumbs", "Title", "RichText"] as const) {
      if (!hasBlockType(val.blocks, t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["blocks"], message: `service_page には ${t} が必要です` });
      }
    }
  }
});
export type Artifact = z.infer<typeof Artifact>;

/* -----------------------------
 * 9) 骨組みテンプレ（blocks配列の雛形）
 * ----------------------------- */

export const Skeletons = {
  home: [
    "GlobalHeader",
    "EmergencyBanner",
    "Hero",
    "QuickLinks",
    "TopicGrid",
    "PopularContent",
    "NewsList",
    "Contact",
    "Footer",
  ] as const,

  service_landing: [
    "Breadcrumbs",
    "Title",
    "Summary",
    "TopTask",
    "ServiceLinkList",
    "RelatedTopics",
    "Contact",
    "Footer",
  ] as const,

  service_sublanding: [
    "Breadcrumbs",
    "Title",
    "Summary",
    "ServiceLinkList",
    "RelatedTopics",
    "Contact",
    "Footer",
  ] as const,

  service_page: [
    "Breadcrumbs",
    "Title",
    "Summary",
    "RichText",
    "TaskButton",
    "RelatedLinks",
    "Contact",
    "Footer",
  ] as const,
};

/* -----------------------------
 * 10) ページ種別の使い分けガイド
 * ----------------------------- */

export const PAGE_TYPE_GUIDE = {
  home: {
    description: "トップページ",
    example: "自治体サイトのホームページ",
    when: "サイト全体の入り口として、主要サービスへのナビゲーションを提供",
  },
  service_landing: {
    description: "サービスのトップレベル集約",
    example: "「届出・届出」セクションのトップページ",
    when: "複数のサービスページやサブカテゴリをまとめる",
  },
  service_sublanding: {
    description: "サービスの中間集約",
    example: "「届出・届出」の中の「転入・転出」カテゴリ",
    when: "service_landingの下位で、さらに細分化が必要な場合",
  },
  service_page: {
    description: "1つのタスクを完結させるページ",
    example: "「粗大ごみを申し込む」→オンラインフォームへCTA",
    when: "1つのユーザーニーズやタスクを1画面で完結させる",
  },
} as const;

/* -----------------------------
 * 11) カテゴリの使い分けガイド
 * ----------------------------- */

export const CATEGORY_GUIDE = {
  benefits_welfare: {
    description: "福祉・給付・支援",
    examples: ["生活保護", "各種手当", "障害者支援", "生活困窮者支援"],
  },
  births_deaths_family: {
    description: "届出・戸籍・家族",
    examples: ["出生届", "婚姻届", "死亡届", "戸籍謄本", "印鑑登録"],
  },
  business: {
    description: "事業者向け",
    examples: ["届出", "許認可", "融資", "入札", "産業振興"],
  },
  childcare_parenting: {
    description: "子育て",
    examples: ["保育園", "児童手当", "母子保健", "学童保育", "子育て支援"],
  },
  citizenship_community: {
    description: "市民参加・地域",
    examples: ["選挙", "町内会", "ボランティア", "NPO", "市民活動"],
  },
  education_learning: {
    description: "教育・学習",
    examples: ["学校", "生涯学習", "図書館", "奨学金", "成人式"],
  },
  environment: {
    description: "環境・ごみ・リサイクル",
    examples: ["ごみ収集", "リサイクル", "環境保全", "公園", "緑化"],
  },
  housing_local_services: {
    description: "住まい・施設・地域サービス",
    examples: ["公営住宅", "公民館", "体育館", "上下水道", "道路"],
  },
  health: {
    description: "健康・医療・保険",
    examples: ["国民健康保険", "予防接種", "検診", "感染症", "医療費助成"],
  },
  money_tax: {
    description: "税金・届出",
    examples: ["住民税", "固定資産税", "納税", "証明書発行", "マイナンバー"],
  },
  transport: {
    description: "交通・道路",
    examples: ["駐輪場", "道路", "公共交通", "交通安全", "バス"],
  },
  working_jobs: {
    description: "就労・募集",
    examples: ["求人", "職業訓練", "職員募集", "シルバー人材", "就労支援"],
  },
  emergency_disaster: {
    description: "防災・災害（🇯🇵日本独自）",
    examples: ["避難所", "ハザードマップ", "防災訓練", "災害情報", "備蓄"],
  },
  elderly_care: {
    description: "高齢者・介護（🇯🇵日本独自）",
    examples: ["介護保険", "高齢者支援", "認知症", "敬老", "地域包括支援"],
  },
} as const;
