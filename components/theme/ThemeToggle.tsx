"use client";

import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { spring } from "@/components/ui/Button";
import { useTheme } from "./theme";

export function ThemeToggle({ size = 34 }: { size?: number }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.92 }}
      transition={spring}
      style={{ width: size, height: size }}
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-surface text-text-2 transition-colors hover:border-border-strong hover:text-text"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ scale: 0.5, opacity: 0, rotate: -60 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 60 }}
          transition={spring}
          className="flex"
        >
          <Icon size={16} strokeWidth={2} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
