"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { blobatarUri } from "blobatar/uri";
import { project, slab, type P2 } from "@/components/iso/geometry";
import { IsoCylinder, IsoSlab, OnLeft, OnTop, type Shade } from "@/components/iso/primitives";
import { timeline } from "./loop";

/**
 * Hub hero: an isometric "team deck". Teammates press vote keys, a cursor hits
 * Reveal and every card flips at once, then the Retro key sends up sticky
 * notes. One 10 second loop.
 */

const T = 10;
const at = timeline(T);

const KEY: Shade = { top: "var(--k-top)", left: "var(--k-left)", right: "var(--k-right)", line: "var(--k-line)" };
const GREEN: Shade = { top: "var(--g-top)", left: "var(--g-left)", right: "var(--g-right)", line: "var(--k-line)" };
const ORANGE: Shade = { top: "var(--o-top)", left: "var(--o-left)", right: "var(--o-right)", line: "var(--k-line)" };

const PLATE = { x: 0, y: 0, z: 0, w: 380, d: 230, h: 20, r: 26 };
const SURFACE_Z = PLATE.h;

const VALUES = ["1", "2", "3", "5", "8"];
/** Which value key each teammate presses, and when. */
const VOTES = [
  { key: 3, t: 0.6 },
  { key: 3, t: 1.3 },
  { key: 4, t: 2.0 },
  { key: 3, t: 2.6 },
];
const REVEAL_AT = 3.5;
const RETRO_AT = 6.4;
/** Poker props clear away before the retro notes rise. */
const POKER_END = 5.9;

const BLOBS: { seed: string; at: P2 }[] = [
  { seed: "hub-amara", at: [-214, -96] },
  { seed: "hub-kofi", at: [-120, -190] },
  { seed: "hub-lena", at: [150, -170] },
  { seed: "hub-tobi", at: [262, -70] },
];

const CARD_VALUES = ["5", "5", "8", "5"];

function press(t: number) {
  return { y: [0, 0, 4, 0, 0], transition: at([0, t, t + 0.1, t + 0.32, T]) };
}

export function HubScene() {
  const play = !useReducedMotion();
  const blobUris = useMemo(() => BLOBS.map((b) => blobatarUri(b.seed, { size: 56, background: false })), []);
  const shadow = useMemo(() => slab(PLATE.x, PLATE.y, 0, PLATE.w, PLATE.d, 1, PLATE.r).top, []);

  const revealKey = project([104, 126, SURFACE_Z + 15]);
  const retroKey = project([254, 126, SURFACE_Z + 15]);
  const cursorStart: P2 = [236, -40];

  return (
    <svg viewBox="-240 -214 670 540" className="hub-scene h-auto w-full" aria-hidden>
      {/* soft drop shadow */}
      <path d={shadow} transform="translate(22 16)" fill="var(--k-shadow)" />

      <CoiledCable from={project([380, 168, 8])} />

      <IsoSlab {...PLATE} shade={KEY}>
        <rect x={22} y={172} width={346} height={40} rx={10} fill="var(--k-screen)" />
        <EqualizerBars play={play} />
      </IsoSlab>

      {/* row 1: vote keys */}
      {VALUES.map((v, i) => {
        const presses = VOTES.filter((vote) => vote.key === i).map((vote) => vote.t);
        return (
          <motion.g key={v} animate={play && presses.length ? multiPress(presses) : undefined}>
            <IsoSlab x={22 + i * 64} y={22} z={SURFACE_Z} w={52} d={52} h={15} r={10} shade={KEY}>
              <text
                x={26}
                y={32}
                textAnchor="middle"
                fontSize={20}
                fontWeight={600}
                fill="var(--k-line)"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {v}
              </text>
            </IsoSlab>
          </motion.g>
        );
      })}

      {/* volume knob */}
      <IsoCylinder cx={355} cy={48} z={SURFACE_Z} radius={17} h={24} shade={KEY}>
        <motion.g animate={play ? { rotate: [0, 120, 0] } : undefined} transition={at([0, 5, T])}>
          <rect x={-1.5} y={-14} width={3} height={8} rx={1.5} fill="var(--o-left)" />
        </motion.g>
      </IsoCylinder>

      {/* row 2: Reveal, Retro, ? */}
      <motion.g animate={play ? press(REVEAL_AT) : undefined}>
        <IsoSlab x={22} y={94} z={SURFACE_Z} w={164} d={64} h={15} r={12} shade={GREEN}>
          <KeyLabel x={82} y={38}>Reveal</KeyLabel>
        </IsoSlab>
      </motion.g>
      <motion.g animate={play ? press(RETRO_AT) : undefined}>
        <IsoSlab x={198} y={94} z={SURFACE_Z} w={112} d={64} h={15} r={12} shade={ORANGE}>
          <KeyLabel x={56} y={38}>Retro</KeyLabel>
        </IsoSlab>
      </motion.g>
      <IsoSlab x={322} y={94} z={SURFACE_Z} w={46} d={64} h={15} r={10} shade={KEY}>
        <KeyLabel x={23} y={38}>?</KeyLabel>
      </IsoSlab>

      {/* revealed cards */}
      {CARD_VALUES.map((value, i) => (
        <FlipCard key={i} index={i} value={value} play={play} />
      ))}

      {/* retro notes */}
      {[0, 1, 2].map((i) => (
        <RisingNote key={i} index={i} play={play} />
      ))}

      {/* teammates */}
      {BLOBS.map((b, i) => (
        <Teammate key={b.seed} uri={blobUris[i]} at={b.at} index={i} selected={i === 0} play={play} />
      ))}

      <FlowLine from={[BLOBS[1].at[0] + 28, BLOBS[1].at[1] + 64]} to={project([150, 48, SURFACE_Z + 15])} play={play} />

      <motion.g
        animate={
          play
            ? {
                x: [cursorStart[0], cursorStart[0], revealKey[0], revealKey[0], retroKey[0], retroKey[0], cursorStart[0], cursorStart[0]],
                y: [cursorStart[1], cursorStart[1], revealKey[1], revealKey[1], retroKey[1], retroKey[1], cursorStart[1], cursorStart[1]],
              }
            : { x: revealKey[0], y: revealKey[1] }
        }
        transition={at([0, 2.7, 3.4, 5.5, 6.3, 8.8, 9.6, T])}
      >
        <motion.g
          animate={play ? { scale: [1, 1, 0.82, 1, 1, 0.82, 1, 1] } : undefined}
          transition={at([0, REVEAL_AT - 0.08, REVEAL_AT, REVEAL_AT + 0.16, RETRO_AT - 0.08, RETRO_AT, RETRO_AT + 0.16, T])}
        >
          <path
            d="M0 0 L0 30 L8 23 L13.5 35 L19 32.6 L13.6 21 L24 21 Z"
            fill="var(--k-top)"
            stroke="var(--k-line)"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </motion.g>
      </motion.g>
    </svg>
  );
}

function multiPress(times: number[]) {
  const y: number[] = [0];
  const t: number[] = [0];
  for (const p of times) {
    y.push(0, 4, 0);
    t.push(p, p + 0.1, p + 0.32);
  }
  y.push(0);
  t.push(T);
  return { y, transition: at(t) };
}

function KeyLabel({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={13}
      fontWeight={600}
      letterSpacing={0.5}
      fill="var(--k-line)"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {children}
    </text>
  );
}

function EqualizerBars({ play }: { play: boolean }) {
  const bars = Array.from({ length: 30 }, (_, i) => i);
  return (
    <g>
      {bars.map((i) => {
        const len = 8 + ((i * 7) % 17);
        const color = i < 15 ? "var(--g-left)" : "var(--o-left)";
        return (
          <motion.rect
            key={i}
            x={34 + i * 11}
            y={206 - 24}
            width={5}
            height={24}
            rx={1.5}
            fill={color}
            style={{ originY: 1 }}
            initial={{ scaleY: len / 24 }}
            animate={play ? { scaleY: [len / 24, 0.25 + ((i * 13) % 10) / 14, len / 24] } : undefined}
            transition={{ duration: 1.2 + (i % 5) * 0.23, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </g>
  );
}

function FlipCard({ index, value, play }: { index: number; value: string; play: boolean }) {
  const x = 34 + index * 58;
  const rise = REVEAL_AT + 0.25 + index * 0.08;
  const flip = 4.5;
  const consensus = value === "5";
  return (
    <motion.g
      initial={play ? { opacity: 0, y: 26 } : false}
      animate={play ? { opacity: [0, 0, 1, 1, 0, 0], y: [26, 26, 0, 0, -12, -12] } : undefined}
      transition={at([0, rise, rise + 0.45, POKER_END, POKER_END + 0.4, T])}
    >
      <OnLeft x={x} y={128} z={210}>
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={play ? { scaleX: [1, 1, 0, 1, 1] } : undefined}
          transition={at([0, flip, flip + 0.14, flip + 0.28, T])}
        >
          <rect width={50} height={72} rx={8} fill="var(--k-top)" stroke="var(--k-line)" strokeWidth={1.4} />
          {/* back */}
          <motion.g
            initial={play ? { opacity: 1 } : { opacity: 0 }}
            animate={play ? { opacity: [1, 1, 0, 0] } : undefined}
            transition={at([0, flip + 0.13, flip + 0.15, T], "linear")}
          >
            <rect x={6} y={6} width={38} height={60} rx={5} fill="var(--g-top)" />
            <path d="M6 22 L28 6 M6 38 L44 10 M6 54 L44 26 M12 66 L44 42 M28 66 L44 58" stroke="var(--g-left)" strokeWidth={1.4} />
          </motion.g>
          {/* face */}
          <motion.g
            initial={play ? { opacity: 0 } : { opacity: 1 }}
            animate={play ? { opacity: [0, 0, 1, 1] } : undefined}
            transition={at([0, flip + 0.13, flip + 0.15, T], "linear")}
          >
            <text
              x={25}
              y={46}
              textAnchor="middle"
              fontSize={28}
              fontWeight={700}
              fill={consensus ? "var(--g-ink)" : "var(--k-line)"}
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {value}
            </text>
          </motion.g>
        </motion.g>
      </OnLeft>
    </motion.g>
  );
}

function RisingNote({ index, play }: { index: number; play: boolean }) {
  const start = RETRO_AT + 0.2 + index * 0.18;
  const lift = 84 + index * 30;
  const tilt = [-8, 5, -3][index];
  return (
    <motion.g
      initial={play ? { opacity: 0, y: 0 } : { opacity: 1, y: -lift }}
      animate={play ? { opacity: [0, 0, 1, 1, 0, 0], y: [0, 0, -lift, -lift, -lift - 14, -lift - 14] } : undefined}
      transition={at([0, start, start + 0.7, 8.6, 9.1, T], ["linear", "backOut", "linear", "easeIn", "linear"])}
    >
      <OnTop x={214 + index * 14} y={100 - index * 6} z={SURFACE_Z + 16}>
        <g transform={`rotate(${tilt} 30 30)`}>
          <rect width={60} height={60} rx={6} fill="var(--o-note)" stroke="var(--k-line)" strokeWidth={1.2} />
          <rect x={10} y={14} width={38} height={5} rx={2.5} fill="var(--o-left)" opacity={0.7} />
          <rect x={10} y={25} width={28} height={5} rx={2.5} fill="var(--o-left)" opacity={0.7} />
          <rect x={10} y={36} width={34} height={5} rx={2.5} fill="var(--o-left)" opacity={0.7} />
        </g>
      </OnTop>
    </motion.g>
  );
}

function Teammate({
  uri,
  at: [x, y],
  index,
  selected,
  play,
}: {
  uri: string;
  at: P2;
  index: number;
  selected: boolean;
  play: boolean;
}) {
  const voteAt = VOTES[index].t;
  return (
    <motion.g
      animate={play ? { y: [0, -7, 0] } : undefined}
      transition={{ duration: 3.2 + index * 0.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
    >
      <circle cx={x + 28} cy={y + 28} r={28} fill="var(--k-top)" stroke="var(--k-line)" strokeWidth={1.3} />
      <image href={uri} x={x + 4} y={y + 4} width={48} height={48} />
      {selected && (
        <g fill="none" stroke="var(--sel)" strokeWidth={1.4}>
          <rect x={x - 8} y={y - 8} width={72} height={72} />
          {[
            [x - 8, y - 8],
            [x + 64, y - 8],
            [x - 8, y + 64],
            [x + 64, y + 64],
          ].map(([hx, hy]) => (
            <rect key={`${hx}-${hy}`} x={hx - 3.5} y={hy - 3.5} width={7} height={7} fill="var(--k-top)" />
          ))}
        </g>
      )}
      {/* "voted" badge */}
      <motion.g
        initial={play ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={play ? { scale: [0, 0, 1, 1, 0, 0], opacity: [0, 0, 1, 1, 0, 0] } : undefined}
        transition={at([0, voteAt, voteAt + 0.25, POKER_END, POKER_END + 0.3, T], ["linear", "backOut", "linear", "easeIn", "linear"])}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <circle cx={x + 50} cy={y + 8} r={10} fill="var(--g-left)" stroke="var(--k-top)" strokeWidth={2} />
        <path d={`M${x + 45.5} ${y + 8} l3 3 l5.5 -6`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </motion.g>
  );
}

function FlowLine({ from, to, play }: { from: P2; to: P2; play: boolean }) {
  const midY = from[1] + (to[1] - from[1]) * 0.45;
  const d = `M${from[0]} ${from[1]} L${from[0]} ${midY} L${to[0]} ${to[1] - 30} L${to[0]} ${to[1]}`;
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="var(--k-line)"
      strokeOpacity={0.45}
      strokeWidth={1.3}
      strokeDasharray="5 6"
      animate={play ? { strokeDashoffset: [0, -44] } : undefined}
      transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
    />
  );
}

function CoiledCable({ from }: { from: P2 }) {
  const d = useMemo(() => {
    const pts: string[] = [];
    const [x0, y0] = from;
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const bx = x0 + t * 240;
      const by = y0 - t * 120;
      const coil = t > 0.35 ? Math.min(1, (t - 0.35) * 6) : 0;
      const a = t * Math.PI * 2 * 9;
      pts.push(`${(bx + coil * 9 * Math.cos(a)).toFixed(1)} ${(by + coil * 14 * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join("L")}`;
  }, [from]);
  return <path d={d} fill="none" stroke="var(--k-line)" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />;
}
