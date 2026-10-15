const DAY = 86_400_000;

/** "just now", "5 min ago", "3 h ago", "Yesterday", "12 Oct", "12 Oct 2025". */
export function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso);
  const diff = now - then.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < DAY && new Date(now).getDate() === then.getDate()) return `${Math.floor(diff / 3_600_000)} h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  const sameYear = new Date(now).getFullYear() === then.getFullYear();
  return then.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

/** 75 -> "01:15", 3725 -> "1:02:05". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** "1 card", "4 cards". */
export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
