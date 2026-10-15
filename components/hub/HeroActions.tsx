"use client";

import { Spade, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Metal } from "@/components/ui/Metal";

export function HeroActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Metal variant="button" preset="silver" strength={0.9} style={{ background: "var(--accent)" }}>
        <Button href="/poker" size="lg" icon={<Spade />} arrow>
          Start planning poker
        </Button>
      </Metal>
      <Button href="/retro" size="lg" variant="secondary" icon={<StickyNote />} arrow>
        Run a retro
      </Button>
    </div>
  );
}
