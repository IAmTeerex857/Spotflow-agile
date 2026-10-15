"use client";

import { motion, useReducedMotion } from "motion/react";
import { project } from "@/components/iso/geometry";
import { IsoSlab, OnLeft, OnTop, type Shade } from "@/components/iso/primitives";
import { LANES } from "@/lib/retro/types";

/**
 * Retro hero: private notes ride a conveyor of glass cubes into the board,
 * and come out the far side revealed, grouped and voted on.
 */

const BLOCK = { x: 0, y: 0, w: 230, d: 210, h: 160 };
const DOOR = { x: 62, w: 104, h: 104 };
const LANE_X = DOOR.x + 12;
const CUBE = 80;
const SPACING = 104;
const TRAVEL = 4 * SPACING;
const SPEED = 1.15; // seconds per cube spacing

const GLASS: Shade = { top: "var(--r-glass-top)", left: "var(--r-glass-left)", right: "var(--r-glass-right)", line: "var(--r-line)", lineWidth: 1 };
const BLOCK_SHADE: Shade = { top: "var(--r-block-top)", left: "var(--r-block-left)", right: "var(--r-block-right)" };

/** Screen-space offset for a move of `dy` world units along the lane. */
const laneShift = (dy: number) => {
  const [x, y] = project([0, dy, 0]);
  return { x, y };
};

export function RetroScene() {
  const play = !useReducedMotion();
  const inbound = laneShift(-TRAVEL);
  const outbound = laneShift(-TRAVEL);

  return (
    <svg viewBox="-420 -330 860 640" className="retro-scene h-auto w-full" aria-hidden>
      <defs>
        <filter id="retro-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <linearGradient id="retro-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--r-door-a)" />
          <stop offset="1" stopColor="var(--r-door-b)" />
        </linearGradient>
      </defs>

      <FloorGrid />

      {/* outbound: revealed notes leaving the back of the board */}
      {[0, 1, 2, 3].map((i) => (
        <motion.g
          key={`out-${i}`}
          initial={play ? { opacity: 0 } : { opacity: 1, x: outbound.x * (i / 4), y: outbound.y * (i / 4) }}
          animate={
            play
              ? { x: [0, outbound.x], y: [0, outbound.y], opacity: [0, 1, 1, 0] }
              : undefined
          }
          transition={{
            duration: SPEED * 4,
            repeat: Infinity,
            ease: "linear",
            delay: -i * SPEED,
            opacity: { duration: SPEED * 4, repeat: Infinity, ease: "linear", times: [0, 0.12, 0.8, 1], delay: -i * SPEED },
          }}
        >
          <Cube y={-CUBE - 20}>
            <RevealedNote variant={i} />
          </Cube>
        </motion.g>
      ))}

      {/* the board */}
      <IsoSlab x={BLOCK.x} y={BLOCK.y} w={BLOCK.w} d={BLOCK.d} h={BLOCK.h} r={4} shade={BLOCK_SHADE}>
        <BoardTop />
      </IsoSlab>
      <OnLeft x={DOOR.x} y={BLOCK.d} z={DOOR.h}>
        <rect width={DOOR.w} height={DOOR.h} fill="url(#retro-door)" />
        <path d={`M0 0 L${DOOR.w} 0 L${DOOR.w} 14 L0 6 Z`} fill="var(--r-door-b)" opacity={0.55} />
      </OnLeft>

      {/* inbound: private notes riding into the board */}
      {[0, 1, 2, 3].map((i) => (
        <motion.g
          key={`in-${i}`}
          initial={play ? { opacity: 0 } : { opacity: 1, x: inbound.x * (i / 4), y: inbound.y * (i / 4) }}
          animate={play ? { x: [0, inbound.x], y: [0, inbound.y], opacity: [0, 1, 1, 0] } : undefined}
          transition={{
            duration: SPEED * 4,
            repeat: Infinity,
            ease: "linear",
            delay: -i * SPEED,
            opacity: { duration: SPEED * 4, repeat: Infinity, ease: "linear", times: [0, 0.15, 0.84, 0.97], delay: -i * SPEED },
          }}
        >
          <Cube y={BLOCK.d + 22 + TRAVEL - CUBE}>
            <HiddenNote />
          </Cube>
        </motion.g>
      ))}
    </svg>
  );
}

function Cube({ y, children }: { y: number; children: React.ReactNode }) {
  return (
    <g>
      <OnTop x={LANE_X} y={y} z={0}>
        <rect width={CUBE} height={CUBE} rx={10} fill="var(--r-shadow)" transform="translate(10 8)" />
      </OnTop>
      <IsoSlab x={LANE_X} y={y} z={0} w={CUBE} d={CUBE} h={CUBE} r={8} shade={GLASS} />
      <OnLeft x={LANE_X + 14} y={y + CUBE / 2} z={CUBE - 12}>
        {children}
      </OnLeft>
    </g>
  );
}

function HiddenNote() {
  return (
    <g filter="url(#retro-blur)">
      <rect width={52} height={52} rx={4} fill="var(--r-hidden)" />
      <rect x={9} y={13} width={32} height={5} rx={2.5} fill="var(--r-hidden-ink)" />
      <rect x={9} y={24} width={24} height={5} rx={2.5} fill="var(--r-hidden-ink)" />
      <rect x={9} y={35} width={28} height={5} rx={2.5} fill="var(--r-hidden-ink)" />
    </g>
  );
}

const REVEALED = [
  { lines: [34, 22, 28], votes: 4 },
  { lines: [28, 34], votes: 2 },
  { lines: [30, 20, 26], votes: 6 },
  { lines: [26, 32], votes: 1 },
];

function RevealedNote({ variant }: { variant: number }) {
  const n = REVEALED[variant];
  return (
    <g>
      <rect width={52} height={52} rx={4} fill="var(--r-note)" stroke="var(--r-ink)" strokeOpacity={0.35} />
      {n.lines.map((w, j) => (
        <rect key={j} x={8} y={10 + j * 9} width={w} height={4.5} rx={2.25} fill="var(--r-ink)" opacity={0.75} />
      ))}
      <rect x={28} y={38} width={20} height={10} rx={5} fill="var(--r-ink)" />
      <text x={38} y={46} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--r-note)" style={{ fontFamily: "var(--font-ibm-plex)" }}>
        +{n.votes}
      </text>
    </g>
  );
}

/**
 * The board printed on top of the block: the app's four lanes, each named.
 * Lanes run along the block's long edge so the names are large enough to read.
 */
function BoardTop() {
  const pad = 12;
  const gap = 6;
  const laneD = (BLOCK.d - pad * 2 - gap * (LANES.length - 1)) / LANES.length;
  const laneW = BLOCK.w - pad * 2;
  return (
    <g>
      {LANES.map((lane, i) => {
        const action = lane.key === "todo";
        return (
          <g key={lane.key} transform={`translate(${pad} ${pad + i * (laneD + gap)})`}>
            <rect width={laneW} height={laneD} rx={6} fill="var(--r-note)" opacity={action ? 1 : 0.72} />
            <circle cx={12} cy={laneD / 2} r={3.5} fill="var(--r-ink)" opacity={action ? 1 : 0.55} />
            <text
              x={22}
              y={laneD / 2 + 6}
              fontSize={17}
              fontWeight={800}
              letterSpacing={-0.3}
              fill="var(--r-ink)"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {lane.label}
            </text>
            {[0, 1].slice(0, lane.label.length > 10 ? 1 : 2).map((n) => (
              <rect
                key={n}
                x={laneW - 8 - (n + 1) * 30 - n * 4}
                y={8}
                width={30}
                height={laneD - 16}
                rx={3}
                fill="var(--r-ink)"
                opacity={0.16}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

function FloorGrid() {
  const cells = [];
  for (let gx = -4; gx <= 4; gx++) {
    for (let gy = -5; gy <= 6; gy++) {
      cells.push(
        <OnTop key={`${gx}:${gy}`} x={gx * 96 - 20} y={gy * 96 - 20} z={0}>
          <rect width={86} height={86} rx={12} fill="none" stroke="var(--r-grid)" strokeWidth={1} />
        </OnTop>,
      );
    }
  }
  return <g>{cells}</g>;
}
