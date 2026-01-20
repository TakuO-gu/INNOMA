import React from "react";

export type StepState = "reached" | "completed" | "error" | "skipped";

export interface StepNavigationStep {
  title: string;
  id?: string;
  state?: StepState;
}

export interface DadsStepNavigationProps {
  ariaLabel?: string;
  steps: StepNavigationStep[];
  renderBody?: (index: number) => React.ReactNode;
  size?: "normal" | "small";
  orientation?: "vertical" | "horizontal";
}

export function DadsStepNavigation({
  ariaLabel = "手続きのステップ",
  steps,
  renderBody,
  size = "normal",
  orientation = "vertical",
}: DadsStepNavigationProps) {
  // NOTE: DADS公式仕様に合わせてDOM構造/クラスを完全一致させる
  return (
    <section
      className="dads-step-navigation"
      aria-label={ariaLabel}
      data-size={size}
      data-orientation={orientation}
    >
      <ul>
        {steps.map((s, i) => {
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;

          return (
            <li
              key={i}
              className="dads-step-navigation__step"
              id={s.id}
              data-state={s.state}
              {...(isFirst ? { "data-first": "" } : {})}
              {...(isLast ? { "data-last": "" } : {})}
            >
              <div className="dads-step-navigation__header">
                <span className="dads-step-navigation__number">{i + 1}</span>
                <span className="dads-step-navigation__title">{s.title}</span>
              </div>
              {renderBody && (
                <div className="dads-step-navigation__description">
                  {renderBody(i)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
