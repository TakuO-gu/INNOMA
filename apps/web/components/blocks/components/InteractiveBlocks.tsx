"use client";

import React from "react";
import {
  Link,
  StepNavigation,
  StepNavigationStep,
  StepNavigationHeader,
  StepNavigationNumber,
  StepNavigationTitle,
  StepNavigationDescription,
} from "@/components/dads";
import { useMunicipality, prefixInternalLink } from "../MunicipalityContext";
import { RichTextRenderer, renderTextWithSourceRefs } from "../RichTextRenderer";
import type { StepItem, DirectoryItem, StepItemState } from "../types";
import { budouxParse } from "@/components/BudouX";
import { hasAnyValidValue, CONTACT_REQUIRED_FIELDS, isValidValue } from "@/lib/artifact/variable-utils";

/**
 * 参照番号マーカー(⟦N⟧)を除去してプレーンテキストを取得
 */
function stripSourceRefs(text: string): string {
  return text.replace(/⟦\d+⟧/g, "");
}

export function ContactBlock({ props }: { props: Record<string, unknown> }) {
  const department = props.department as string | undefined;
  const phone = props.phone as string | undefined;
  const fax = props.fax as string | undefined;
  const email = props.email as string | undefined;
  const hours = props.hours as string | undefined;
  const address = props.address as string | undefined;
  const mapUrl = props.map_url as string | undefined;

  // 必須フィールド（department, phone, email）のいずれかに有効な値がない場合は非表示
  if (!hasAnyValidValue(props, CONTACT_REQUIRED_FIELDS)) {
    return null;
  }

  return (
    <div className="mt-16 contact-card bg-solid-gray-50 rounded-lg p-6 mb-6">
      {department && (
        <h3 className="text-std-17B-170 text-solid-gray-900 mb-4 budoux">{budouxParse(department)}</h3>
      )}
      <dl className="space-y-2 text-std-16N-170">
        {phone && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">電話</dt>
            <dd>
              <Link href={`tel:${stripSourceRefs(phone)}`}>
                {renderTextWithSourceRefs(phone, "contact-phone")}
              </Link>
            </dd>
          </div>
        )}
        {fax && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">FAX</dt>
            <dd className="text-solid-gray-800">
              {renderTextWithSourceRefs(fax, "contact-fax")}
            </dd>
          </div>
        )}
        {email && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">メール</dt>
            <dd>
              {email.startsWith("http://") || email.startsWith("https://") ? (
                <Link href={stripSourceRefs(email)} target="_blank" rel="noopener noreferrer">
                  問い合わせフォーム{renderTextWithSourceRefs(email.match(/⟦\d+⟧/)?.[0] || "", "contact-email-ref")}
                </Link>
              ) : (
                <Link href={`mailto:${stripSourceRefs(email)}`}>
                  {renderTextWithSourceRefs(email, "contact-email")}
                </Link>
              )}
            </dd>
          </div>
        )}
        {hours && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">受付時間</dt>
            <dd className="text-solid-gray-800">
              {renderTextWithSourceRefs(hours, "contact-hours")}
            </dd>
          </div>
        )}
        {address && (
          <div className="flex">
            <dt className="w-24 font-medium text-solid-gray-600">住所</dt>
            <dd>
              {mapUrl ? (
                <Link href={mapUrl} target="_blank" rel="noopener noreferrer">
                  {renderTextWithSourceRefs(address, "contact-address")}
                </Link>
              ) : (
                <span className="text-solid-gray-800">
                  {renderTextWithSourceRefs(address, "contact-address")}
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function ActionButtonBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const label = (props.label as string) || "申請する";
  const href = (props.href as string) || "#";
  const actionType = props.action_type as "web_form" | "pdf" | "external_link" | undefined;

  // hrefが未置換の変数の場合は非表示
  if (!isValidValue(href) || href === "#") {
    return null;
  }

  const isExternal = actionType === "external_link" || actionType === "pdf" ||
    href.startsWith("http://") || href.startsWith("https://");

  // 内部リンクで未完成ページの場合は表示しない
  if (!isExternal && !isPageCompleted(href)) {
    return null;
  }

  const resolvedHref = isExternal ? href : prefixInternalLink(href, municipalityId);

  return (
    <div className="mt-12 action-button mb-6">
      <a
        href={resolvedHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="inline-flex items-center px-6 py-3 bg-blue-1000 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors"
      >
        {label}
        {actionType === "pdf" && <span className="ml-2 text-sm">(PDF)</span>}
        {isExternal && (
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </a>
    </div>
  );
}

export function TaskButtonBlock({ props }: { props: Record<string, unknown> }) {
  const { municipalityId, isPageCompleted } = useMunicipality();
  const label = (props.label as string) || "タスクを実行";
  const href = (props.href as string) || "#";
  const isTopTask = props.isTopTask as boolean | undefined;

  // hrefが未置換の変数の場合は非表示
  if (!isValidValue(href) || href === "#") {
    return null;
  }

  // 外部リンク判定 (http/https で始まる、または変数展開後の外部URL)
  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  // 内部リンクで未完成ページの場合は表示しない
  if (!isExternal && !isPageCompleted(href)) {
    return null;
  }

  const resolvedHref = isExternal ? href : prefixInternalLink(href, municipalityId);

  // isTopTask の場合は目立つスタイル、そうでなければ控えめなスタイル
  const baseClasses = "inline-flex items-center gap-2 font-medium rounded-lg transition-colors";
  const topTaskClasses = "px-6 py-3 bg-blue-1000 text-white hover:bg-blue-900";
  const normalTaskClasses = "px-4 py-2 bg-solid-gray-100 text-blue-1000 hover:bg-solid-gray-200 border border-solid-gray-300";

  return (
    <div className={`task-button ${isTopTask ? "mt-12 mb-6" : "mt-12 mb-4"}`}>
      <a
        href={resolvedHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className={`${baseClasses} ${isTopTask ? topTaskClasses : normalTaskClasses}`}
      >
        {isTopTask && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {label}
        {isExternal && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </a>
    </div>
  );
}

export function StepNavigationBlock({ props }: { props: Record<string, unknown> }) {
  const steps = (props.steps as StepItem[]) || [];
  const currentStep = (props.currentStep as number) ?? -1;
  const orientation = (props.orientation as "horizontal" | "vertical") || "vertical";
  const size = (props.size as "normal" | "small") || "normal";

  // 状態を自動計算: currentStep以下は reached, それより上は default
  const getStepState = (index: number, explicitState?: StepItemState): StepItemState => {
    if (explicitState) return explicitState;
    if (currentStep < 0) return "default";
    if (index < currentStep) return "completed";
    if (index === currentStep) return "reached";
    return "default";
  };

  return (
    <div className="mt-12 mb-6">
      <StepNavigation orientation={orientation} size={size} aria-label="手続きの流れ">
        {steps.map((step, i) => {
          const state = getStepState(i, step.state);
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          const isCurrent = i === currentStep;

          return (
            <StepNavigationStep
              key={i}
              state={state}
              isFirst={isFirst}
              isLast={isLast}
              isCurrent={isCurrent}
            >
              <StepNavigationHeader>
                <StepNavigationNumber number={i + 1} />
                <StepNavigationTitle><span className="budoux">{budouxParse(step.title)}</span></StepNavigationTitle>
              </StepNavigationHeader>
              {step.body && step.body.length > 0 && (
                <StepNavigationDescription>
                  <RichTextRenderer content={step.body} />
                </StepNavigationDescription>
              )}
            </StepNavigationStep>
          );
        })}
      </StepNavigation>
    </div>
  );
}

export function DirectoryListBlock({ props }: { props: Record<string, unknown> }) {
  const items = (props.items as DirectoryItem[]) || [];

  return (
    <div className="mt-12 directory-list space-y-4 mb-6">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-solid-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-std-17B-170 text-solid-gray-900 mb-2 budoux">
            {item.url ? (
              <Link href={item.url} target="_blank" rel="noopener noreferrer">{budouxParse(item.name)}</Link>
            ) : (
              budouxParse(item.name)
            )}
          </h3>
          {item.description && (
            <p className="text-sm text-solid-gray-600 mb-2">{item.description}</p>
          )}
          <dl className="text-sm space-y-1">
            {item.address && (
              <div className="flex">
                <dt className="w-16 text-solid-gray-500">住所</dt>
                <dd className="text-solid-gray-700">{item.address}</dd>
              </div>
            )}
            {item.phone && (
              <div className="flex">
                <dt className="w-16 text-solid-gray-500">電話</dt>
                <dd><Link href={`tel:${item.phone}`}>{item.phone}</Link></dd>
              </div>
            )}
            {item.hours && (
              <div className="flex">
                <dt className="w-16 text-solid-gray-500">営業時間</dt>
                <dd className="text-solid-gray-700">{item.hours}</dd>
              </div>
            )}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function NewsMetaBlock({ props }: { props: Record<string, unknown> }) {
  const publishedAt = props.published_at as string | undefined;
  const updatedAt = props.updated_at as string | undefined;
  const category = props.category as string | undefined;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mt-6 news-meta flex flex-wrap gap-4 text-sm text-solid-gray-600 mb-6 pb-4 border-b border-solid-gray-300">
      {publishedAt && <span>公開日: {formatDate(publishedAt)}</span>}
      {updatedAt && <span>更新日: {formatDate(updatedAt)}</span>}
      {category && <span className="px-2 py-1 bg-solid-gray-100 rounded">{category}</span>}
    </div>
  );
}
