import type { Metadata } from "next";
import { RetroBoard } from "@/components/retro/board/RetroBoard";
import { unlisted } from "@/lib/site";

export const metadata: Metadata = { title: "Board", robots: unlisted };

export default async function RetroBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RetroBoard slug={slug} />;
}
