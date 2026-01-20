import { z } from "zod";
export const ContentType = z.enum([
    "service",
    "guide",
    "form",
    "step_by_step",
    "contact",
    "news",
    "directory",
    "other",
]);
export const ServiceCategory = z.enum([
    "welfare",
    "health",
    "children",
    "housing",
    "environment",
    "business",
    "community",
    "safety",
    "government",
    "other",
]);
export const Audience = z.enum([
    "residents",
    "businesses",
    "children_families",
    "elderly",
    "disabled",
    "foreigners",
]);
export const Topic = z.enum([
    "emergency",
    "seasonal",
    "covid",
    "digital",
]);
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
const TextRunSchema = z.object({
    text: z.string(),
    bold: z.boolean().optional(),
    link: z.object({
        href: z.string(),
        label: z.string().optional(),
        external: z.boolean().optional(),
    }).optional(),
});
export const RichTextNode = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("heading"),
        level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
        text: z.string(),
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
const BaseBlock = z.object({
    id: z.string(),
});
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
        severity: z.enum(["info", "warning", "danger", "success"]),
        title: z.string().optional(),
        content: z.array(RichTextNode),
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
export const Block = z.discriminatedUnion("type", [
    BreadcrumbsBlock,
    TitleBlock,
    SummaryBlock,
    RichTextBlock,
    RawContentBlock,
    TableBlock,
    ResourceListBlock,
    NotificationBannerBlock,
    AccordionBlock,
    RelatedLinksBlock,
    ContactBlock,
    ActionButtonBlock,
    StepNavigationBlock,
    ContactCardBlock,
    NewsMetaBlock,
    DirectoryListBlock,
]);
export const SearchFields = z.object({
    summary: z.string(),
    keywords: z.array(z.string()).default([]),
    plain_text: z.string(),
});
const V1Block = z.object({
    id: z.string(),
    type: z.string(),
    props: z.record(z.string(), z.unknown()),
});
const ArtifactV1 = z.object({
    schema_version: z.string(),
    page_id: z.string(),
    municipality_id: z.string(),
    path: z.string(),
    title: z.string(),
    description: z.string().optional(),
    page_type: z.string().optional(),
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
const ArtifactV2 = z.object({
    schema_version: z.literal("2.0.0"),
    page_id: z.string(),
    municipality_id: z.string(),
    path: z.string(),
    title: z.string(),
    description: z.string().optional(),
    content_type: ContentType,
    service_category: ServiceCategory,
    audience: z.array(Audience).default([]),
    topic: z.array(Topic).default([]),
    classification: z.object({
        confidence: z.number().min(0).max(1),
        reasoning: z.string().optional(),
    }).optional(),
    source: z.object({
        source_url: z.string(),
        crawl_file: z.string().optional(),
        fetched_at: z.string().optional(),
        content_hash: z.string().optional(),
    }),
    pipeline: z.object({
        run_id: z.string(),
        generated_at: z.string(),
        schema_version: z.string(),
        classifier_version: z.string().optional(),
        transformer_version: z.string().optional(),
    }),
    raw: z.object({
        headings: z.array(HeadingSchema).optional(),
        main: z.array(MainContentSchema).optional(),
        links: z.array(LinkSchema).optional(),
    }).optional(),
    blocks: z.array(Block),
    search: SearchFields,
});
export const Artifact = z.union([ArtifactV2, ArtifactV1]);
export const ArtifactV2Schema = ArtifactV2;
export function createArtifactFromCrawlerAndClassifier(input) {
    const { crawler, classifier, municipalityId, runId } = input;
    const now = new Date().toISOString();
    let path = "/";
    try {
        const url = new URL(crawler.url);
        path = url.pathname;
    }
    catch {
        path = crawler.url;
    }
    const pageId = classifier.file_name?.replace(".json", "") ||
        `${municipalityId}-${path.replace(/\//g, "-").replace(/^-|-$/g, "")}`;
    const pathParts = path.split("/").filter(Boolean);
    const breadcrumbItems = [
        { label: "ホーム", href: "/" },
        ...pathParts.map((part, index) => ({
            label: part,
            href: "/" + pathParts.slice(0, index + 1).join("/"),
        })),
    ];
    const title = crawler.title.split("|")[0].trim();
    const plainText = [
        title,
        ...crawler.headings?.map((h) => h.text) || [],
        ...crawler.main?.map((m) => {
            if (m.type === "p")
                return m.text;
            if (m.type === "ul" || m.type === "ol")
                return m.items.join(" ");
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
export const Skeletons = {
    service: ["Breadcrumbs", "Title", "Summary", "ResourceList", "RelatedLinks", "Contact"],
    guide: ["Breadcrumbs", "Title", "Summary", "RichText", "Table", "Accordion", "RelatedLinks", "Contact"],
    form: ["Breadcrumbs", "Title", "Summary", "Table", "ActionButton", "ResourceList", "RelatedLinks", "Contact"],
    step_by_step: ["Breadcrumbs", "Title", "Summary", "StepNavigation", "RelatedLinks", "Contact"],
    contact: ["Breadcrumbs", "Title", "Summary", "ContactCard", "Table", "Accordion", "RelatedLinks"],
    news: ["Breadcrumbs", "Title", "NewsMeta", "RichText", "ResourceList", "RelatedLinks", "Contact"],
    directory: ["Breadcrumbs", "Title", "Summary", "DirectoryList", "RichText", "RelatedLinks", "Contact"],
    other: ["Breadcrumbs", "Title", "Summary", "RawContent", "RelatedLinks", "Contact"],
};
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
};
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
};
export function validateArtifact(data) {
    return Artifact.parse(data);
}
export function safeValidateArtifact(data) {
    const result = Artifact.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
export function getBlocksByType(artifact, type) {
    const blocks = artifact.blocks;
    return blocks.filter((b) => b.type === type);
}
export function getFirstBlockByType(artifact, type) {
    const blocks = artifact.blocks;
    return blocks.find((b) => b.type === type);
}
export const Category = ServiceCategory;
//# sourceMappingURL=innoma-artifact-schema.v2.js.map