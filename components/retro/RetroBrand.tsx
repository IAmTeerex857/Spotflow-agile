import Link from "next/link";
import { HubLink } from "@/components/HubLink";
import { RetroMark } from "./icons";

export function RetroBrand() {
  return (
    <div className="flex items-center gap-3">
      <HubLink />
      <span className="h-5 w-px bg-border" />
      <Link href="/retro" className="flex items-center gap-2.5">
        <RetroMark size={30} />
        <span className="text-base font-extrabold tracking-[-0.01em]">Spotflow Retro</span>
      </Link>
    </div>
  );
}
