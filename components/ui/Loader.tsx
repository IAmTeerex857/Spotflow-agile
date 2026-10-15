"use client";

import { ImageLoader, InlineLoader, TextLoader, type TextLoaderVariant } from "generative-loaders";
import { useEffect, useState } from "react";

/** Small activity indicator that inherits the surrounding text colour. */
export function Spinner({ size = 14, label }: { size?: number; label?: string }) {
  return <InlineLoader variant="orbit" size={size} color="currentColor" label={label} />;
}

/** Full-area placeholder while a board or room loads. */
export function PanelLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-text-3">
      <ImageLoader variant="tiles" size={88} radius={18} color="var(--accent)" label={label} />
      <TextLoader text={label} variant="cascade" color="var(--text-2)" className="text-sm" />
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
