"use client";

import { motion, useReducedMotion } from "motion/react";
import { IsoSlab, OnTop, type Shade } from "./primitives";
import { GREEN, KEY, MONO, Shadow } from "./palette";

/*
 * Small looping isometric scenes for the apps' loading screens, drawn with the
 * same kit and palette as the landing pages. With reduced motion they hold
 * still on a finished frame.
 */

const VIEWBOX = "-104 -34 252 186";
const TABLE = { w: 160, d: 100, h: 12 };
const CARD = { w: 28, d: 38 };
const LIFT = -14;
/** Face-up card: a white face with a green rim, so it stands out on the table. */
const FACE: Shade = { top: "var(--k-top)", left: "var(--g-left)", right: "var(--g-right)", line: "var(--k-line)", lineWidth: 1.2 };

/** Poker: each card lifts and turns face up in turn, then all flip back together. */
export function PokerLoaderScene() {
  const play = !useReducedMotion();
  const values = ["3", "5", "8"];
  const cycle = 3;

  return (
    <svg viewBox={VIEWBOX} className="hub-scene h-auto w-full" aria-hidden>
      <Shadow x={0} y={0} w={TABLE.w} d={TABLE.d} />
      <IsoSlab x={0} y={0} w={TABLE.w} d={TABLE.d} h={TABLE.h} r={14} shade={KEY} />
      {values.map((v, i) => {
        const x = 18 + i * 48;
        const y = 31;
        const at = 0.04 + i * 0.2;
        const loop = { duration: cycle, repeat: Infinity, ease: "easeInOut" } as const;
        return (
          <g key={v}>
            <OnTop x={x + 3} y={y + 3} z={TABLE.h}>
              <rect width={CARD.w} height={CARD.d} rx={4} fill="var(--k-shadow)" />
            </OnTop>
            <motion.g
              animate={play ? { y: [0, 0, LIFT, 0, 0] } : { y: 0 }}
              transition={play ? { ...loop, times: [0, at, at + 0.06, at + 0.14, 1] } : undefined}
            >
              <IsoSlab x={x} y={y} z={TABLE.h} w={CARD.w} d={CARD.d} h={3} r={4} shade={GREEN}>
                <rect x={4} y={4} width={CARD.w - 8} height={CARD.d - 8} rx={2} fill="none" stroke="var(--k-top)" strokeOpacity={0.7} />
              </IsoSlab>
              <motion.g
                animate={play ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: 1 }}
                transition={play ? { ...loop, times: [0, at + 0.04, at + 0.07, 0.84, 0.9, 1] } : undefined}
              >
                <IsoSlab x={x} y={y} z={TABLE.h} w={CARD.w} d={CARD.d} h={3} r={4} shade={FACE}>
                  <text x={CARD.w / 2} y={CARD.d / 2 + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--g-ink)" style={MONO}>
                    {v}
                  </text>
                </IsoSlab>
              </motion.g>
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}

const BOARD = { w: 160, d: 110, h: 12 };
const LANE_W = 40;
const NOTE: Shade = { top: "var(--o-note)", left: "var(--o-top)", right: "var(--o-left)", line: "var(--k-line)", lineWidth: 1.1 };
/** [lane, row] in the order the notes land, listed back to front for painting. */
const NOTES: { lane: number; row: number; order: number }[] = [
  { lane: 0, row: 0, order: 0 },
  { lane: 1, row: 0, order: 1 },
  { lane: 1, row: 1, order: 3 },
  { lane: 2, row: 0, order: 2 },
];

/** Retro: notes drop into the board's lanes, then clear for the next round. */
export function RetroLoaderScene() {
  const play = !useReducedMotion();
  const cycle = 3.6;

  return (
    <svg viewBox={VIEWBOX} className="hub-scene h-auto w-full" aria-hidden>
      <Shadow x={0} y={0} w={BOARD.w} d={BOARD.d} />
      <IsoSlab x={0} y={0} w={BOARD.w} d={BOARD.d} h={BOARD.h} r={14} shade={KEY}>
        {[0, 1, 2].map((l) => (
          <rect key={l} x={12 + l * (LANE_W + 8)} y={10} width={LANE_W} height={6} rx={3} fill="var(--o-left)" opacity={l === 2 ? 1 : 0.45} />
        ))}
      </IsoSlab>
      {NOTES.map(({ lane, row, order }) => {
        const at = 0.02 + order / 6;
        return (
          <motion.g
            key={`${lane}:${row}`}
            animate={play ? { y: [-22, -22, 0, 0, 0, 0], opacity: [0, 0, 1, 1, 0, 0] } : { y: 0, opacity: 1 }}
            transition={
              play
                ? { duration: cycle, repeat: Infinity, ease: "easeOut", times: [0, at, at + 0.08, 0.84, 0.94, 1] }
                : undefined
            }
          >
            <IsoSlab x={12 + lane * (LANE_W + 8)} y={22 + row * 36} z={BOARD.h} w={LANE_W} d={30} h={4} r={4} shade={NOTE}>
              <rect x={7} y={8} width={LANE_W - 16} height={4} rx={2} fill="var(--o-left)" opacity={0.75} />
              <rect x={7} y={16} width={LANE_W - 24} height={4} rx={2} fill="var(--o-left)" opacity={0.75} />
            </IsoSlab>
          </motion.g>
        );
      })}
    </svg>
  );
}
