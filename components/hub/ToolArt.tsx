import { IsoCylinder, IsoSlab, OnLeft, OnTop } from "@/components/iso/primitives";
import { GREEN, KEY, MONO, ORANGE, Shadow } from "@/components/iso/palette";
import { project } from "@/components/iso/geometry";

/*
 * Static isometric illustrations for the hub's tool cards, also shown in the
 * apps' empty states. They reuse the hero's drawing kit and the `.hub-scene`
 * palette: neutral keys, with Poker green or Retro orange as the one accent.
 */

/** Dashed cable on the floor through world points (x, y). */
function Cable({ points }: { points: [number, number][] }) {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${project([x, y, 0]).join(" ")}`).join("");
  return <path d={d} fill="none" stroke="var(--k-line)" strokeOpacity={0.45} strokeWidth={1.1} strokeDasharray="4 4" />;
}

export function PokerArt() {
  const card = { w: 30, d: 42 };
  return (
    <svg viewBox="-135 -72 510 305" className="hub-scene h-full w-full" aria-hidden>
      <Cable points={[[210, 30], [228, 30], [228, -80]]} />

      {/* results screen at the back */}
      <Shadow x={190} y={-128} w={88} d={40} />
      <IsoSlab x={190} y={-128} w={88} d={40} h={10} r={8} shade={KEY} />
      <IsoSlab x={196} y={-112} z={10} w={76} d={6} h={78} r={2} shade={KEY} />
      <OnLeft x={196} y={-106} z={84}>
        <rect x={6} y={6} width={64} height={62} rx={5} fill="var(--k-top)" stroke="var(--k-line)" strokeWidth={1} />
        <circle cx={38} cy={30} r={14} fill="none" stroke="var(--k-right)" strokeWidth={6} />
        <circle
          cx={38}
          cy={30}
          r={14}
          fill="none"
          stroke="var(--g-left)"
          strokeWidth={6}
          strokeDasharray={`${2 * Math.PI * 14 * 0.7} 999`}
          transform="rotate(-90 38 30)"
        />
        <text x={38} y={60} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--k-line)" style={MONO}>
          5.8
        </text>
      </OnLeft>

      {/* the table with cards dealt face down */}
      <Shadow x={0} y={0} w={210} d={130} />
      <IsoSlab x={0} y={0} w={210} d={130} h={16} r={14} shade={KEY} />
      {[0, 1, 3, 4].map((i) => (
        <IsoSlab key={i} x={18 + i * 38} y={46} z={16} w={card.w} d={card.d} h={3} r={4} shade={GREEN}>
          <rect x={4} y={4} width={card.w - 8} height={card.d - 8} rx={2} fill="none" stroke="var(--k-top)" strokeOpacity={0.7} />
        </IsoSlab>
      ))}

      {/* the picked card, lifted and face up */}
      <OnTop x={18 + 2 * 38 + 6} y={52} z={16}>
        <rect width={card.w} height={card.d} rx={4} fill="var(--k-shadow)" />
      </OnTop>
      <IsoSlab x={18 + 2 * 38} y={40} z={34} w={card.w} d={card.d} h={3} r={4} shade={KEY}>
        <text
          x={card.w / 2}
          y={card.d / 2 + 6}
          textAnchor="middle"
          fontSize={17}
          fontWeight={700}
          fill="var(--g-ink)"
          style={MONO}
        >
          5
        </text>
      </IsoSlab>

      {/* round timer */}
      <Shadow x={232} y={38} w={46} d={46} />
      <IsoCylinder cx={255} cy={61} radius={24} h={20} shade={KEY}>
        <circle r={15} fill="none" stroke="var(--k-right)" strokeWidth={3} />
        <circle r={15} fill="none" stroke="var(--g-left)" strokeWidth={3} strokeDasharray={`${2 * Math.PI * 15 * 0.35} 999`} />
        <path d="M0 0 L0 -10" stroke="var(--k-line)" strokeWidth={1.6} strokeLinecap="round" />
      </IsoCylinder>

      {/* pointer */}
      <path
        d="M0 0 L0 17 L4.5 13 L8 20.5 L11 19 L7.6 11.8 L13.5 11.6 Z"
        transform={`translate(${project([18 + 2 * 38 + 34, 74, 40]).join(" ")})`}
        fill="var(--k-top)"
        stroke="var(--k-line)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RetroArt() {
  const lanes = 3;
  const laneW = (220 - 24 - (lanes - 1) * 8) / lanes;
  return (
    <svg viewBox="-135 -72 510 305" className="hub-scene h-full w-full" aria-hidden>
      <Cable points={[[110, 140], [110, 190], [150, 190]]} />
      <Cable points={[[220, 40], [238, 40], [238, -90]]} />

      {/* action items panel at the back */}
      <Shadow x={200} y={-130} w={84} d={38} />
      <IsoSlab x={200} y={-130} w={84} d={38} h={10} r={8} shade={KEY} />
      <IsoSlab x={206} y={-114} z={10} w={72} d={6} h={78} r={2} shade={KEY} />
      <OnLeft x={206} y={-108} z={84}>
        <rect x={6} y={6} width={60} height={62} rx={5} fill="var(--k-top)" stroke="var(--k-line)" strokeWidth={1} />
        {[0, 1, 2].map((r) => (
          <g key={r} transform={`translate(13 ${15 + r * 17})`}>
            <rect width={10} height={10} rx={2.5} fill={r < 2 ? "var(--o-left)" : "none"} stroke="var(--k-line)" strokeWidth={1} />
            {r < 2 && <path d="M2.4 5.2 l2 2 l3.4 -3.8" fill="none" stroke="var(--k-top)" strokeWidth={1.5} strokeLinecap="round" />}
            <rect x={16} y={3} width={r === 1 ? 22 : 30} height={4} rx={2} fill="var(--k-right)" />
          </g>
        ))}
      </OnLeft>

      {/* the board with three lanes of notes */}
      <Shadow x={0} y={0} w={220} d={140} />
      <IsoSlab x={0} y={0} w={220} d={140} h={16} r={14} shade={KEY}>
        {Array.from({ length: lanes }, (_, l) => (
          <g key={l} transform={`translate(${12 + l * (laneW + 8)} 12)`}>
            <rect width={laneW} height={8} rx={4} fill="var(--o-left)" opacity={l === 2 ? 1 : 0.45} />
            {[0, 1].slice(0, l === 1 ? 1 : 2).map((n) => (
              <g key={n} transform={`translate(0 ${16 + n * 52})`}>
                <rect width={laneW} height={44} rx={4} fill="var(--o-note)" stroke="var(--o-left)" strokeOpacity={0.5} />
                <rect x={8} y={10} width={laneW - 22} height={4} rx={2} fill="var(--o-left)" opacity={0.7} />
                <rect x={8} y={19} width={laneW - 34} height={4} rx={2} fill="var(--o-left)" opacity={0.7} />
              </g>
            ))}
          </g>
        ))}
      </IsoSlab>

      {/* a stack of grouped notes */}
      <Shadow x={160} y={150} w={56} d={56} />
      {[0, 1, 2, 3].map((i) => (
        <IsoSlab key={i} x={160} y={150} z={i * 7} w={56} d={56} h={5} r={5} shade={i === 3 ? ORANGE : KEY}>
          {i === 3 && (
            <>
              <rect x={10} y={14} width={32} height={5} rx={2.5} fill="var(--o-left)" />
              <rect x={10} y={25} width={22} height={5} rx={2.5} fill="var(--o-left)" />
            </>
          )}
        </IsoSlab>
      ))}

      {/* vote chip */}
      <Shadow x={232} y={64} w={46} d={46} />
      <IsoCylinder cx={255} cy={87} radius={24} h={14} shade={ORANGE}>
        <text x={0} y={6} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--o-right)" style={MONO}>
          +3
        </text>
      </IsoCylinder>
    </svg>
  );
}
