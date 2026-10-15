"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { PHASES, type RetroPhase } from "@/lib/retro/types";

export function PhaseSteps({ phase }: { phase: RetroPhase }) {
  const current = PHASES.findIndex((p) => p.key === phase);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto" aria-label="Retro steps">
      {PHASES.map((p, i) => {
        const active = i === current;
        const past = i < current;
        return (
          <li key={p.key} className="flex shrink-0 items-center gap-1" aria-current={active ? "step" : undefined}>
            {i > 0 && <span className={`h-px w-5 sm:w-8 ${past || active ? "bg-accent" : "bg-border-strong"}`} />}
            <span
              className={`relative flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                active ? "text-accent-fg" : past ? "text-text-2" : "text-text-3"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="retro-phase"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  active ? "bg-accent-fg/20" : past ? "bg-accent-soft text-accent" : "border border-border-strong"
                }`}
              >
                {past ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span className="relative whitespace-nowrap">{p.name}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
