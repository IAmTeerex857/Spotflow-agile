import type { Metadata } from "next";
import { PokerGate } from "@/components/poker/PokerGate";
import { PokerRoom } from "@/components/poker/room/PokerRoom";
import { unlisted } from "@/lib/site";

export const metadata: Metadata = { title: "Room", robots: unlisted };

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PokerGate>
      <PokerRoom slug={slug} />
    </PokerGate>
  );
}
