import Link from "next/link";
import { HubLink } from "@/components/HubLink";
import { PokerMark } from "./PokerMark";

export function PokerBrand({ href = "/poker" }: { href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <HubLink />
      <span className="h-5 w-px bg-border" />
      <Link href={href} className="flex items-center gap-2.5">
        <PokerMark size={30} />
        <span className="font-display text-base font-semibold tracking-[-0.01em]">Spotflow Poker</span>
      </Link>
    </div>
  );
}
