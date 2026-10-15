"use client";

import { Blobatar } from "@blobatar/react";

/**
 * Deterministic blob avatar: the same seed always draws the same blob.
 * Poker seeds it with the player's name; Retro uses anonymous random seeds.
 */
export function Avatar({
  seed,
  size = 34,
  animate = "hover",
  label,
  className = "",
}: {
  seed: string;
  size?: number;
  animate?: "hover" | "always" | false;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Blobatar
        name={seed}
        size={size}
        background="circle"
        animate={animate || undefined}
        title={label}
      />
    </span>
  );
}
