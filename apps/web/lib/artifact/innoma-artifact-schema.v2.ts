/**
 * INNOMA Artifact Schema (v2)
 *
 * content_type ベースのページ分類に対応したスキーマ
 * 入力: Crawler出力 + Classifier出力（Structurer不要）
 */

import { z } from "zod";

/* =============================================================================
 * 1) ContentType（ページ種別）- Classifier出力と一致
 * ============================================================================= */

export const ContentType = z.enum([
  "service",      // IAの中心。市民の「やりたいこと」を表すハブページ
  "guide",        // サービスの詳細説明（手順・条件・注意事項）
  "form",         // 申請・届出ページ（PDF/Web/外部リンク）
  "step_by_step", // 段階的手順のウィザード型ガイド
  "contact",      // 問い合わせ・相談窓口情報
  "news",         // お知らせ・告知
  "directory",    // 施設リスト・一覧ページ
  "other",        // その他
]);
export type ContentType = z.infer<typeof ContentType>;

/* =============================================================================
 * 2) ServiceCategory（サービスカテゴリ）- Classifier出力と一致
 * ============================================================================= */

export const ServiceCategory = z.enum([
  "welfare",      // 福祉・介護・障害者支援
  "health",       // 健康・医療・保健
  "children",     // 子育て・教育・学校
  "housing",      // 住まい・引越し・届出
  "environment",  // 環境・ごみ・リサイクル
  "business",     // 産業・商工・観光
  "community",    // 地域・コミュニティ・文化
  "safety",       // 防災・安全・消防
  "government",   // 行政・議会・選挙
  "other",        // その他
]);
export type ServiceCategory = z.infer<typeof ServiceCategory>;

/* =============================================================================
 * 3) Audience / Topic - Classifier出力と一致
 * ============================================================================= */

export const Audience = z.enum([
  "residents",         // 住民全般
  "businesses",        // 事業者
  "children_families", // 子育て世帯
  "elderly",           // 高齢者
  "disabled",          // 障害者
  "foreigners",        // 外国人
]);
export type Audience = z.infer<typeof Audience>;

export const Topic = z.enum([
  "emergency",  // 緊急・災害
  "seasonal",   // 季節・時期限定
  "covid",      // 感染症対策
  "digital",    // デジタル化・オンライン
]);
export type Topic = z.infer<typeof Topic>;

/* =============================================================================
 * 4) Crawler出力の構造
 * ============================================================================= */

export const HeadingSchema = z.object({
  level: z.number().min(1).max(6),
  text: z.string(),
});

const MainContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: z.string() }),
  z.object({ type: z.literal("ul"), items: z.array(z.string()) }),
  z.object({ type: z.literal("ol"), items: z.array(z.string()) }),
  z.object({ type: z.literal("table"), rows: z.array(z.array(z.string())).optional() }),
]);

export const LinkSchema = z.object({
  text: z.string(),
  href: z.string(),
});

export const CrawlerOutput = z.object({
  url: z.string(),
  title: z.string(),
  lang: z.string().optional(),
  headings: z.array(HeadingSchema).optional().default([]),
  main: z.array(MainContentSchema).optional().default([]),
  links: z.array(LinkSchema).optional().default([]),
});
export type CrawlerOutput = z.infer<typeof CrawlerOutput>;

/* =============================================================================
 * 5) Classifier出力の構造
 * ============================================================================= */

export const ClassifierOutput = z.object({
  source_crawl_file: z.string().optional(),
  source_crawl_path: z.string().optional(),
  page_index: z.number().optional(),
  content_type: ContentType,
  service_category: ServiceCategory,
  audience: z.array(Audience).default([]),
  topic: z.array(Topic).default([]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  url: z.string(),
  title: z.string(),
  file_name: z.string().optional(),
});
export type ClassifierOutput = z.infer<typeof ClassifierOutput>;

/* =============================================================================
 * 6) RichText（構造化テキスト）- レンダリング用
 * ============================================================================= */

const TextRunSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  link: z.object({
    href: z.string(),
    label: z.string().optional(),
    external: z.boolean().optional(),
  }).optional(),
  sourceRef: z.number().optional(), // 参照番号（例: 1 → テキスト末尾に[1]を表示）
});

type TextRun = z.infer<typeof TextRunSchema>;

export type RichTextNodeType =
  | { type: "heading"; level: 2 | 3 | 4; text: string; sourceRef?: number }
  | { type: "paragraph"; runs: TextRun[] }
  | { type: "list"; ordered: boolean; items: RichTextNodeType[][] }
  | { type: "callout"; severity: "info" | "warning" | "danger"; title?: string; content: RichTextNodeType[] }
  | { type: "divider" };

/* =============================================================================
 * 6.5) Source（情報ソース）- Wikipedia風の参照表示用
 * ============================================================================= */

export const SourceSchema = z.object({
  id: z.number(),                    // 参照番号 [1], [2], ...
  url: z.string(),                   // ソースURL
  title: z.string().optional(),      // ページタイトル
  accessedAt: z.string().optional(), // アクセス日時 (ISO 8601)
  variables: z.array(z.string()).optional(), // このソースから取得した変数名
});
export type Source = z.infer<typeof SourceSchema>;

export const RichTextNode: z.ZodType<RichTextNodeType> = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    text: z.string(),
    sourceRef: z.number().optional(),
  }),
  z.object({
    type: z.literal("paragraph"),
    runs: z.array(TextRunSchema),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.array(z.lazy(() => RichTextNode))),
  }),
  z.object({
    type: z.literal("callout"),
    severity: z.enum(["info", "warning", "danger"]),
    title: z.string().optional(),
    content: z.array(z.lazy(() => RichTextNode)),
  }),
  z.object({
    type: z.literal("divider"),
  }),
]);

/* =============================================================================
 * 7) Blocks（DADSコンポーネント対応）
 * ============================================================================= */

const BaseBlock = z.object({
  id: z.string(),
});

// ===== 共通ブロック =====

const BreadcrumbsBlock = BaseBlock.extend({
  type: z.literal("Breadcrumbs"),
  props: z.object({
    items: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  }),
});

const TitleBlock = BaseBlock.extend({
  type: z.literal("Title"),
  props: z.object({
    text: z.string(),
  }),
});

const SummaryBlock = BaseBlock.extend({
  type: z.literal("Summary"),
  props: z.object({
    text: z.string(),
  }),
});

const RichTextBlock = BaseBlock.extend({
  type: z.literal("RichText"),
  props: z.object({
    content: z.array(RichTextNode),
  }),
});

// RawContent: Crawlerの生データをそのまま保持（Structurerなしで動作）
const RawContentBlock = BaseBlock.extend({
  type: z.literal("RawContent"),
  props: z.object({
    headings: z.array(HeadingSchema).optional(),
    main: z.array(MainContentSchema).optional(),
    links: z.array(LinkSchema).optional(),
  }),
});

const TableBlock = BaseBlock.extend({
  type: z.literal("Table"),
  props: z.object({
    rows: z.array(z.object({
      label: z.string(),
      value: z.union([z.string(), z.array(RichTextNode)]),
    })),
  }),
});

const ResourceListBlock = BaseBlock.extend({
  type: z.literal("ResourceList"),
  props: z.object({
    heading: z.string().optional(),
    items: z.array(z.object({
      title: z.string(),
      href: z.string(),
      description: z.string().optional(),
      meta: z.string().optional(),
      external: z.boolean().optional(),
    })),
  }),
});

const NotificationBannerBlock = BaseBlock.extend({
  type: z.literal("NotificationBanner"),
  props: z.object({
    // 必須要素
    severity: z.enum(["info", "warning", "danger", "success"]),
    title: z.string(), // バナータイトルは必須
    // 任意要素
    content: z.array(RichTextNode).optional(), // バナーデスクリプション（任意）
    // オプション要素
    date: z.object({
      dateTime: z.string(), // ISO 8601形式 (YYYY-MM-DD or YYYY-MM)
      display: z.string(),  // 表示用テキスト（例: "2024年7月1日", "7月1日"）
    }).optional(),
    showCloseButton: z.boolean().optional(), // 閉じるボタン表示フラグ
    actions: z.array(z.object({
      label: z.string(),
      href: z.string().optional(),
      variant: z.enum(["solid-fill", "outline"]).optional(),
    })).optional(),
  }),
});

const AccordionBlock = BaseBlock.extend({
  type: z.literal("Accordion"),
  props: z.object({
    items: z.array(z.object({
      title: z.string(),
      content: z.array(RichTextNode),
    })),
  }),
});

const RelatedLinksBlock = BaseBlock.extend({
  type: z.literal("RelatedLinks"),
  props: z.object({
    items: z.array(z.object({
      title: z.string(),
      href: z.string(),
      external: z.boolean().optional(),
    })),
  }),
});

const ContactBlock = BaseBlock.extend({
  type: z.literal("Contact"),
  props: z.object({
    department: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
    hours: z.string().optional(),
    address: z.string().optional(),
    map_url: z.string().optional(),
  }),
});

// ===== ナビゲーション・レイアウトブロック =====

const HeroBlock = BaseBlock.extend({
  type: z.literal("Hero"),
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
  }),
});

const TopicGridBlock = BaseBlock.extend({
  type: z.literal("TopicGrid"),
  props: z.object({
    items: z.array(z.object({
      title: z.string(),
      href: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
      icon: z.string().optional(),
    })),
  }),
});

const TopicListBlock = BaseBlock.extend({
  type: z.literal("TopicList"),
  props: z.object({
    items: z.array(z.object({
      title: z.string(),
      href: z.string(),
      description: z.string().optional(),
    })),
  }),
});

// ===== content_type固有ブロック =====

const ActionButtonBlock = BaseBlock.extend({
  type: z.literal("ActionButton"),
  props: z.object({
    label: z.string(),
    href: z.string(),
    action_type: z.enum(["web_form", "pdf", "external_link"]),
  }),
});

const StepNavigationBlock = BaseBlock.extend({
  type: z.literal("StepNavigation"),
  props: z.object({
    steps: z.array(z.object({
      title: z.string(),
      body: z.array(RichTextNode),
    })),
  }),
});

const ContactCardBlock = BaseBlock.extend({
  type: z.literal("ContactCard"),
  props: z.object({
    department: z.string().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().optional(),
    hours: z.string().optional(),
    address: z.string().optional(),
    map_url: z.string().optional(),
  }),
});

const NewsMetaBlock = BaseBlock.extend({
  type: z.literal("NewsMeta"),
  props: z.object({
    published_at: z.string(),
    updated_at: z.string().optional(),
    category: z.string().optional(),
  }),
});

const DirectoryListBlock = BaseBlock.extend({
  type: z.literal("DirectoryList"),
  props: z.object({
    items: z.array(z.object({
      name: z.string(),
      address: z.string().optional(),
      phone: z.string().optional(),
      hours: z.string().optional(),
      url: z.string().optional(),
      description: z.string().optional(),
    })),
  }),
});

// ===== 情報ソースブロック =====

const SourcesBlock = BaseBlock.extend({
  type: z.literal("Sources"),
  props: z.object({
    heading: z.string().optional(), // デフォルト: "出典"
    // sources配列はArtifactレベルで管理
  }),
});

export const Block = z.discriminatedUnion("type", [
  BreadcrumbsBlock,
  TitleBlock,
  SummaryBlock,
  RichTextBlock,
  RawContentBlock,  // NEW: Structurerなしで動作
  TableBlock,
  ResourceListBlock,
  NotificationBannerBlock,
  AccordionBlock,
  RelatedLinksBlock,
  ContactBlock,
  // ナビゲーション・レイアウトブロック
  HeroBlock,
  TopicGridBlock,
  TopicListBlock,
  // content_type固有ブロック
  ActionButtonBlock,
  StepNavigationBlock,
  ContactCardBlock,
  NewsMetaBlock,
  DirectoryListBlock,
  // 情報ソースブロック
  SourcesBlock,
]);
export type Block = z.infer<typeof Block>;

/* =============================================================================
 * 8) Search Fields
 * ============================================================================= */

export const SearchFields = z.object({
  summary: z.string(),
  keywords: z.array(z.string()).default([]),
  plain_text: z.string(),
});
export type SearchFields = z.infer<typeof SearchFields>;

/* =============================================================================
 * 9) Artifact 本体
 *
 * 入力: crawler_output + classifier_output（Structurer不要）
 * ============================================================================= */

// v1形式のブロック（柔軟なprops）
const V1Block = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
});

// v1形式のArtifact（後方互換性）
const ArtifactV1 = z.object({
  schema_version: z.string(), // "1.0.0" など
  page_id: z.string(),
  municipality_id: z.string(),
  path: z.string(),
  title: z.string(),
  description: z.string().optional(),
  page_type: z.string().optional(), // v1固有
  content_type: z.string().optional(),
  category: z.string().optional(),
  service_category: z.string().optional(),
  source: z.object({
    source_url: z.string(),
    fetched_at: z.string().optional(),
    content_type: z.string().optional(),
    content_hash: z.string().optional(),
  }),
  pipeline: z.object({
    run_id: z.string().optional(),
    generated_at: z.string(),
    schema_version: z.string().optional(),
  }),
  blocks: z.array(V1Block),
  search: z.object({
    summary: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    plain_text: z.string().optional(),
  }).optional(),
});

// v2形式のArtifact（厳密なスキーマ）
const ArtifactV2 = z.object({
  // バージョン・識別
  schema_version: z.literal("2.0.0"),
  page_id: z.string(),
  municipality_id: z.string(),
  path: z.string(),

  // コンテンツメタ
  title: z.string(),
  description: z.string().optional(),

  // 分類（Classifier出力から）
  content_type: ContentType,
  service_category: ServiceCategory,
  audience: z.array(Audience).default([]),
  topic: z.array(Topic).default([]),

  // 分類メタ
  classification: z.object({
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
  }).optional(),

  // ソース情報（Crawler出力から）
  source: z.object({
    source_url: z.string(),
    crawl_file: z.string().optional(),      // クローラー出力ファイル名
    fetched_at: z.string().optional(),
    content_hash: z.string().optional(),
  }),

  // パイプライン情報
  pipeline: z.object({
    run_id: z.string(),
    generated_at: z.string(),
    schema_version: z.string(),
    classifier_version: z.string().optional(),
    transformer_version: z.string().optional(),
  }),

  // 生データ（Structurerなしで動作）
  raw: z.object({
    headings: z.array(HeadingSchema).optional(),
    main: z.array(MainContentSchema).optional(),
    links: z.array(LinkSchema).optional(),
  }).optional(),

  // Markdown形式のコンテンツ（LLM生成）
  markdown_content: z.string().optional(),

  // 構造化ブロック（Structurer経由、または変換器で生成）
  blocks: z.array(Block),

  // 情報ソース（Wikipedia風の参照表示用）
  sources: z.array(SourceSchema).optional(),

  // 検索用（自動生成可能）
  search: SearchFields,
});

// v1/v2両対応のArtifactスキーマ
export const Artifact = z.union([ArtifactV2, ArtifactV1]);
export type Artifact = z.infer<typeof Artifact>;

// v2専用の型（厳密なバリデーション用）
export const ArtifactV2Schema = ArtifactV2;
export type ArtifactV2 = z.infer<typeof ArtifactV2>;

/* =============================================================================
 * 10) ファクトリ関数: Crawler + Classifier → Artifact
 * ============================================================================= */

export interface CreateArtifactInput {
  crawler: CrawlerOutput;
  classifier: ClassifierOutput;
  municipalityId: string;
  runId?: string;
}

/**
 * CrawlerとClassifierの出力からArtifactを生成
 * Structurerなしでも動作する最小限のArtifact
 */
export function createArtifactFromCrawlerAndClassifier(
  input: CreateArtifactInput
): Artifact {
  const { crawler, classifier, municipalityId, runId } = input;
  const now = new Date().toISOString();

  // URLからパスを抽出
  let path = "/";
  try {
    const url = new URL(crawler.url);
    path = url.pathname;
  } catch {
    // URLパース失敗時はそのまま
    path = crawler.url;
  }

  // page_idを生成（ファイル名またはURLハッシュ）
  const pageId = classifier.file_name?.replace(".json", "") ||
    `${municipalityId}-${path.replace(/\//g, "-").replace(/^-|-$/g, "")}`;

  // Breadcrumbsを生成（パスから）
  const pathParts = path.split("/").filter(Boolean);
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    ...pathParts.map((part, index) => ({
      label: part,
      href: "/" + pathParts.slice(0, index + 1).join("/"),
    })),
  ];

  // タイトルからページタイトルを抽出（サイト名を除去）
  const title = crawler.title.split("|")[0].trim();

  // 検索用プレーンテキストを生成
  const plainText = [
    title,
    ...crawler.headings?.map((h) => h.text) || [],
    ...crawler.main?.map((m) => {
      if (m.type === "p") return m.text;
      if (m.type === "ul" || m.type === "ol") return m.items.join(" ");
      return "";
    }) || [],
  ].join(" ").slice(0, 1000);

  return {
    schema_version: "2.0.0",
    page_id: pageId,
    municipality_id: municipalityId,
    path,
    title,
    content_type: classifier.content_type,
    service_category: classifier.service_category,
    audience: classifier.audience,
    topic: classifier.topic,
    classification: {
      confidence: classifier.confidence,
      reasoning: classifier.reasoning,
    },
    source: {
      source_url: crawler.url,
      crawl_file: classifier.source_crawl_file || classifier.file_name,
    },
    pipeline: {
      run_id: runId || `run-${Date.now()}`,
      generated_at: now,
      schema_version: "2.0.0",
    },
    raw: {
      headings: crawler.headings,
      main: crawler.main,
      links: crawler.links,
    },
    blocks: [
      {
        id: "breadcrumbs-1",
        type: "Breadcrumbs",
        props: { items: breadcrumbItems },
      },
      {
        id: "title-1",
        type: "Title",
        props: { text: title },
      },
      {
        id: "raw-content-1",
        type: "RawContent",
        props: {
          headings: crawler.headings,
          main: crawler.main,
          links: crawler.links,
        },
      },
    ],
    search: {
      summary: title,
      keywords: [
        classifier.content_type,
        classifier.service_category,
        ...classifier.audience,
        ...classifier.topic,
      ],
      plain_text: plainText,
    },
  };
}

/* =============================================================================
 * 11) Skeleton Templates
 * ============================================================================= */

export const Skeletons = {
  service: ["Breadcrumbs", "Title", "Summary", "ResourceList", "RelatedLinks", "Contact"] as const,
  guide: ["Breadcrumbs", "Title", "Summary", "RichText", "Table", "Accordion", "RelatedLinks", "Contact"] as const,
  form: ["Breadcrumbs", "Title", "Summary", "Table", "ActionButton", "ResourceList", "RelatedLinks", "Contact"] as const,
  step_by_step: ["Breadcrumbs", "Title", "Summary", "StepNavigation", "RelatedLinks", "Contact"] as const,
  contact: ["Breadcrumbs", "Title", "Summary", "ContactCard", "Table", "Accordion", "RelatedLinks"] as const,
  news: ["Breadcrumbs", "Title", "NewsMeta", "RichText", "ResourceList", "RelatedLinks", "Contact"] as const,
  directory: ["Breadcrumbs", "Title", "Summary", "DirectoryList", "TopicGrid", "TopicList", "RichText", "RelatedLinks", "Contact"] as const,
  other: ["Breadcrumbs", "Title", "Summary", "RawContent", "RelatedLinks", "Contact"] as const,
  // ホーム・ハブページ用
  home: ["Hero", "TopicGrid", "Contact"] as const,
  hub: ["Breadcrumbs", "Hero", "TopicGrid", "TopicList"] as const,
};

/* =============================================================================
 * 12) ContentType / ServiceCategory ガイド
 * ============================================================================= */

export const CONTENT_TYPE_GUIDE = {
  service: {
    description: "サービスハブページ",
    purpose: "市民の「やりたいこと」を表すIAの中心",
    example: "「保育園の入園」「粗大ごみの出し方」",
  },
  guide: {
    description: "詳細説明ページ",
    purpose: "サービスの詳細説明（手順・条件・注意事項）",
    example: "「保育園入園の条件と必要書類」",
  },
  form: {
    description: "申請・届出ページ",
    purpose: "申請・届出の入口（PDF/Web/外部リンク）",
    example: "「保育園入園申込」「住民票の写しの交付申請」",
  },
  step_by_step: {
    description: "段階的手順ガイド",
    purpose: "ウィザード型の手順説明",
    example: "「転入届の出し方」",
  },
  contact: {
    description: "問い合わせ窓口ページ",
    purpose: "問い合わせ・相談窓口情報",
    example: "「保育課へのお問い合わせ」",
  },
  news: {
    description: "お知らせ・告知",
    purpose: "お知らせ・告知記事",
    example: "「保育園入園申込受付開始」",
  },
  directory: {
    description: "施設リスト・一覧ページ",
    purpose: "施設・事業者リスト",
    example: "「市内保育園一覧」",
  },
  other: {
    description: "その他",
    purpose: "上記に分類できないページ",
    example: "「プライバシーポリシー」",
  },
} as const;

export const SERVICE_CATEGORY_GUIDE = {
  welfare: { description: "福祉・介護・障害者支援" },
  health: { description: "健康・医療・保健" },
  children: { description: "子育て・教育・学校" },
  housing: { description: "住まい・引越し・届出" },
  environment: { description: "環境・ごみ・リサイクル" },
  business: { description: "産業・商工・観光" },
  community: { description: "地域・コミュニティ・文化" },
  safety: { description: "防災・安全・消防" },
  government: { description: "行政・議会・選挙" },
  other: { description: "その他" },
} as const;

/* =============================================================================
 * 13) Utility functions
 * ============================================================================= */

export function validateArtifact(data: unknown): Artifact {
  return Artifact.parse(data);
}

export function safeValidateArtifact(data: unknown): {
  success: boolean;
  data?: Artifact;
  error?: z.ZodError;
} {
  const result = Artifact.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function getBlocksByType<T extends Block["type"]>(
  artifact: Artifact,
  type: T
): Extract<Block, { type: T }>[] {
  // v1/v2両対応: blocksをBlock[]として扱い、typeでフィルタ
  const blocks = artifact.blocks as Block[];
  return blocks.filter((b): b is Extract<Block, { type: T }> => b.type === type);
}

export function getFirstBlockByType<T extends Block["type"]>(
  artifact: Artifact,
  type: T
): Extract<Block, { type: T }> | undefined {
  // v1/v2両対応: blocksをBlock[]として扱い、typeで検索
  const blocks = artifact.blocks as Block[];
  return blocks.find((b): b is Extract<Block, { type: T }> => b.type === type);
}

/* =============================================================================
 * 14) 後方互換性
 * ============================================================================= */

// v1との互換性のための型エイリアス
/** @deprecated CategoryはServiceCategoryに変更されました */
export const Category = ServiceCategory;
/** @deprecated CategoryはServiceCategoryに変更されました */
export type Category = ServiceCategory;
