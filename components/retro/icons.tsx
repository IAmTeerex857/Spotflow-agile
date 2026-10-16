/* Exact line-icon recreations from the Retro prototype (stroke = currentColor). */

type IconProps = { size?: number; className?: string; strokeWidth?: number };

function Svg({
  size = 20,
  className,
  strokeWidth = 1.8,
  strokeLinecap,
  strokeLinejoin,
  children,
}: IconProps & {
  children: React.ReactNode;
  strokeLinecap?: "round" | "butt" | "square";
  strokeLinejoin?: "round" | "miter" | "bevel";
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconSmiley(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 14c1 1.4 2.4 2 4 2s3-.6 4-2" strokeLinecap="round" />
      <circle cx="8.7" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.3" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconFrowny(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 16c1-1.4 2.4-2 4-2s3 .6 4 2" strokeLinecap="round" />
      <circle cx="8.7" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.3" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconChat(p: IconProps) {
  return (
    <Svg {...p} strokeWidth={p.strokeWidth ?? 1.8}>
      <path d="M4 5.5h16v10H10l-4 3.5v-3.5H4z" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCheckSquare(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="4" strokeLinejoin="round" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The three-dot Retro logo mark on its rounded-with-one-sharp-corner tile. */
export function RetroMark({ size = 30 }: { size?: number }) {
  const dot = Math.max(2.5, size * 0.1);
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-accent shadow-sm-t"
      style={{ width: size, height: size, borderRadius: "999px 999px 999px 4px" }}
    >
      <div className="flex" style={{ gap: dot * 0.66 }}>
        <span className="rounded-full" style={{ width: dot, height: dot, background: "var(--accent-fg)" }} />
        <span className="rounded-full" style={{ width: dot, height: dot, background: "var(--accent-fg)" }} />
        <span className="rounded-full" style={{ width: dot, height: dot, background: "var(--accent-fg)" }} />
      </div>
    </div>
  );
}
