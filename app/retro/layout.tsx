import type { Metadata } from "next";
import { Surface } from "@/components/Surface";

export const metadata: Metadata = {
  title: "Spotflow Retro",
  description: "Anonymous sprint retros. Write in private, reveal together, leave with a plan.",
};

export default function RetroLayout({ children }: { children: React.ReactNode }) {
  return <Surface name="retro">{children}</Surface>;
}
