"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { cardNumber } from "@/lib/poker/decks";

const SEGMENT_COLORS = ["var(--accent)", "#8fb8ea", "#efc06f", "#c3a0e6", "#ee9f80", "#89d3bb", "#b9b2a4", "#e48fb4"];
const R = 78;
const C = 2 * Math.PI * R;

export type Distribution = { value: string; count: number }[];

/** Average of the numeric votes, or null when none are numeric (e.g. T-shirt sizes). */
function averageOf(results: Distribution): number | null {
  let sum = 0;
  let n = 0;
  for (const r of results) {
    const v = cardNumber(r.value);
    if (v !== null) {
      sum += v * r.count;
      n += r.count;
    }
  }
  return n ? Math.round((sum / n) * 10) / 10 : null;
}

/** Donut chart of the vote distribution with a legend. */
export function Results({ results }: { results: Distribution }) {
  const total = results.reduce((n, r) => n + r.count, 0);
  const average = averageOf(results);
  const agreed = results.length === 1 && total > 1;
  const segments = results.map((r, i) => {
    const start = results.slice(0, i).reduce((n, x) => n + (x.count / total) * C, 0);
    return { ...r, start, length: (r.count / total) * C, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] };
  });

  if (total === 0) {
    return <p className="py-14 text-center text-sm text-text-3">Nobody voted on this story.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-10 px-6 py-9 sm:gap-14">
      <div className="relative h-[200px] w-[200px]">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx={100} cy={100} r={R} fill="none" stroke="var(--border)" strokeWidth={26} />
          {segments.map((seg, i) => (
            <motion.circle
              key={seg.value}
              cx={100}
              cy={100}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={26}
              strokeDasharray={`${seg.length} ${C - seg.length}`}
              initial={{ strokeDashoffset: -seg.start + seg.length, opacity: 0 }}
              animate={{ strokeDashoffset: -seg.start, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 + i * 0.08 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.25 }}
            className="mono text-[38px] font-semibold leading-none tracking-[-0.02em]"
          >
            {average ?? results[0].value}
          </motion.div>
          <div className="mt-1.5 text-xs text-text-3">{average !== null ? "Average" : "Most picked"}</div>
          <div className="text-xs text-text-3">
            {total} {total === 1 ? "vote" : "votes"}
          </div>
        </div>
      </div>

      <div className="flex min-w-[180px] flex-col gap-3">
        {agreed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1 flex items-center gap-1.5 self-start rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-xs font-semibold text-accent"
          >
            <Sparkles size={13} /> Everyone agreed
          </motion.div>
        )}
        {segments.map((r, i) => (
          <motion.div
            key={r.value}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="flex items-center gap-3"
          >
            <span className="h-3 w-3 rounded" style={{ background: r.color }} />
            <span className="mono w-9 text-[17px] font-semibold">{r.value}</span>
            <span className="text-[13px] text-text-2">
              {Math.round((r.count / total) * 100)}% · {r.count} {r.count === 1 ? "vote" : "votes"}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
