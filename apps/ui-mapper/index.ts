import React from "react";

export type MunicipalStructuredData = {
  metadata: {
    sourceUrl: string;
    extractedAt: string;
    municipality: string;
    prefecture?: string;
    confidence: number;
    llmModel: string;
    processingTimeMs?: number;
  };
  news: Array<{
    title: string;
    date: string;
    category: string;
    importance: "high" | "medium" | "low";
    summary?: string;
    content: string;
    url: string;
    tags?: string[];
  }>;
  events: Array<{
    title: string;
    startDate: string;
    endDate?: string;
    location?: string;
    description: string;
    applicationMethod?: string;
    applicationDeadline?: string;
    capacity?: string;
    fee?: string;
    contact?: string;
    url: string;
  }>;
  procedures: Array<{
    title: string;
    category: string;
    description: string;
    requiredDocuments?: string[];
    targetAudience?: string;
    window?: string;
    hours?: string;
    onlineAvailable?: boolean;
    onlineUrl?: string;
    fee?: string;
    processingTime?: string;
    notes?: string;
    url: string;
  }>;
  facilities: Array<{
    name: string;
    category: string;
    address: string;
    phone?: string;
    fax?: string;
    email?: string;
    openingHours?: string;
    closedDays?: string;
    access?: string;
    parking?: string;
    barrierFree?: boolean;
    url?: string;
  }>;
  contacts: Array<{
    department: string;
    phone?: string;
    fax?: string;
    email?: string;
    address?: string;
    hours?: string;
    responsibilities?: string[];
  }>;
  emergencyInfo: Array<{
    type: "disaster" | "alert" | "warning" | "evacuation" | "other";
    title: string;
    severity: "critical" | "high" | "medium" | "low";
    publishedAt: string;
    content: string;
    affectedAreas?: string[];
    evacuationShelters?: string[];
    contact?: string;
    url?: string;
  }>;
};

export function MunicipalDataView({ data }: { data: MunicipalStructuredData }) {
  return React.createElement("div", { className: "municipal-data-view" },
    React.createElement("header", null,
      React.createElement("h1", null, data.metadata.municipality),
      data.metadata.prefecture && React.createElement("p", null, data.metadata.prefecture)
    ),

    data.news.length > 0 && React.createElement("section", null,
      React.createElement("h2", null, "お知らせ"),
      React.createElement("ul", null,
        data.news.map((item, i) =>
          React.createElement("li", { key: i },
            React.createElement("a", { href: item.url }, item.title),
            React.createElement("span", null, ` (${item.date})`)
          )
        )
      )
    ),

    data.events.length > 0 && React.createElement("section", null,
      React.createElement("h2", null, "イベント"),
      React.createElement("ul", null,
        data.events.map((item, i) =>
          React.createElement("li", { key: i },
            React.createElement("a", { href: item.url }, item.title),
            React.createElement("span", null, ` - ${item.startDate}`)
          )
        )
      )
    ),

    data.procedures.length > 0 && React.createElement("section", null,
      React.createElement("h2", null, "手続き・サービス"),
      React.createElement("ul", null,
        data.procedures.map((item, i) =>
          React.createElement("li", { key: i },
            React.createElement("a", { href: item.url }, item.title),
            React.createElement("p", null, item.description)
          )
        )
      )
    ),

    data.facilities.length > 0 && React.createElement("section", null,
      React.createElement("h2", null, "施設情報"),
      React.createElement("ul", null,
        data.facilities.map((item, i) =>
          React.createElement("li", { key: i },
            React.createElement("strong", null, item.name),
            React.createElement("p", null, item.address)
          )
        )
      )
    ),

    data.contacts.length > 0 && React.createElement("section", null,
      React.createElement("h2", null, "連絡先"),
      React.createElement("ul", null,
        data.contacts.map((item, i) =>
          React.createElement("li", { key: i },
            React.createElement("strong", null, item.department),
            item.phone && React.createElement("p", null, `TEL: ${item.phone}`)
          )
        )
      )
    )
  );
}
