"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Spinner } from "./Loader";

/**
 * The suite's one button. Interactions follow amicro: a soft spring scale on
 * hover/press, and icons that either morph (icon -> hoverIcon) or slide
 * (leading icon out, arrow in). All hover motion is driven by variants on the
 * button itself, so children need no state of their own.
 */

export const spring = { type: "spring", stiffness: 600, damping: 25 } as const;

/** Normalises any icon element to 16px. */
export const ICON = "flex [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0";

const VARIANT_CLASS = {
  primary: "border-accent bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border-border-strong bg-surface text-text hover:border-text-3",
  soft: "border-accent-border bg-accent-soft text-accent",
  ghost: "border-transparent bg-transparent text-text-2 hover:bg-bg-subtle hover:text-text",
  danger: "border-danger bg-danger text-white hover:opacity-90",
  dangerSoft: "border-transparent bg-danger-soft text-danger",
} as const;

const SIZE_CLASS = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;
export type ButtonSize = keyof typeof SIZE_CLASS;

type OwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon element, e.g. `<Copy />`. Sized to 16px automatically. */
  icon?: React.ReactNode;
  /** Morph target: `icon` swaps to this on hover/focus (or when `swapped`). */
  hoverIcon?: React.ReactNode;
  /** Slide pattern: the leading icon slides out and an arrow slides in on hover. */
  arrow?: boolean;
  /** Forces the hover state, e.g. to show a check after copying. */
  swapped?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  href?: string;
};

export type ButtonProps = OwnProps & Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
};

const MotionLink = motion.create(Link);

const iconSwapOut: Variants = {
  rest: { scale: 1, opacity: 1 },
  hover: { scale: 0.5, opacity: 0 },
};
const iconSwapIn: Variants = {
  rest: { scale: 0.5, opacity: 0 },
  hover: { scale: 1, opacity: 1 },
};
const slideOut: Variants = {
  rest: { width: 16, opacity: 1, x: 0, marginRight: 10 },
  hover: { width: 0, opacity: 0, x: -10, marginRight: 0 },
};
const slideIn: Variants = {
  rest: { width: 0, opacity: 0, x: 10, marginLeft: 0 },
  hover: { width: 16, opacity: 1, x: 0, marginLeft: 10 },
};

function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return [
    "relative inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap",
    "rounded-btn border font-semibold tracking-tight transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? "w-full min-w-0" : "shrink-0",
    className,
  ].join(" ");
}

export function Button({
  variant,
  size,
  icon,
  hoverIcon,
  arrow,
  swapped,
  loading,
  fullWidth,
  href,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const inert = disabled || loading;
  const motionProps = {
    initial: "rest" as const,
    animate: swapped ? "hover" : "rest",
    whileHover: inert ? undefined : "hover",
    whileFocus: inert ? undefined : "hover",
    whileTap: inert ? undefined : { scale: 0.96 },
    variants: { rest: { scale: 1 }, hover: { scale: 1.02 } },
    transition: spring,
    className: buttonClass({ variant, size, fullWidth, className }),
  };

  const content = (
    <>
      {loading ? (
        <span className="mr-2.5 flex h-4 w-4 items-center justify-center">
          <Spinner />
        </span>
      ) : icon && hoverIcon ? (
        <span className={`relative flex h-4 w-4 shrink-0 ${children ? "mr-2.5" : ""}`}>
          <motion.span variants={iconSwapOut} transition={spring} className={`absolute inset-0 ${ICON}`}>
            {icon}
          </motion.span>
          <motion.span variants={iconSwapIn} transition={spring} className={`absolute inset-0 ${ICON}`}>
            {hoverIcon}
          </motion.span>
        </span>
      ) : icon && arrow ? (
        <motion.span variants={slideOut} transition={spring} className={`shrink-0 overflow-hidden ${ICON}`}>
          {icon}
        </motion.span>
      ) : icon ? (
        <span className={`shrink-0 ${ICON} ${children ? "mr-2.5" : ""}`}>{icon}</span>
      ) : null}
      {children}
      {arrow && (
        <motion.span variants={slideIn} transition={spring} className={`shrink-0 overflow-hidden ${ICON}`}>
          <ArrowRight />
        </motion.span>
      )}
    </>
  );

  if (href && !inert) {
    return (
      <MotionLink
        href={href}
        {...motionProps}
        aria-label={rest["aria-label"]}
        onClick={rest.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button type="button" disabled={inert} aria-busy={loading || undefined} {...motionProps} {...rest}>
      {content}
    </motion.button>
  );
}
