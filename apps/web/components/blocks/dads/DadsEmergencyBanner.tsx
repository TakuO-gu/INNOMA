import React from "react";
import type { EmergencyInfo } from "@/lib/artifact/types";

const severityStyles: Record<EmergencyInfo["severity"], string> = {
  critical: "dads-notification-banner--danger",
  high: "dads-notification-banner--warning",
  medium: "dads-notification-banner--info",
  low: "dads-notification-banner--info",
};

const typeLabels: Record<EmergencyInfo["type"], string> = {
  disaster: "災害情報",
  alert: "緊急速報",
  warning: "警報",
  evacuation: "避難情報",
  other: "緊急情報",
};

export function DadsEmergencyBanner({
  emergency,
}: {
  emergency: EmergencyInfo;
}) {
  const severityClass = severityStyles[emergency.severity];
  const typeLabel = typeLabels[emergency.type];
  const isCritical = emergency.severity === "critical" || emergency.severity === "high";

  return (
    <section
      className={`dads-notification-banner ${severityClass}`.trim()}
      role={isCritical ? "alert" : "status"}
      aria-live={isCritical ? "assertive" : "polite"}
    >
      <div className="dads-notification-banner__title">
        【{typeLabel}】{emergency.title}
      </div>
      <div className="dads-notification-banner__body">
        <p className="dads-notification-banner__date">
          発表: {emergency.publishedAt}
        </p>
        <div dangerouslySetInnerHTML={{ __html: emergency.content }} />

        {emergency.affectedAreas && emergency.affectedAreas.length > 0 && (
          <div className="dads-notification-banner__affected">
            <strong>対象地域:</strong> {emergency.affectedAreas.join("、")}
          </div>
        )}

        {emergency.evacuationShelters && emergency.evacuationShelters.length > 0 && (
          <div className="dads-notification-banner__shelters">
            <strong>避難所:</strong>
            <ul className="dads-list">
              {emergency.evacuationShelters.map((shelter, i) => (
                <li key={i} className="dads-list__item">
                  {shelter}
                </li>
              ))}
            </ul>
          </div>
        )}

        {emergency.contact && (
          <div className="dads-notification-banner__contact">
            <strong>問い合わせ:</strong> {emergency.contact}
          </div>
        )}

        {emergency.url && (
          <div className="dads-notification-banner__link">
            <a href={emergency.url} className="dads-link">
              詳細を確認する
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
