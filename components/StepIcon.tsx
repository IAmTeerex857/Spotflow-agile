/**
 * Flat two-tone icons for the "How it works" steps. Colours come from CSS
 * variables on `.step-icon` (see globals.css), so each surface tints them:
 * the hub mixes Poker green and Retro orange, the tools use their accent.
 */

export type StepIconName =
  | "open"
  | "share"
  | "decide"
  | "room"
  | "invite"
  | "vote"
  | "write"
  | "reveal"
  | "act"
  | "done";

const LINE = "var(--ic-line)";
const PAPER = "var(--ic-paper)";
const A = "var(--ic-a)";
const A_SOFT = "var(--ic-a-soft)";
const B = "var(--ic-b)";
const B_SOFT = "var(--ic-b-soft)";

const ICONS: Record<StepIconName, React.ReactNode> = {
  // A fresh window with a big "start" button
  open: (
    <>
      <rect x="6" y="9" width="44" height="36" rx="7" fill={PAPER} />
      <path d="M6 16a7 7 0 0 1 7-7h30a7 7 0 0 1 7 7v4H6z" fill={A_SOFT} />
      <rect x="6" y="9" width="44" height="36" rx="7" fill="none" stroke={LINE} />
      <path d="M6 20h44" stroke={LINE} />
      <circle cx="12.5" cy="14.5" r="1.6" fill={LINE} />
      <circle cx="17.5" cy="14.5" r="1.6" fill={LINE} />
      <circle cx="28" cy="32.5" r="8" fill={A} />
      <path d="M28 28.5v8M24 32.5h8" stroke={PAPER} strokeWidth="2.2" />
    </>
  ),
  // A chat message carrying the link
  share: (
    <>
      <path d="M10 10h30a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H22l-9 7v-7h-3a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z" fill={B_SOFT} stroke={LINE} />
      <rect x="11" y="20.5" width="14" height="7" rx="3.5" fill="none" stroke={B} strokeWidth="2.4" />
      <rect x="21" y="20.5" width="14" height="7" rx="3.5" fill="none" stroke={B} strokeWidth="2.4" />
      <circle cx="47" cy="11" r="5.5" fill={A} />
      <path d="m44.6 11 1.7 1.7 3.2-3.4" stroke={PAPER} strokeWidth="1.8" />
    </>
  ),
  // Two cards: one still hidden, one turned and agreed
  decide: (
    <>
      <g transform="rotate(-12 19 29)">
        <rect x="8" y="13" width="22" height="31" rx="4" fill={B} stroke={LINE} />
        <rect x="12" y="17" width="14" height="23" rx="2" fill="none" stroke={PAPER} strokeOpacity="0.55" />
      </g>
      <g transform="rotate(9 36 28)">
        <rect x="25" y="11" width="22" height="31" rx="4" fill={PAPER} stroke={LINE} />
        <circle cx="36" cy="26.5" r="6.5" fill={A} />
        <path d="m33 26.5 2.2 2.2 4-4.2" stroke={PAPER} strokeWidth="2" />
      </g>
    </>
  ),
  // A new room: a deck of cards with a plus
  room: (
    <>
      <rect x="15" y="9" width="24" height="34" rx="4" fill={A_SOFT} stroke={LINE} transform="rotate(-8 27 26)" />
      <rect x="14" y="12" width="24" height="34" rx="4" fill={PAPER} stroke={LINE} />
      <text x="26" y="34" textAnchor="middle" fontSize="15" fontWeight="700" fill={A} stroke="none" style={{ fontFamily: "var(--font-mono)" }}>
        5
      </text>
      <circle cx="42" cy="40" r="8" fill={A} stroke={PAPER} strokeWidth="2.5" />
      <path d="M42 36.5v7M38.5 40h7" stroke={PAPER} strokeWidth="2.2" />
    </>
  ),
  // People joining by name
  invite: (
    <>
      <circle cx="35" cy="18" r="6.5" fill={A_SOFT} stroke={LINE} />
      <path d="M24.5 40c0-7 4.7-11.5 10.5-11.5S45.5 33 45.5 40z" fill={A_SOFT} stroke={LINE} />
      <circle cx="21" cy="21" r="7" fill={A} stroke={LINE} />
      <path d="M9.5 44.5c0-7.5 5.1-12.5 11.5-12.5s11.5 5 11.5 12.5z" fill={A} stroke={LINE} />
      <rect x="36" y="38" width="15" height="9" rx="4.5" fill={PAPER} stroke={LINE} />
      <path d="M39.5 42.5h8" stroke={LINE} strokeOpacity="0.45" />
    </>
  ),
  // A fan of cards with the chosen one raised
  vote: (
    <>
      <rect x="9" y="16" width="19" height="27" rx="3.5" fill={A_SOFT} stroke={LINE} transform="rotate(-16 18.5 29.5)" />
      <rect x="28" y="16" width="19" height="27" rx="3.5" fill={A_SOFT} stroke={LINE} transform="rotate(16 37.5 29.5)" />
      <rect x="18.5" y="9" width="19" height="29" rx="3.5" fill={A} stroke={LINE} />
      <text x="28" y="28.5" textAnchor="middle" fontSize="13" fontWeight="700" fill={PAPER} stroke="none" style={{ fontFamily: "var(--font-mono)" }}>
        8
      </text>
      <path d="M17 47h22" stroke={LINE} strokeOpacity="0.35" />
    </>
  ),
  // A sticky note and a pencil
  write: (
    <>
      <path d="M9 10h30v22l-9 9H9z" fill={A_SOFT} stroke={LINE} />
      <path d="M30 41v-9h9" fill={PAPER} stroke={LINE} />
      <path d="M15 18h17M15 24h12" stroke={A} strokeWidth="2.4" />
      <g transform="rotate(40 40 33)">
        <rect x="36.5" y="16" width="7" height="26" rx="1.5" fill={A} stroke={LINE} />
        <path d="m36.5 42 3.5 6 3.5-6z" fill={PAPER} stroke={LINE} />
      </g>
    </>
  ),
  // Notes stacked together with a vote on top
  reveal: (
    <>
      <rect x="8" y="14" width="26" height="26" rx="4" fill={A_SOFT} stroke={LINE} transform="rotate(-7 21 27)" />
      <rect x="14" y="17" width="26" height="26" rx="4" fill={PAPER} stroke={LINE} />
      <path d="M19.5 25h15M19.5 30.5h10" stroke={A} strokeWidth="2.4" />
      <circle cx="42" cy="15" r="8.5" fill={A} stroke={PAPER} strokeWidth="2.5" />
      <text x="42" y="18.6" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={PAPER} stroke="none" style={{ fontFamily: "var(--font-sans)" }}>
        +3
      </text>
    </>
  ),
  // A checklist on a clipboard
  act: (
    <>
      <rect x="11" y="10" width="34" height="39" rx="5" fill={PAPER} stroke={LINE} />
      <rect x="20" y="6.5" width="16" height="7" rx="3" fill={A} stroke={LINE} />
      <rect x="17" y="20" width="7" height="7" rx="2" fill={A} />
      <path d="m18.6 23.5 1.5 1.5 2.6-2.8" stroke={PAPER} strokeWidth="1.5" />
      <path d="M28 23.5h11" stroke={LINE} strokeOpacity="0.5" />
      <rect x="17" y="32" width="7" height="7" rx="2" fill={A_SOFT} stroke={LINE} strokeWidth="1.2" />
      <path d="M28 35.5h8" stroke={LINE} strokeOpacity="0.5" />
    </>
  ),
  // A finish flag
  done: (
    <>
      <ellipse cx="22" cy="47" rx="12" ry="3.5" fill={A_SOFT} />
      <path d="M16 47V8" stroke={LINE} strokeWidth="2.2" />
      <path d="M16 10h26l-6 8.5 6 8.5H16z" fill={A} stroke={LINE} />
      <path d="m24 18.5 3 3 5.5-6" stroke={PAPER} strokeWidth="2.2" />
    </>
  ),
};

export function StepIcon({ name, size = 56 }: { name: StepIconName; size?: number }) {
  return (
    <svg
      className="step-icon"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      stroke="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}
