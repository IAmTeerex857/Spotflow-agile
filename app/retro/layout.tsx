import type { Metadata, Viewport } from "next";
import { Surface } from "@/components/Surface";
import { shareTags, themeColors } from "@/lib/site";

const description =
  "Anonymous sprint retros for the Spotflow team. Write in private, reveal together, vote on what matters and leave with a plan.";

export const metadata: Metadata = {
  title: { default: "Spotflow Retro", template: "%s · Spotflow Retro" },
  description,
  ...shareTags({ title: "Spotflow Retro", description, path: "/retro" }),
};

export const viewport: Viewport = { themeColor: themeColors("#fafaf9", "#161412") };

export default function RetroLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="retro">{children}</Surface>;
}
