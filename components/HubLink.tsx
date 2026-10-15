import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Cross-surface "back to Hub" affordance. Uses surface-scoped tokens
 * (border/surface/text) so it adopts each tool's theme automatically.
 * Collapses to an icon-only button on mobile to save nav width.
 */
export function HubLink({ label = "Agile Tools" }: { label?: string }) {
  return (
    <Link
      href="/"
      aria-label="Back to Agile Tools hub"
      className="flex shrink-0 items-center gap-[6px] rounded-full border border-border bg-surface px-[9px] py-[5px] text-[12.5px] font-medium text-text-2 transition-colors hover:border-border-strong hover:text-text sm:px-[11px]"
    >
      <ArrowLeft size={14} strokeWidth={2} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
