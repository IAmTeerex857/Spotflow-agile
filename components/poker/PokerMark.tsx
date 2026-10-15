/** Poker logo: accent rounded tile with a rotated "card" cutout. */
export function PokerMark({
  size = 30,
  radius = 9,
}: {
  size?: number;
  radius?: number;
}) {
  const w = size * 0.4;
  const h = size * 0.53;
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-accent shadow-sm-t"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <div
        className="bg-accent-fg"
        style={{ width: w, height: h, borderRadius: 3, transform: "rotate(-8deg)" }}
      />
    </div>
  );
}
