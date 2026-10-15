/** The abstract "spot + flow" suite mark: an inverted circle + rotated bar on a rounded tile. */
export function SuiteMark({ size = 29, radius = 8 }: { size?: number; radius?: number }) {
  const icon = Math.round(size * 0.59);
  return (
    <div
      className="flex items-center justify-center bg-text"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="8.5" cy="8" r="3.4" fill="var(--bg)" />
        <rect
          x="6"
          y="13.6"
          width="13.5"
          height="4.6"
          rx="2.3"
          fill="var(--bg)"
          transform="rotate(-24 12.75 15.9)"
        />
      </svg>
    </div>
  );
}
