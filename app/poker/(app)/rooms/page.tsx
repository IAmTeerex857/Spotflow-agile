import type { Metadata } from "next";
import { Suspense } from "react";
import { PokerGate } from "@/components/poker/PokerGate";
import { RoomsDashboard } from "@/components/poker/RoomsDashboard";

export const metadata: Metadata = { title: "Your rooms · Spotflow Poker" };

export default function RoomsPage() {
  return (
    <PokerGate>
      <Suspense>
        <RoomsDashboard />
      </Suspense>
    </PokerGate>
  );
}
