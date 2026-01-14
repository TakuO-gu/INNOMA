import React from "react";

type Severity = "info" | "warning" | "danger";

export function DadsNotificationBanner({
  severity,
  title,
  children,
}: {
  severity: Severity;
  title?: string;
  children: React.ReactNode;
}) {
  // NOTE: DADS公式スニペットに合わせて class / role / aria を後で完全一致にする
  return (
    <section
      className={`dads-notification-banner dads-notification-banner--${severity}`.trim()}
      role={severity === "danger" ? "alert" : "status"}
    >
      {title ? <div className="dads-notification-banner__title">{title}</div> : null}
      <div className="dads-notification-banner__body">{children}</div>
    </section>
  );
}
