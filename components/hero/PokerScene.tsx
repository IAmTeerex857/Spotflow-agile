"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { blobatarUri } from "blobatar/uri";
import { project, type P2, type P3 } from "@/components/iso/geometry";
import { IsoSlab, OnLeft, OnTop, type Shade } from "@/components/iso/primitives";
import { timeline } from "./loop";

/**
 * Poker hero, drawn as monochrome line art with a single green accent.
 * Players pick cards on the deck, each vote travels down a wire to the room,
 * lands face down, then every card flips at once and the result appears.
 */

const T = 9;
const at = timeline(T);

const LINE: Shade = { top: "var(--p-fill)", left: "var(--p-fill)", right: "var(--p-fill-2)", line: "var(--p-line)", lineWidth: 1.3 };
const HUB: Shade = { top: "var(--p-accent-soft)", left: "var(--p-fill)", right: "var(--p-fill-2)", line: "var(--p-line)", lineWidth: 1.3 };

const VOTES = [0.7, 1.5, 2.3, 3.1];
const PICKS = [3, 3, 4, 3]; // index into DECK
const DECK = ["1", "2", "3", "5", "8"];
const RESULT = ["5", "5", "8", "5"];
const FLIP = 4.1;
const RESET = 7.9;
const PULSE = 0.7;

const WINDOW = { x: 150, y: 0, z: 30, w: 250, h: 236 };
const DECK_PANEL = { x: -150, y: 150, w: 230, d: 150 };
const HUB_POS = { x: 110, y: 200, s: 62, h: 26 };

const PLAYERS = ["poker-ada", "poker-ben", "poker-chi", "poker-dan"];

function deckCardCenter(i: number): P3 {
  return [DECK_PANEL.x + 24 + i * 40 + 15, DECK_PANEL.y + 58 + 22, 6];
}

/** Wire from the deck panel, through the hub, up to the room window. */
const WIRE: P3[] = [
  [DECK_PANEL.x + DECK_PANEL.w, DECK_PANEL.y + 75, 0],
  [HUB_POS.x, DECK_PANEL.y + 75, 0],
  [HUB_POS.x + HUB_POS.s / 2, HUB_POS.y + HUB_POS.s / 2, HUB_POS.h],
  [HUB_POS.x + HUB_POS.s / 2, 60, 0],
  [WINDOW.x + 120, 60, 0],
  [WINDOW.x + 120, 8, WINDOW.z],
];

export function PokerScene() {
  const play = !useReducedMotion();
  const wirePts = useMemo(() => WIRE.map(project), []);
  const players = useMemo(() => PLAYERS.map((s) => blobatarUri(s, { size: 40, background: false })), []);

  return (
    <svg viewBox="-390 -250 820 490" className="poker-scene h-auto w-full" aria-hidden>
      <defs>
        <pattern id="poker-stipple" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.9" fill="var(--p-line)" opacity="0.35" />
        </pattern>
      </defs>

      <FloorGrid />

      {/* stippled shadows */}
      <OnTop x={WINDOW.x + 20} y={WINDOW.y + 14} z={0}>
        <rect width={WINDOW.w} height={70} fill="url(#poker-stipple)" />
      </OnTop>
      <OnTop x={DECK_PANEL.x + 14} y={DECK_PANEL.y + 12} z={0}>
        <rect width={DECK_PANEL.w} height={DECK_PANEL.d} fill="url(#poker-stipple)" />
      </OnTop>

      {/* back window: a second room, for depth */}
      <IsoSlab x={WINDOW.x + 60} y={-70} z={WINDOW.z + 40} w={WINDOW.w - 30} d={6} h={WINDOW.h - 20} r={2} shade={LINE} />
      <OnLeft x={WINDOW.x + 60} y={-64} z={WINDOW.z + 40 + WINDOW.h - 20}>
        <WindowChrome w={WINDOW.w - 30} />
        <rect x={16} y={40} width={86} height={110} rx={3} fill="none" stroke="var(--p-line)" strokeWidth={1.1} />
        <rect x={114} y={40} width={86} height={50} rx={3} fill="url(#poker-stipple)" stroke="var(--p-line)" strokeWidth={1.1} />
      </OnLeft>

      {/* wires + vote pulses */}
      <polyline
        points={wirePts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--p-line)"
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
      {wirePts.slice(1, -1).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.2} fill="var(--p-fill)" stroke="var(--p-line)" strokeWidth={1.2} />
      ))}

      {/* the room window */}
      <IsoSlab x={WINDOW.x} y={WINDOW.y} z={WINDOW.z} w={WINDOW.w} d={8} h={WINDOW.h} r={2} shade={LINE} />
      <OnLeft x={WINDOW.x} y={WINDOW.y + 8} z={WINDOW.z + WINDOW.h}>
        <WindowChrome w={WINDOW.w} />
        <rect x={18} y={40} width={150} height={6} rx={3} fill="var(--p-line)" opacity={0.85} />
        <rect x={18} y={52} width={96} height={6} rx={3} fill="var(--p-line)" opacity={0.35} />
        {RESULT.map((v, i) => (
          <RoomCard key={i} index={i} value={v} play={play} />
        ))}
        <ResultRow play={play} />
      </OnLeft>

      {/* hub */}
      <motion.g
        animate={play ? { y: [0, 0, 3, 0, 0] } : undefined}
        transition={at([0, FLIP - 0.25, FLIP - 0.12, FLIP + 0.1, T])}
      >
        <IsoSlab x={HUB_POS.x} y={HUB_POS.y} w={HUB_POS.s} d={HUB_POS.s} h={HUB_POS.h} r={10} shade={HUB}>
          <g transform={`translate(${HUB_POS.s / 2} ${HUB_POS.s / 2}) rotate(-8)`}>
            <rect x={-11} y={-15} width={22} height={30} rx={4} fill="var(--p-fill)" stroke="var(--p-line)" strokeWidth={1.3} />
            <rect x={-6} y={-9} width={12} height={18} rx={2} fill="var(--p-accent)" />
          </g>
        </IsoSlab>
      </motion.g>

      {/* players gathered behind the deck */}
      {players.map((uri, i) => {
        const [x, y] = project([DECK_PANEL.x + 10 + i * 58, DECK_PANEL.y - 46, 0]);
        return <Player key={i} uri={uri} at={[x, y]} index={i} play={play} />;
      })}

      {/* the deck players pick from */}
      <IsoSlab x={DECK_PANEL.x} y={DECK_PANEL.y} w={DECK_PANEL.w} d={DECK_PANEL.d} h={6} r={4} shade={LINE}>
        <WindowChrome w={DECK_PANEL.w} />
        <rect x={16} y={36} width={120} height={5} rx={2.5} fill="var(--p-line)" opacity={0.7} />
      </IsoSlab>
      {DECK.map((v, i) => (
        <DeckCard key={v} index={i} value={v} play={play} />
      ))}

      {VOTES.map((t, i) => (
        <Pulse key={i} points={wirePts} start={t + 0.15} play={play} />
      ))}

      <Cursor play={play} />
    </svg>
  );
}

function WindowChrome({ w }: { w: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={12 + i * 9} cy={12} r={2.8} fill="none" stroke="var(--p-line)" strokeWidth={1.1} />
      ))}
      <line x1={0} y1={24} x2={w} y2={24} stroke="var(--p-line)" strokeWidth={1.1} />
    </g>
  );
}

function DeckCard({ index, value, play }: { index: number; value: string; play: boolean }) {
  const [cx, cy, cz] = deckCardCenter(index);
  const picks = VOTES.filter((_, v) => PICKS[v] === index);
  const lift = picks.length
    ? {
        y: [0, ...picks.flatMap(() => [0, -10, 0]), 0],
        transition: at([0, ...picks.flatMap((t) => [t - 0.05, t + 0.08, t + 0.5]), T]),
      }
    : undefined;
  const highlight = picks.length
    ? {
        opacity: [0, ...picks.flatMap(() => [0, 1, 0]), 0],
        transition: at([0, ...picks.flatMap((t) => [t - 0.05, t + 0.05, t + 0.5]), T], "linear"),
      }
    : undefined;
  return (
    <motion.g animate={play ? lift : undefined}>
      <OnTop x={cx - 15} y={cy - 22} z={cz}>
        <rect width={30} height={44} rx={4} fill="var(--p-fill)" stroke="var(--p-line)" strokeWidth={1.2} />
        {picks.length > 0 && (
          <motion.rect
            width={30}
            height={44}
            rx={4}
            fill="var(--p-accent-soft)"
            stroke="var(--p-accent)"
            strokeWidth={1.6}
            initial={{ opacity: 0 }}
            animate={play ? highlight : undefined}
          />
        )}
        <text
          x={15}
          y={28}
          textAnchor="middle"
          fontSize={15}
          fontWeight={600}
          fill="var(--p-line)"
          style={{ fontFamily: "var(--font-jetbrains)" }}
        >
          {value}
        </text>
      </OnTop>
    </motion.g>
  );
}

function RoomCard({ index, value, play }: { index: number; value: string; play: boolean }) {
  const arrive = VOTES[index] + 0.15 + PULSE;
  const u = 18 + index * 56;
  const consensus = value === "5";
  return (
    <motion.g
      initial={play ? { opacity: 0 } : { opacity: 1 }}
      animate={play ? { opacity: [0, 0, 1, 1, 0, 0] } : undefined}
      transition={at([0, arrive, arrive + 0.15, RESET, RESET + 0.4, T], "linear")}
    >
      <g transform={`translate(${u} 72)`}>
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={play ? { scaleX: [1, 1, 0, 1, 1] } : undefined}
          transition={at([0, FLIP, FLIP + 0.13, FLIP + 0.26, T])}
        >
          <rect width={46} height={64} rx={5} fill="var(--p-fill)" stroke="var(--p-line)" strokeWidth={1.3} />
          <motion.g
            initial={play ? { opacity: 1 } : { opacity: 0 }}
            animate={play ? { opacity: [1, 1, 0, 0] } : undefined}
            transition={at([0, FLIP + 0.12, FLIP + 0.14, T], "linear")}
          >
            <rect x={5} y={5} width={36} height={54} rx={3} fill="url(#poker-stipple)" stroke="var(--p-line)" strokeWidth={0.9} />
            <path d="M17 32 l4 4 l8 -9" fill="none" stroke="var(--p-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </motion.g>
          <motion.g
            initial={play ? { opacity: 0 } : { opacity: 1 }}
            animate={play ? { opacity: [0, 0, 1, 1] } : undefined}
            transition={at([0, FLIP + 0.12, FLIP + 0.14, T], "linear")}
          >
            {consensus && <rect width={46} height={64} rx={5} fill="var(--p-accent-soft)" stroke="var(--p-accent)" strokeWidth={1.5} />}
            <text
              x={23}
              y={41}
              textAnchor="middle"
              fontSize={24}
              fontWeight={600}
              fill={consensus ? "var(--p-accent)" : "var(--p-line)"}
              style={{ fontFamily: "var(--font-jetbrains)" }}
            >
              {value}
            </text>
          </motion.g>
        </motion.g>
      </g>
    </motion.g>
  );
}

function ResultRow({ play }: { play: boolean }) {
  const show = FLIP + 0.5;
  const circumference = 2 * Math.PI * 20;
  return (
    <motion.g
      initial={play ? { opacity: 0 } : { opacity: 1 }}
      animate={play ? { opacity: [0, 0, 1, 1, 0, 0] } : undefined}
      transition={at([0, show, show + 0.3, RESET, RESET + 0.4, T], "linear")}
    >
      <line x1={18} y1={156} x2={232} y2={156} stroke="var(--p-line)" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
      <g transform="translate(46 192) rotate(-90)">
        <circle r={20} fill="none" stroke="var(--p-line)" strokeOpacity={0.2} strokeWidth={8} />
        <motion.circle
          r={20}
          fill="none"
          stroke="var(--p-accent)"
          strokeWidth={8}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: play ? circumference : circumference * 0.25 }}
          animate={
            play
              ? { strokeDashoffset: [circumference, circumference, circumference * 0.25, circumference * 0.25, circumference] }
              : undefined
          }
          transition={at([0, show, show + 0.8, RESET, T])}
        />
      </g>
      <text x={82} y={188} fontSize={11} fill="var(--p-line)" opacity={0.6} style={{ fontFamily: "var(--font-jetbrains)" }}>
        AVERAGE
      </text>
      <text x={82} y={210} fontSize={22} fontWeight={600} fill="var(--p-line)" style={{ fontFamily: "var(--font-jetbrains)" }}>
        5.8
      </text>
      <rect x={150} y={176} width={70} height={9} rx={4.5} fill="var(--p-accent)" />
      <rect x={150} y={194} width={24} height={9} rx={4.5} fill="var(--p-line)" opacity={0.5} />
    </motion.g>
  );
}

function Player({ uri, at: [x, y], index, play }: { uri: string; at: P2; index: number; play: boolean }) {
  const t = VOTES[index];
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={22} ry={11} fill="url(#poker-stipple)" />
      <motion.g
        animate={play ? { y: [0, 0, -8, 0, 0] } : undefined}
        transition={at([0, t - 0.1, t + 0.05, t + 0.35, T])}
      >
        <circle cx={x} cy={y - 22} r={20} fill="var(--p-fill)" stroke="var(--p-line)" strokeWidth={1.3} />
        <image href={uri} x={x - 16} y={y - 38} width={32} height={32} />
      </motion.g>
    </g>
  );
}

function Pulse({ points, start, play }: { points: P2[]; start: number; play: boolean }) {
  if (!play) return null;
  // Spread the travel time over the wire segments by length.
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const times = [0, start];
  let acc = 0;
  for (const l of lengths) {
    acc += l;
    times.push(start + (acc / total) * PULSE);
  }
  times.push(T);
  const xs = [points[0][0], ...points.map((p) => p[0]), points[points.length - 1][0]];
  const ys = [points[0][1], ...points.map((p) => p[1]), points[points.length - 1][1]];
  const end = start + PULSE;
  return (
    <motion.circle
      r={4.5}
      fill="var(--p-accent)"
      initial={{ opacity: 0, cx: xs[0], cy: ys[0] }}
      animate={{ cx: xs, cy: ys, opacity: [0, 0, 1, 1, 0, 0] }}
      transition={{
        ...at(times, "linear"),
        opacity: at([0, start, start + 0.02, end, end + 0.05, T], "linear"),
      }}
    />
  );
}

function Cursor({ play }: { play: boolean }) {
  const targets = PICKS.map((p) => project(deckCardCenter(p)));
  const rest: P2 = project([DECK_PANEL.x + DECK_PANEL.w - 20, DECK_PANEL.y + DECK_PANEL.d + 10, 0]);
  const xs = [rest[0], ...targets.flatMap((p) => [p[0], p[0]]), rest[0], rest[0]];
  const ys = [rest[1], ...targets.flatMap((p) => [p[1], p[1]]), rest[1], rest[1]];
  const times = [0, ...VOTES.flatMap((t) => [t - 0.35, t + 0.15]), 3.9, T];
  return (
    <motion.g
      initial={{ x: rest[0], y: rest[1] }}
      animate={play ? { x: xs, y: ys } : undefined}
      transition={at(times)}
    >
      <path
        d="M0 0 L0 24 L6.5 18.5 L11 28 L15.5 26 L11 16.8 L19.5 16.8 Z"
        fill="var(--p-fill)"
        stroke="var(--p-line)"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </motion.g>
  );
}

function FloorGrid() {
  const lines: string[] = [];
  for (let k = -3; k <= 8; k++) {
    const a = project([-260, k * 60 - 120, 0]);
    const b = project([520, k * 60 - 120, 0]);
    lines.push(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
  }
  for (let k = -5; k <= 9; k++) {
    const a = project([k * 60 - 260, -180, 0]);
    const b = project([k * 60 - 260, 420, 0]);
    lines.push(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`);
  }
  return <path d={lines.join("")} stroke="var(--p-line)" strokeOpacity={0.22} strokeWidth={1} strokeDasharray="3 5" fill="none" />;
}
