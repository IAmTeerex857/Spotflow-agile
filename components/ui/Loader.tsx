"use client";

import { InlineLoader, TextLoader, type TextLoaderVariant } from "generative-loaders";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PokerLoaderScene, RetroLoaderScene } from "@/components/iso/LoaderScenes";

/** Small activity indicator that inherits the surrounding text colour. */
export function Spinner({ size = 14, label }: { size?: number; label?: string }) {
  return <InlineLoader variant="orbit" size={size} color="currentColor" label={label} />;
}

/**
 * Full-area placeholder while a board or room loads: a small looping iso scene
 * in the tool's colours. It fades in after a beat so quick loads don't flash.
 */
export function PanelLoader({ label, tool }: { label: string; tool: "poker" | "retro" }) {
  return (
    <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-[200px] sm:w-[230px]">{tool === "poker" ? <PokerLoaderScene /> : <RetroLoaderScene />}</div>
        <p className="mt-3 text-sm font-medium text-text-2">{label}</p>
      </motion.div>
    </div>
  );
}

/**
 * Animated text reveal, used when hidden content is uncovered. The loader's
 * styling (monospace, per-letter spans) is only for the moment of the reveal,
 * so it hands over to the plain text once the animation has played.
 */
export function RevealText({
  text,
  variant = "decode",
  className,
  duration = 900,
}: {
  text: string;
  variant?: TextLoaderVariant;
  className?: string;
  duration?: number;
}) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (settled) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      <span aria-hidden>
        <TextLoader text={text} variant={variant} color="currentColor" />
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
