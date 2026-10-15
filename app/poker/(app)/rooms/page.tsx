import type { Metadata } from "next";
import { Suspense } from "react";
import { PokerGate } from "@/components/poker/PokerGate";
import { RoomsDashboard } from "@/components/poker/RoomsDashboard";
import { unlisted } from "@/lib/site";

export const metadata: Metadata = { title: "Your rooms", robots: unlisted };

export default function RoomsPage() {
  return (
    <PokerGate>
      <Suspense>
        <RoomsDashboard />
      </Suspense>
    </PokerGate>
  );
}
