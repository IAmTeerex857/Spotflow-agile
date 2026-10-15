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

/* feature icons */
export function IconPhone(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18.6h4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconIncognito(p: IconProps) {
  return (
    <Svg {...p} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18" />
      <path d="M5 12l1.3-4.4A2 2 0 0 1 8.2 6.2h7.6a2 2 0 0 1 1.9 1.4L19 12" />
      <circle cx="7.6" cy="14.8" r="2.6" />
      <circle cx="16.4" cy="14.8" r="2.6" />
      <path d="M10.1 14.5c.7-.5 3.1-.5 3.8 0" />
    </Svg>
  );
}

export function IconBolt(p: IconProps) {
  return (
    <Svg {...p} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h3.6l2.4-7 4 14 2.4-7H21" />
    </Svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <Svg {...p} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
      <circle cx="12" cy="14.7" r="1.2" />
      <path d="M12 15.9v2.2" />
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
