import React from "react";

export function DadsStepNavigation({
  ariaLabel = "手続きのステップ",
  steps,
  renderBody,
}: {
  ariaLabel?: string;
  steps: { title: string; id?: string }[];
  renderBody: (index: number) => React.ReactNode;
}) {
  // NOTE: DADS HTML版スニペットに合わせてDOM構造/クラスを完全一致させる
  return (
    <section className="dads-step-navigation" aria-label={ariaLabel}>
      <ol className="dads-step-navigation__list">
        {steps.map((s, i) => (
          <li key={i} className="dads-step-navigation__item" id={s.id}>
            <h3 className="dads-step-navigation__title">{s.title}</h3>
            <div className="dads-step-navigation__content">{renderBody(i)}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
