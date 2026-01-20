import { z } from "zod";
export declare const ContentType: z.ZodEnum<{
    news: "news";
    contact: "contact";
    service: "service";
    guide: "guide";
    form: "form";
    step_by_step: "step_by_step";
    directory: "directory";
    other: "other";
}>;
export type ContentType = z.infer<typeof ContentType>;
export declare const ServiceCategory: z.ZodEnum<{
    other: "other";
    welfare: "welfare";
    health: "health";
    children: "children";
    housing: "housing";
    environment: "environment";
    business: "business";
    community: "community";
    safety: "safety";
    government: "government";
}>;
export type ServiceCategory = z.infer<typeof ServiceCategory>;
export declare const Audience: z.ZodEnum<{
    residents: "residents";
    businesses: "businesses";
    children_families: "children_families";
    elderly: "elderly";
    disabled: "disabled";
    foreigners: "foreigners";
}>;
export type Audience = z.infer<typeof Audience>;
export declare const Topic: z.ZodEnum<{
    emergency: "emergency";
    seasonal: "seasonal";
    covid: "covid";
    digital: "digital";
}>;
export type Topic = z.infer<typeof Topic>;
export declare const HeadingSchema: z.ZodObject<{
    level: z.ZodNumber;
    text: z.ZodString;
}, z.core.$strip>;
export declare const LinkSchema: z.ZodObject<{
    text: z.ZodString;
    href: z.ZodString;
}, z.core.$strip>;
export declare const CrawlerOutput: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodString;
    lang: z.ZodOptional<z.ZodString>;
    headings: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        level: z.ZodNumber;
        text: z.ZodString;
    }, z.core.$strip>>>>;
    main: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"p">;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"ul">;
        items: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"ol">;
        items: z.ZodArray<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"table">;
        rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
    }, z.core.$strip>], "type">>>>;
    links: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        href: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export type CrawlerOutput = z.infer<typeof CrawlerOutput>;
export declare const ClassifierOutput: z.ZodObject<{
    source_crawl_file: z.ZodOptional<z.ZodString>;
    source_crawl_path: z.ZodOptional<z.ZodString>;
    page_index: z.ZodOptional<z.ZodNumber>;
    content_type: z.ZodEnum<{
        news: "news";
        contact: "contact";
        service: "service";
        guide: "guide";
        form: "form";
        step_by_step: "step_by_step";
        directory: "directory";
        other: "other";
    }>;
    service_category: z.ZodEnum<{
        other: "other";
        welfare: "welfare";
        health: "health";
        children: "children";
        housing: "housing";
        environment: "environment";
        business: "business";
        community: "community";
        safety: "safety";
        government: "government";
    }>;
    audience: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        residents: "residents";
        businesses: "businesses";
        children_families: "children_families";
        elderly: "elderly";
        disabled: "disabled";
        foreigners: "foreigners";
    }>>>;
    topic: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        emergency: "emergency";
        seasonal: "seasonal";
        covid: "covid";
        digital: "digital";
    }>>>;
    confidence: z.ZodNumber;
    reasoning: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    title: z.ZodString;
    file_name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ClassifierOutput = z.infer<typeof ClassifierOutput>;
declare const TextRunSchema: z.ZodObject<{
    text: z.ZodString;
    bold: z.ZodOptional<z.ZodBoolean>;
    link: z.ZodOptional<z.ZodObject<{
        href: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        external: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type TextRun = z.infer<typeof TextRunSchema>;
export type RichTextNodeType = {
    type: "heading";
    level: 2 | 3 | 4;
    text: string;
} | {
    type: "paragraph";
    runs: TextRun[];
} | {
    type: "list";
    ordered: boolean;
    items: RichTextNodeType[][];
} | {
    type: "callout";
    severity: "info" | "warning" | "danger";
    title?: string;
    content: RichTextNodeType[];
} | {
    type: "divider";
};
export declare const RichTextNode: z.ZodType<RichTextNodeType>;
export declare const Block: z.ZodDiscriminatedUnion<[z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"Breadcrumbs">;
    props: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"Title">;
    props: z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"Summary">;
    props: z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"RichText">;
    props: z.ZodObject<{
        content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"RawContent">;
    props: z.ZodObject<{
        headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
            level: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>>>;
        main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"p">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ul">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ol">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"table">;
            rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strip>], "type">>>;
        links: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            href: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"Table">;
    props: z.ZodObject<{
        rows: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>]>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"ResourceList">;
    props: z.ZodObject<{
        heading: z.ZodOptional<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            href: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            meta: z.ZodOptional<z.ZodString>;
            external: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"NotificationBanner">;
    props: z.ZodObject<{
        severity: z.ZodEnum<{
            success: "success";
            info: "info";
            warning: "warning";
            danger: "danger";
        }>;
        title: z.ZodOptional<z.ZodString>;
        content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"Accordion">;
    props: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"RelatedLinks">;
    props: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            href: z.ZodString;
            external: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"Contact">;
    props: z.ZodObject<{
        department: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        fax: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        hours: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        map_url: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"ActionButton">;
    props: z.ZodObject<{
        label: z.ZodString;
        href: z.ZodString;
        action_type: z.ZodEnum<{
            web_form: "web_form";
            pdf: "pdf";
            external_link: "external_link";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"StepNavigation">;
    props: z.ZodObject<{
        steps: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            body: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"ContactCard">;
    props: z.ZodObject<{
        department: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        fax: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        hours: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        map_url: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"NewsMeta">;
    props: z.ZodObject<{
        published_at: z.ZodString;
        updated_at: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"DirectoryList">;
    props: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>], "type">;
export type Block = z.infer<typeof Block>;
export declare const SearchFields: z.ZodObject<{
    summary: z.ZodString;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString>>;
    plain_text: z.ZodString;
}, z.core.$strip>;
export type SearchFields = z.infer<typeof SearchFields>;
declare const ArtifactV2: z.ZodObject<{
    schema_version: z.ZodLiteral<"2.0.0">;
    page_id: z.ZodString;
    municipality_id: z.ZodString;
    path: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    content_type: z.ZodEnum<{
        news: "news";
        contact: "contact";
        service: "service";
        guide: "guide";
        form: "form";
        step_by_step: "step_by_step";
        directory: "directory";
        other: "other";
    }>;
    service_category: z.ZodEnum<{
        other: "other";
        welfare: "welfare";
        health: "health";
        children: "children";
        housing: "housing";
        environment: "environment";
        business: "business";
        community: "community";
        safety: "safety";
        government: "government";
    }>;
    audience: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        residents: "residents";
        businesses: "businesses";
        children_families: "children_families";
        elderly: "elderly";
        disabled: "disabled";
        foreigners: "foreigners";
    }>>>;
    topic: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        emergency: "emergency";
        seasonal: "seasonal";
        covid: "covid";
        digital: "digital";
    }>>>;
    classification: z.ZodOptional<z.ZodObject<{
        confidence: z.ZodNumber;
        reasoning: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    source: z.ZodObject<{
        source_url: z.ZodString;
        crawl_file: z.ZodOptional<z.ZodString>;
        fetched_at: z.ZodOptional<z.ZodString>;
        content_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    pipeline: z.ZodObject<{
        run_id: z.ZodString;
        generated_at: z.ZodString;
        schema_version: z.ZodString;
        classifier_version: z.ZodOptional<z.ZodString>;
        transformer_version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    raw: z.ZodOptional<z.ZodObject<{
        headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
            level: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>>>;
        main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"p">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ul">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ol">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"table">;
            rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strip>], "type">>>;
        links: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            href: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Breadcrumbs">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Title">;
        props: z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Summary">;
        props: z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RichText">;
        props: z.ZodObject<{
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RawContent">;
        props: z.ZodObject<{
            headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                level: z.ZodNumber;
                text: z.ZodString;
            }, z.core.$strip>>>;
            main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"p">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"ul">;
                items: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"ol">;
                items: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"table">;
                rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
            }, z.core.$strip>], "type">>>;
            links: z.ZodOptional<z.ZodArray<z.ZodObject<{
                text: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Table">;
        props: z.ZodObject<{
            rows: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                value: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>]>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ResourceList">;
        props: z.ZodObject<{
            heading: z.ZodOptional<z.ZodString>;
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                href: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                meta: z.ZodOptional<z.ZodString>;
                external: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"NotificationBanner">;
        props: z.ZodObject<{
            severity: z.ZodEnum<{
                success: "success";
                info: "info";
                warning: "warning";
                danger: "danger";
            }>;
            title: z.ZodOptional<z.ZodString>;
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Accordion">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RelatedLinks">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                href: z.ZodString;
                external: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Contact">;
        props: z.ZodObject<{
            department: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            map_url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ActionButton">;
        props: z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
            action_type: z.ZodEnum<{
                web_form: "web_form";
                pdf: "pdf";
                external_link: "external_link";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"StepNavigation">;
        props: z.ZodObject<{
            steps: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                body: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ContactCard">;
        props: z.ZodObject<{
            department: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            map_url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"NewsMeta">;
        props: z.ZodObject<{
            published_at: z.ZodString;
            updated_at: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"DirectoryList">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                address: z.ZodOptional<z.ZodString>;
                phone: z.ZodOptional<z.ZodString>;
                hours: z.ZodOptional<z.ZodString>;
                url: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>], "type">>;
    search: z.ZodObject<{
        summary: z.ZodString;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString>>;
        plain_text: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const Artifact: z.ZodUnion<readonly [z.ZodObject<{
    schema_version: z.ZodLiteral<"2.0.0">;
    page_id: z.ZodString;
    municipality_id: z.ZodString;
    path: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    content_type: z.ZodEnum<{
        news: "news";
        contact: "contact";
        service: "service";
        guide: "guide";
        form: "form";
        step_by_step: "step_by_step";
        directory: "directory";
        other: "other";
    }>;
    service_category: z.ZodEnum<{
        other: "other";
        welfare: "welfare";
        health: "health";
        children: "children";
        housing: "housing";
        environment: "environment";
        business: "business";
        community: "community";
        safety: "safety";
        government: "government";
    }>;
    audience: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        residents: "residents";
        businesses: "businesses";
        children_families: "children_families";
        elderly: "elderly";
        disabled: "disabled";
        foreigners: "foreigners";
    }>>>;
    topic: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        emergency: "emergency";
        seasonal: "seasonal";
        covid: "covid";
        digital: "digital";
    }>>>;
    classification: z.ZodOptional<z.ZodObject<{
        confidence: z.ZodNumber;
        reasoning: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    source: z.ZodObject<{
        source_url: z.ZodString;
        crawl_file: z.ZodOptional<z.ZodString>;
        fetched_at: z.ZodOptional<z.ZodString>;
        content_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    pipeline: z.ZodObject<{
        run_id: z.ZodString;
        generated_at: z.ZodString;
        schema_version: z.ZodString;
        classifier_version: z.ZodOptional<z.ZodString>;
        transformer_version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    raw: z.ZodOptional<z.ZodObject<{
        headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
            level: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>>>;
        main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"p">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ul">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ol">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"table">;
            rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strip>], "type">>>;
        links: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            href: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Breadcrumbs">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Title">;
        props: z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Summary">;
        props: z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RichText">;
        props: z.ZodObject<{
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RawContent">;
        props: z.ZodObject<{
            headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                level: z.ZodNumber;
                text: z.ZodString;
            }, z.core.$strip>>>;
            main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"p">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"ul">;
                items: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"ol">;
                items: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"table">;
                rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
            }, z.core.$strip>], "type">>>;
            links: z.ZodOptional<z.ZodArray<z.ZodObject<{
                text: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Table">;
        props: z.ZodObject<{
            rows: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                value: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>]>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ResourceList">;
        props: z.ZodObject<{
            heading: z.ZodOptional<z.ZodString>;
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                href: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                meta: z.ZodOptional<z.ZodString>;
                external: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"NotificationBanner">;
        props: z.ZodObject<{
            severity: z.ZodEnum<{
                success: "success";
                info: "info";
                warning: "warning";
                danger: "danger";
            }>;
            title: z.ZodOptional<z.ZodString>;
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Accordion">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RelatedLinks">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                href: z.ZodString;
                external: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Contact">;
        props: z.ZodObject<{
            department: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            map_url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ActionButton">;
        props: z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
            action_type: z.ZodEnum<{
                web_form: "web_form";
                pdf: "pdf";
                external_link: "external_link";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"StepNavigation">;
        props: z.ZodObject<{
            steps: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                body: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ContactCard">;
        props: z.ZodObject<{
            department: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            map_url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"NewsMeta">;
        props: z.ZodObject<{
            published_at: z.ZodString;
            updated_at: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"DirectoryList">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                address: z.ZodOptional<z.ZodString>;
                phone: z.ZodOptional<z.ZodString>;
                hours: z.ZodOptional<z.ZodString>;
                url: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>], "type">>;
    search: z.ZodObject<{
        summary: z.ZodString;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString>>;
        plain_text: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    schema_version: z.ZodString;
    page_id: z.ZodString;
    municipality_id: z.ZodString;
    path: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    page_type: z.ZodOptional<z.ZodString>;
    content_type: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    service_category: z.ZodOptional<z.ZodString>;
    source: z.ZodObject<{
        source_url: z.ZodString;
        fetched_at: z.ZodOptional<z.ZodString>;
        content_type: z.ZodOptional<z.ZodString>;
        content_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    pipeline: z.ZodObject<{
        run_id: z.ZodOptional<z.ZodString>;
        generated_at: z.ZodString;
        schema_version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    blocks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        props: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>>;
    search: z.ZodOptional<z.ZodObject<{
        summary: z.ZodOptional<z.ZodString>;
        keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
        plain_text: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>]>;
export type Artifact = z.infer<typeof Artifact>;
export declare const ArtifactV2Schema: z.ZodObject<{
    schema_version: z.ZodLiteral<"2.0.0">;
    page_id: z.ZodString;
    municipality_id: z.ZodString;
    path: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    content_type: z.ZodEnum<{
        news: "news";
        contact: "contact";
        service: "service";
        guide: "guide";
        form: "form";
        step_by_step: "step_by_step";
        directory: "directory";
        other: "other";
    }>;
    service_category: z.ZodEnum<{
        other: "other";
        welfare: "welfare";
        health: "health";
        children: "children";
        housing: "housing";
        environment: "environment";
        business: "business";
        community: "community";
        safety: "safety";
        government: "government";
    }>;
    audience: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        residents: "residents";
        businesses: "businesses";
        children_families: "children_families";
        elderly: "elderly";
        disabled: "disabled";
        foreigners: "foreigners";
    }>>>;
    topic: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        emergency: "emergency";
        seasonal: "seasonal";
        covid: "covid";
        digital: "digital";
    }>>>;
    classification: z.ZodOptional<z.ZodObject<{
        confidence: z.ZodNumber;
        reasoning: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    source: z.ZodObject<{
        source_url: z.ZodString;
        crawl_file: z.ZodOptional<z.ZodString>;
        fetched_at: z.ZodOptional<z.ZodString>;
        content_hash: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    pipeline: z.ZodObject<{
        run_id: z.ZodString;
        generated_at: z.ZodString;
        schema_version: z.ZodString;
        classifier_version: z.ZodOptional<z.ZodString>;
        transformer_version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    raw: z.ZodOptional<z.ZodObject<{
        headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
            level: z.ZodNumber;
            text: z.ZodString;
        }, z.core.$strip>>>;
        main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            type: z.ZodLiteral<"p">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ul">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"ol">;
            items: z.ZodArray<z.ZodString>;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"table">;
            rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
        }, z.core.$strip>], "type">>>;
        links: z.ZodOptional<z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            href: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Breadcrumbs">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Title">;
        props: z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Summary">;
        props: z.ZodObject<{
            text: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RichText">;
        props: z.ZodObject<{
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RawContent">;
        props: z.ZodObject<{
            headings: z.ZodOptional<z.ZodArray<z.ZodObject<{
                level: z.ZodNumber;
                text: z.ZodString;
            }, z.core.$strip>>>;
            main: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
                type: z.ZodLiteral<"p">;
                text: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"ul">;
                items: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"ol">;
                items: z.ZodArray<z.ZodString>;
            }, z.core.$strip>, z.ZodObject<{
                type: z.ZodLiteral<"table">;
                rows: z.ZodOptional<z.ZodArray<z.ZodArray<z.ZodString>>>;
            }, z.core.$strip>], "type">>>;
            links: z.ZodOptional<z.ZodArray<z.ZodObject<{
                text: z.ZodString;
                href: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Table">;
        props: z.ZodObject<{
            rows: z.ZodArray<z.ZodObject<{
                label: z.ZodString;
                value: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>]>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ResourceList">;
        props: z.ZodObject<{
            heading: z.ZodOptional<z.ZodString>;
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                href: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                meta: z.ZodOptional<z.ZodString>;
                external: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"NotificationBanner">;
        props: z.ZodObject<{
            severity: z.ZodEnum<{
                success: "success";
                info: "info";
                warning: "warning";
                danger: "danger";
            }>;
            title: z.ZodOptional<z.ZodString>;
            content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Accordion">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                content: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"RelatedLinks">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                href: z.ZodString;
                external: z.ZodOptional<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"Contact">;
        props: z.ZodObject<{
            department: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            map_url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ActionButton">;
        props: z.ZodObject<{
            label: z.ZodString;
            href: z.ZodString;
            action_type: z.ZodEnum<{
                web_form: "web_form";
                pdf: "pdf";
                external_link: "external_link";
            }>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"StepNavigation">;
        props: z.ZodObject<{
            steps: z.ZodArray<z.ZodObject<{
                title: z.ZodString;
                body: z.ZodArray<z.ZodType<RichTextNodeType, unknown, z.core.$ZodTypeInternals<RichTextNodeType, unknown>>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"ContactCard">;
        props: z.ZodObject<{
            department: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            fax: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            hours: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            map_url: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"NewsMeta">;
        props: z.ZodObject<{
            published_at: z.ZodString;
            updated_at: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"DirectoryList">;
        props: z.ZodObject<{
            items: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                address: z.ZodOptional<z.ZodString>;
                phone: z.ZodOptional<z.ZodString>;
                hours: z.ZodOptional<z.ZodString>;
                url: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>], "type">>;
    search: z.ZodObject<{
        summary: z.ZodString;
        keywords: z.ZodDefault<z.ZodArray<z.ZodString>>;
        plain_text: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ArtifactV2 = z.infer<typeof ArtifactV2>;
export interface CreateArtifactInput {
    crawler: CrawlerOutput;
    classifier: ClassifierOutput;
    municipalityId: string;
    runId?: string;
}
export declare function createArtifactFromCrawlerAndClassifier(input: CreateArtifactInput): Artifact;
export declare const Skeletons: {
    service: readonly ["Breadcrumbs", "Title", "Summary", "ResourceList", "RelatedLinks", "Contact"];
    guide: readonly ["Breadcrumbs", "Title", "Summary", "RichText", "Table", "Accordion", "RelatedLinks", "Contact"];
    form: readonly ["Breadcrumbs", "Title", "Summary", "Table", "ActionButton", "ResourceList", "RelatedLinks", "Contact"];
    step_by_step: readonly ["Breadcrumbs", "Title", "Summary", "StepNavigation", "RelatedLinks", "Contact"];
    contact: readonly ["Breadcrumbs", "Title", "Summary", "ContactCard", "Table", "Accordion", "RelatedLinks"];
    news: readonly ["Breadcrumbs", "Title", "NewsMeta", "RichText", "ResourceList", "RelatedLinks", "Contact"];
    directory: readonly ["Breadcrumbs", "Title", "Summary", "DirectoryList", "RichText", "RelatedLinks", "Contact"];
    other: readonly ["Breadcrumbs", "Title", "Summary", "RawContent", "RelatedLinks", "Contact"];
};
export declare const CONTENT_TYPE_GUIDE: {
    readonly service: {
        readonly description: "サービスハブページ";
        readonly purpose: "市民の「やりたいこと」を表すIAの中心";
        readonly example: "「保育園の入園」「粗大ごみの出し方」";
    };
    readonly guide: {
        readonly description: "詳細説明ページ";
        readonly purpose: "サービスの詳細説明（手順・条件・注意事項）";
        readonly example: "「保育園入園の条件と必要書類」";
    };
    readonly form: {
        readonly description: "申請・届出ページ";
        readonly purpose: "申請・届出の入口（PDF/Web/外部リンク）";
        readonly example: "「保育園入園申込」「住民票の写しの交付申請」";
    };
    readonly step_by_step: {
        readonly description: "段階的手順ガイド";
        readonly purpose: "ウィザード型の手順説明";
        readonly example: "「転入届の出し方」";
    };
    readonly contact: {
        readonly description: "問い合わせ窓口ページ";
        readonly purpose: "問い合わせ・相談窓口情報";
        readonly example: "「保育課へのお問い合わせ」";
    };
    readonly news: {
        readonly description: "お知らせ・告知";
        readonly purpose: "お知らせ・告知記事";
        readonly example: "「保育園入園申込受付開始」";
    };
    readonly directory: {
        readonly description: "施設リスト・一覧ページ";
        readonly purpose: "施設・事業者リスト";
        readonly example: "「市内保育園一覧」";
    };
    readonly other: {
        readonly description: "その他";
        readonly purpose: "上記に分類できないページ";
        readonly example: "「プライバシーポリシー」";
    };
};
export declare const SERVICE_CATEGORY_GUIDE: {
    readonly welfare: {
        readonly description: "福祉・介護・障害者支援";
    };
    readonly health: {
        readonly description: "健康・医療・保健";
    };
    readonly children: {
        readonly description: "子育て・教育・学校";
    };
    readonly housing: {
        readonly description: "住まい・引越し・届出";
    };
    readonly environment: {
        readonly description: "環境・ごみ・リサイクル";
    };
    readonly business: {
        readonly description: "産業・商工・観光";
    };
    readonly community: {
        readonly description: "地域・コミュニティ・文化";
    };
    readonly safety: {
        readonly description: "防災・安全・消防";
    };
    readonly government: {
        readonly description: "行政・議会・選挙";
    };
    readonly other: {
        readonly description: "その他";
    };
};
export declare function validateArtifact(data: unknown): Artifact;
export declare function safeValidateArtifact(data: unknown): {
    success: boolean;
    data?: Artifact;
    error?: z.ZodError;
};
export declare function getBlocksByType<T extends Block["type"]>(artifact: Artifact, type: T): Extract<Block, {
    type: T;
}>[];
export declare function getFirstBlockByType<T extends Block["type"]>(artifact: Artifact, type: T): Extract<Block, {
    type: T;
}> | undefined;
export declare const Category: z.ZodEnum<{
    other: "other";
    welfare: "welfare";
    health: "health";
    children: "children";
    housing: "housing";
    environment: "environment";
    business: "business";
    community: "community";
    safety: "safety";
    government: "government";
}>;
export type Category = ServiceCategory;
export {};
//# sourceMappingURL=innoma-artifact-schema.v2.d.ts.map