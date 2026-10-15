import type { Metadata } from "next";
import { Surface } from "@/components/Surface";

export const metadata: Metadata = {
  title: "Spotflow Poker",
  description: "Planning poker for the Spotflow team. Vote in private, reveal all at once.",
};

export default function PokerLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="poker">{children}</Surface>;
}
