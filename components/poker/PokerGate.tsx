"use client";

import { NotConnected } from "@/components/NotConnected";
import { isConfigured } from "@/lib/supabase/client";
import { NameGate } from "./NameDialog";

/** Poker app pages need the database and a display name before anything else. */
export function PokerGate({ children }: { children: React.ReactNode }) {
  if (!isConfigured) return <NotConnected />;
  return <NameGate>{children}</NameGate>;
}
