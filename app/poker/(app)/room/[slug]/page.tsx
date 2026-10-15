import { PokerGate } from "@/components/poker/PokerGate";
import { PokerRoom } from "@/components/poker/room/PokerRoom";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PokerGate>
      <PokerRoom slug={slug} />
    </PokerGate>
  );
}
