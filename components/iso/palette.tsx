import { OnTop, type Shade } from "./primitives";

/*
 * Shades for illustrations drawn inside a `.hub-scene` SVG (see globals.css):
 * neutral keys, with Poker green or Retro orange as the one accent.
 */

export const KEY: Shade = { top: "var(--k-top)", left: "var(--k-left)", right: "var(--k-right)", line: "var(--k-line)", lineWidth: 1.2 };
export const GREEN: Shade = { top: "var(--g-top)", left: "var(--g-left)", right: "var(--g-right)", line: "var(--k-line)", lineWidth: 1.2 };
export const ORANGE: Shade = { top: "var(--o-top)", left: "var(--o-left)", right: "var(--o-right)", line: "var(--k-line)", lineWidth: 1.2 };

export const MONO = { fontFamily: "var(--font-geist-mono)" };

/** Soft floor shadow under a footprint. */
export function Shadow({ x, y, w, d, z = 0 }: { x: number; y: number; w: number; d: number; z?: number }) {
  return (
    <OnTop x={x + 8} y={y + 8} z={z}>
      <rect width={w} height={d} rx={14} fill="var(--k-shadow)" />
    </OnTop>
  );
}
