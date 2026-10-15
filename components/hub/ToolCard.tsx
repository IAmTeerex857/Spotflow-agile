"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { BorderBeam } from "border-beam";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/components/theme/theme";
import { spring } from "@/components/ui/Button";

type Accent = "poker" | "retro";

const ACCENT = {
  poker: { text: "text-poker", soft: "bg-poker-soft border-poker-border", beam: "mono" },
  retro: { text: "text-retro", soft: "bg-retro-soft border-retro-border", beam: "sunset" },
} as const;

/** Hub tool card. A border beam wakes up while the card is hovered or focused. */
export function ToolCard({
  href,
  accent,
  name,
  kicker,
  description,
  meta,
  cta,
  logo,
  preview,
}: {
  href: string;
  accent: Accent;
  name: string;
  kicker: string;
  description: string;
  meta: React.ReactNode;
  cta: string;
  logo: React.ReactNode;
  preview: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [lit, setLit] = useState(false);
  const a = ACCENT[accent];

  return (
    <BorderBeam
      size="md"
      colorVariant={a.beam}
      theme={theme}
      active={lit}
      strength={0.75}
      className="rounded-[22px]"
    >
      <motion.div
        onHoverStart={() => setLit(true)}
        onHoverEnd={() => setLit(false)}
        onFocus={() => setLit(true)}
        onBlur={() => setLit(false)}
        whileHover={{ y: -3 }}
        transition={spring}
        className="h-full overflow-hidden rounded-[22px] border border-border bg-surface shadow-sm-t"
      >
        <Link href={href} className="flex h-full flex-col outline-none">
          {preview}
          <div className="flex flex-1 flex-col px-7 pb-7 pt-6">
            <div className="mb-3 flex items-center gap-2.5">
              {logo}
              <div>
                <div className="text-[17px] font-semibold tracking-[-0.01em]">{name}</div>
                <div className="mono text-[10.5px] tracking-[0.04em] text-text-3">{kicker}</div>
              </div>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-text-2">{description}</p>
            <div className="mb-5 mt-auto text-xs text-text-3">{meta}</div>
            <div className={`flex items-center justify-between rounded-[12px] border px-4 py-3 ${a.soft} ${a.text}`}>
              <span className="text-sm font-semibold">{cta}</span>
              <motion.span animate={{ x: lit ? 4 : 0 }} transition={spring} className="flex">
                <ArrowRight size={17} strokeWidth={2.2} />
              </motion.span>
            </div>
          </div>
        </Link>
      </motion.div>
    </BorderBeam>
  );
}
