"use client";

import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";

export type StepNavigationSize = "normal" | "small";
export type StepNavigationOrientation = "horizontal" | "vertical";
export type StepState = "default" | "reached" | "completed" | "error" | "skipped" | "editing";

// Context for passing size and orientation to children
const StepNavigationContext = createContext<{
  size: StepNavigationSize;
  orientation: StepNavigationOrientation;
  numberSize: string;
  numberMargin: string;
  descriptionMargin: string;
}>({
  size: "normal",
  orientation: "vertical",
  numberSize: "2.75rem",
  numberMargin: "0.25rem",
  descriptionMargin: "0.5rem",
});

// CSS Variables for sizes
const sizeConfig = {
  normal: {
    numberSize: "2.75rem", // 44px
    numberMargin: "0.25rem", // 4px
    outlineWidth: "0.125rem", // 2px
    titleMargin: "1.5rem", // 24px
    descriptionMargin: "0.5rem", // 8px
    numberFontSize: "text-oln-20B-150",
    titleFontSize: "text-oln-18B-160",
    borderWidth: "border-2",
  },
  small: {
    numberSize: "2rem", // 32px
    numberMargin: "0.1875rem", // 3px
    outlineWidth: "0.0625rem", // 1px
    titleMargin: "1rem", // 16px
    descriptionMargin: "0.25rem", // 4px
    numberFontSize: "text-oln-16B-170",
    titleFontSize: "text-oln-16B-170",
    borderWidth: "border",
  },
};

// Root component
export type StepNavigationProps = ComponentProps<"nav"> & {
  size?: StepNavigationSize;
  orientation?: StepNavigationOrientation;
};

export const StepNavigation = (props: StepNavigationProps) => {
  const { children, className, size = "normal", orientation = "vertical", ...rest } = props;
  const config = sizeConfig[size];

  return (
    <StepNavigationContext.Provider
      value={{
        size,
        orientation,
        numberSize: config.numberSize,
        numberMargin: config.numberMargin,
        descriptionMargin: config.descriptionMargin,
      }}
    >
      <nav
        className={`
          text-solid-gray-800 font-normal text-std-16N-170
          [overflow-wrap:anywhere]
          ${orientation === "horizontal" ? "overflow-x-auto py-1.5" : ""}
          ${className ?? ""}
        `}
        {...rest}
      >
        <ul className={`m-0 p-0 list-none ${orientation === "horizontal" ? "flex" : "flex flex-col"}`}>
          {children}
        </ul>
      </nav>
    </StepNavigationContext.Provider>
  );
};

// Step item component
export type StepNavigationStepProps = ComponentProps<"li"> & {
  state?: StepState;
  isFirst?: boolean;
  isLast?: boolean;
  isCurrent?: boolean;
};

export const StepNavigationStep = (props: StepNavigationStepProps) => {
  const {
    children,
    className,
    state = "default",
    isFirst,
    isLast,
    isCurrent,
    ...rest
  } = props;
  const { orientation, numberSize, numberMargin } = useContext(StepNavigationContext);
  const isVertical = orientation === "vertical";

  // Calculate connector position
  const connectorLeft = `calc(${numberSize} / 2 + ${numberMargin})`;
  const connectorTop = `calc(${numberSize} / 2 + ${numberMargin})`;

  return (
    <li
      className={`
        relative box-border
        ${isVertical ? "flex-1 pb-6 last:pb-0" : "w-80 min-w-40 px-4"}
        ${className ?? ""}
      `}
      data-state={state}
      aria-current={isCurrent ? "step" : undefined}
      {...rest}
    >
      {/* Connector line before */}
      {!isFirst && (
        <span
          className="absolute -z-10 border-solid-gray-420"
          style={
            isVertical
              ? { left: connectorLeft, top: 0, height: "2rem", borderRightWidth: "1px" }
              : { top: connectorTop, right: "50%", width: "50%", borderBottomWidth: "1px" }
          }
          aria-hidden="true"
        />
      )}
      {/* Connector line after */}
      {!isLast && (
        <span
          className="absolute -z-10 border-solid-gray-420"
          style={
            isVertical
              ? { left: connectorLeft, bottom: 0, height: "calc(100% - 2rem)", borderRightWidth: "1px" }
              : { top: connectorTop, left: "50%", width: "50%", borderBottomWidth: "1px" }
          }
          aria-hidden="true"
        />
      )}
      {children}
    </li>
  );
};

// Header component (can be div, a, or button)
export type StepNavigationHeaderProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "a" | "button";
  href?: string;
  onClick?: () => void;
};

export const StepNavigationHeader = (props: StepNavigationHeaderProps) => {
  const { children, className, as = "div", href, onClick, ...rest } = props;
  const { orientation } = useContext(StepNavigationContext);
  const isVertical = orientation === "vertical";

  const baseClass = `
    block border-0 bg-transparent p-0 text-inherit font-inherit
    [text-wrap:pretty]
    ${isVertical ? "relative flex items-baseline gap-4 text-left" : "w-full text-center"}
  `;

  const interactiveClass = `
    underline underline-offset-[0.1875rem] decoration-[0.0625rem]
    hover:decoration-[0.1875rem] hover:cursor-pointer
    focus-visible:outline-4 focus-visible:outline-black focus-visible:outline-offset-[0.125rem]
    focus-visible:ring-[0.125rem] focus-visible:ring-yellow-300
  `;

  if (as === "a" && href) {
    return (
      <a className={`${baseClass} ${interactiveClass} ${className ?? ""}`} href={href} {...rest}>
        {children}
      </a>
    );
  }

  if (as === "button") {
    return (
      <button type="button" className={`${baseClass} ${interactiveClass} ${className ?? ""}`} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClass} ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
};

// Number component
export type StepNavigationNumberProps = ComponentProps<"span"> & {
  number: number | string;
};

export const StepNavigationNumber = (props: StepNavigationNumberProps) => {
  const { number, className, children, ...rest } = props;
  const { size, orientation, numberSize, numberMargin } = useContext(StepNavigationContext);
  const config = sizeConfig[size];
  const isVertical = orientation === "vertical";

  // Get state from parent li via CSS
  const stateStyles = `
    [[data-state=reached]_&]:bg-solid-gray-800 [[data-state=reached]_&]:text-white [[data-state=reached]_&]:border-solid-gray-800
    [[data-state=completed]_&]:bg-solid-gray-50
    [[data-state=error]_&]:text-error-1
    [[data-state=skipped]_&]:border [[data-state=skipped]_&]:border-dashed
    [[aria-current=step]_&]:outline [[aria-current=step]_&]:outline-2 [[aria-current=step]_&]:outline-solid-gray-800
    [[aria-current=step]_&]:outline-offset-[0.125rem] [[aria-current=step]_&]:shadow-[0_0_0_0.125rem_white]
  `;

  return (
    <span
      className={`
        relative grid place-content-center box-border
        ${config.borderWidth} border-current rounded-full
        bg-white font-bold ${config.numberFontSize}
        ${isVertical ? "shrink-0" : "mx-auto"}
        ${stateStyles}
        ${className ?? ""}
      `}
      style={{
        width: numberSize,
        height: numberSize,
        minWidth: numberSize,
        margin: numberMargin,
      }}
      {...rest}
    >
      {children ?? number}
    </span>
  );
};

// Title component
export type StepNavigationTitleProps = ComponentProps<"span">;

export const StepNavigationTitle = (props: StepNavigationTitleProps) => {
  const { children, className, ...rest } = props;
  const { size, orientation, numberSize, numberMargin } = useContext(StepNavigationContext);
  const config = sizeConfig[size];
  const isVertical = orientation === "vertical";

  // Vertical: align title with number center
  const verticalPadding = isVertical
    ? `calc(${numberSize} / 2 + ${numberMargin} - 0.875rem)`
    : undefined;

  return (
    <span
      className={`
        block font-bold ${config.titleFontSize}
        ${!isVertical ? `mt-[${config.titleMargin}]` : ""}
        ${className ?? ""}
      `}
      style={isVertical ? { paddingTop: verticalPadding, paddingBottom: verticalPadding } : undefined}
      {...rest}
    >
      {children}
    </span>
  );
};

// Description component
export type StepNavigationDescriptionProps = ComponentProps<"div">;

export const StepNavigationDescription = (props: StepNavigationDescriptionProps) => {
  const { children, className, ...rest } = props;
  const { orientation, numberSize, numberMargin, descriptionMargin } = useContext(StepNavigationContext);
  const isVertical = orientation === "vertical";

  // Vertical: left padding to align with title
  const paddingLeft = isVertical
    ? `calc(${numberSize} + ${numberMargin} * 2 + 1rem)`
    : undefined;

  return (
    <div
      className={`
        ${!isVertical ? "text-center" : ""}
        ${className ?? ""}
      `}
      style={{
        marginTop: descriptionMargin,
        paddingLeft,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

// State icon component (for completed, error, editing states)
type StateIconType = "completed" | "error" | "editing";

export type StepNavigationStateIconProps = {
  type: StateIconType;
  className?: string;
};

export const StepNavigationStateIcon = (props: StepNavigationStateIconProps) => {
  const { type, className } = props;
  const { size } = useContext(StepNavigationContext);
  const iconSize = size === "small" ? "size-5" : "size-6";

  const icons: Record<StateIconType, ReactNode> = {
    completed: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`block ${iconSize}`}>
        <circle cx="12" cy="12" r="12" fill="currentColor" />
        <path d="M10.5 15.5L7 12L8.5 10.5L10.5 12.5L15.5 7.5L17 9L10.5 15.5Z" fill="white" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`block ${iconSize}`}>
        <path d="M12 2L22 22H2L12 2Z" fill="currentColor" />
        <path d="M11 10H13V14H11V10Z" fill="white" />
        <circle cx="12" cy="17" r="1" fill="white" />
      </svg>
    ),
    editing: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`block ${iconSize}`}>
        <path
          d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
          fill="currentColor"
        />
      </svg>
    ),
  };

  const topOffset = size === "small" ? "-0.5625rem" : "-0.625rem";
  const leftOffset = size === "small" ? "calc(50% + 0.25rem)" : "calc(50% + 0.375rem)";

  return (
    <span
      className={`absolute rounded-full bg-white ${className ?? ""}`}
      style={{ top: topOffset, left: leftOffset }}
    >
      {icons[type]}
    </span>
  );
};

// State label component
export type StepNavigationStateLabelProps = ComponentProps<"span">;

export const StepNavigationStateLabel = (props: StepNavigationStateLabelProps) => {
  const { children, className, ...rest } = props;

  return (
    <span
      className={`
        absolute m-auto w-16 h-[1.2em]
        bg-white font-normal text-std-14N-120 text-center
        ${className ?? ""}
      `}
      style={{ inset: "calc(100% + 0.5rem) -100% 0" }}
      {...rest}
    >
      {children}
    </span>
  );
};
