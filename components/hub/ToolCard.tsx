"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { spring } from "@/components/ui/Button";

type Accent = "poker" | "retro";

const ACCENT_TEXT = { poker: "text-poker", retro: "text-retro" } as const;

/** One cell of the hub's tools panel: an isometric illustration above the copy. */
export function ToolCard({
  href,
  accent,
  name,
  kicker,
  description,
  meta,
  cta,
  logo,
  art,
}: {
  href: string;
  accent: Accent;
  name: string;
  kicker: string;
  description: string;
  meta: React.ReactNode;
  cta: string;
  logo: React.ReactNode;
  art: React.ReactNode;
}) {
  const [lit, setLit] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setLit(true)}
      onMouseLeave={() => setLit(false)}
      onFocus={() => setLit(true)}
      onBlur={() => setLit(false)}
      className="group flex flex-col outline-none transition-colors hover:bg-bg-subtle focus-visible:bg-bg-subtle"
    >
      <motion.div animate={{ y: lit ? -6 : 0 }} transition={spring} className="h-[240px] px-6 pt-6 sm:h-[290px]">
        {art}
      </motion.div>
      <div className="flex flex-1 flex-col px-7 pb-8 pt-2 sm:px-9">
        <div className="mb-3 flex items-center gap-2.5">
          {logo}
          <div>
            <h3 className="text-[19px] font-semibold tracking-[-0.02em]">{name}</h3>
            <div className="mono text-[10.5px] tracking-[0.04em] text-text-3">{kicker}</div>
          </div>
        </div>
        <p className="mb-3 max-w-[46ch] text-[15px] leading-relaxed text-text-2">{description}</p>
        <p className="mb-6 text-xs text-text-3">{meta}</p>
        <span className={`mt-auto flex items-center gap-1.5 text-sm font-semibold ${ACCENT_TEXT[accent]}`}>
          {cta}
          <motion.span animate={{ x: lit ? 4 : 0 }} transition={spring} className="flex">
            <ArrowRight size={16} strokeWidth={2.2} />
          </motion.span>
        </span>
      </div>
    </Link>
  );
}
