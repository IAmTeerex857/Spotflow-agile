"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { Tooltip } from "radix-ui";
import { usePortalContainer } from "@/components/Surface";
import { ICON, spring } from "./Button";

type IconButtonProps = {
  /** Icon element, e.g. `<Lock />`. Sized to 16px automatically. */
  icon: React.ReactNode;
  /** Optional morph target shown on hover/focus or while `swapped`. */
  hoverIcon?: React.ReactNode;
  swapped?: boolean;
  label: string;
  active?: boolean;
  size?: number;
} & Omit<HTMLMotionProps<"button">, "children">;

/** Square icon-only button with a tooltip and the same spring as `Button`. */
export function IconButton({
  icon,
  hoverIcon,
  swapped,
  label,
  active,
  size = 34,
  className = "",
  disabled,
  ...rest
}: IconButtonProps) {
  const container = usePortalContainer();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <motion.button
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          initial="rest"
          animate={swapped ? "hover" : "rest"}
          whileHover={disabled ? undefined : "hover"}
          whileFocus={disabled ? undefined : "hover"}
          whileTap={disabled ? undefined : { scale: 0.92 }}
          variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
          transition={spring}
          style={{ width: size, height: size }}
          className={`relative inline-flex shrink-0 items-center justify-center rounded-[10px] border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            active
              ? "border-accent-border bg-accent-soft text-accent"
              : "border-border bg-surface text-text-2 hover:border-border-strong hover:text-text"
          } ${className}`}
          {...rest}
        >
          {hoverIcon ? (
            <span className="relative flex h-4 w-4">
              <motion.span
                variants={{ rest: { scale: 1, opacity: 1 }, hover: { scale: 0.5, opacity: 0 } }}
                transition={spring}
                className={`absolute inset-0 ${ICON}`}
              >
                {icon}
              </motion.span>
              <motion.span
                variants={{ rest: { scale: 0.5, opacity: 0 }, hover: { scale: 1, opacity: 1 } }}
                transition={spring}
                className={`absolute inset-0 ${ICON}`}
              >
                {hoverIcon}
              </motion.span>
            </span>
          ) : (
            <span className={ICON}>{icon}</span>
          )}
        </motion.button>
      </Tooltip.Trigger>
      <Tooltip.Portal container={container}>
        <Tooltip.Content
          sideOffset={6}
          className="z-[80] rounded-md bg-text px-2 py-1 text-xs font-medium text-bg shadow-md-t"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
