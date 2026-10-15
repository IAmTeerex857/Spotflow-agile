import type { Metadata, Viewport } from "next";
import { Surface } from "@/components/Surface";
import { shareTags, themeColors } from "@/lib/site";

const description =
  "Planning poker for the Spotflow team. Everyone votes in private, then the cards flip together, so nobody anchors on the first number they hear.";

export const metadata: Metadata = {
  title: { default: "Spotflow Poker", template: "%s · Spotflow Poker" },
  description,
  ...shareTags({ title: "Spotflow Poker", description, path: "/poker" }),
};

export const viewport: Viewport = { themeColor: themeColors("#f6f3ee", "#17140f") };

export default function PokerLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="poker">{children}</Surface>;
}
