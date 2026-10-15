"use client";

import { motion } from "motion/react";

/** The room's deck. Picking your current card again takes the vote back. */
export function DeckCards({
  cards,
  selected,
  disabled,
  onPick,
}: {
  cards: string[];
  selected: string | null;
  disabled: boolean;
  onPick: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-3.5" role="radiogroup" aria-label="Your estimate">
      {cards.map((value, i) => {
        const on = selected === value;
        return (
          <motion.button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onPick(on ? null : value)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: on ? -12 : 0, rotate: on ? -2 : 0 }}
            whileHover={disabled ? undefined : { y: on ? -14 : -5 }}
            whileTap={disabled ? undefined : { scale: 0.94 }}
            transition={{ type: "spring", stiffness: 520, damping: 28, delay: i * 0.015 }}
            className={`relative h-[104px] w-[72px] rounded-[12px] border-[1.5px] p-1.5 shadow-sm-t transition-colors disabled:cursor-not-allowed sm:h-[112px] sm:w-[80px] ${
              on ? "border-accent bg-accent-soft shadow-md-t" : "border-border-strong bg-surface-2 enabled:hover:border-text-3"
            } ${disabled && !on ? "opacity-55" : ""}`}
          >
            <span className={`mono absolute left-2.5 top-2 text-xs font-semibold ${on ? "text-accent" : "text-text"}`}>{value}</span>
            <span
              className={`mono absolute bottom-2 right-2.5 rotate-180 text-xs font-semibold ${on ? "text-accent" : "text-text"}`}
            >
              {value}
            </span>
            <span
              className={`flex h-full w-full items-center justify-center rounded-lg border-[1.5px] ${on ? "border-accent" : "border-border"}`}
            >
              <span className={`mono text-[24px] font-semibold ${on ? "text-accent" : "text-text"}`}>{value}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
