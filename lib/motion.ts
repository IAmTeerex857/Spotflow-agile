/**
 * Motion props for app content that rises into place on mount, matching the
 * landing pages' sections. Spread onto a `motion.*` element; stagger siblings
 * by passing increasing delays (seconds).
 */
export const rise = (delay = 0) =>
  ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 260, damping: 26, delay },
  }) as const;

/** Stagger delay for the i-th row of a list, capped so long lists don't drag. */
export const rowDelay = (i: number, start = 0.1) => start + Math.min(i, 12) * 0.035;

/** CSS easing with a slight overshoot, for spring-like hover transitions. */
export const SPRINGY = "ease-[cubic-bezier(0.34,1.56,0.64,1)]";
