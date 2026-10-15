import type { Transition } from "motion/react";

/**
 * Builds a looping keyframe transition from absolute times (in seconds) on a
 * shared clock of `duration` seconds, so every element of a scene can be
 * choreographed against one timeline.
 */
export function timeline(duration: number) {
  return (times: number[], ease: Transition["ease"] = "easeInOut"): Transition => ({
    duration,
    times: times.map((t) => t / duration),
    repeat: Infinity,
    ease,
  });
}
