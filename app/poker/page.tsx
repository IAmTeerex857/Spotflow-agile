import Link from "next/link";
import { SpotflowLockup } from "@/components/SpotflowLogo";
import { LayoutGrid, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Steps } from "@/components/Steps";
import { PokerScene } from "@/components/hero/PokerScene";
import { PokerBrand } from "@/components/poker/PokerBrand";
import { DECK_PRESETS } from "@/lib/poker/decks";

const FEATURES = [
  {
    title: "Blind, then reveal",
    body: "Everyone votes in private. Cards flip together, so the loudest voice never sets the number.",
  },
  {
    title: "Paste or import",
    body: "Drop in a list of stories or a one column CSV, and export the estimates when you are done.",
  },
  {
    title: "History that sticks",
    body: "Rooms you join are saved with their stories, timings and totals for the next planning session.",
  },
];

export default function PokerLanding() {
  return (
    <>
      <SiteHeader
        brand={<PokerBrand />}
        links={[
          { href: "#how-it-works", label: "How it works" },
          { href: "/poker/rooms", label: "Your rooms" },
        ]}
        actions={
          <span className="hidden sm:inline-flex">
            <Button href="/poker/rooms?new=1" size="sm" icon={<Plus />}>
              Create a room
            </Button>
          </span>
        }
      />

      <main>
        {/* HERO */}
        <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-6 px-4 pt-12 sm:px-8 lg:min-h-[min(calc(100vh-64px),720px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:pt-6">
          <div className="relative z-10">
            <h1 className="text-balance mb-6 font-display text-[40px] font-medium leading-[1.04] tracking-[-0.035em] sm:text-[50px] xl:text-[56px]">
              Estimate together.
              <br />
              Reveal all at once.
            </h1>
            <p className="text-pretty mb-9 max-w-[46ch] text-lg leading-relaxed text-text-2">
              Open a room, paste in your stories, and let everyone vote in private. Cards flip at the
              same moment, so nobody anchors on the first number they hear.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/poker/rooms?new=1" size="lg" icon={<Plus />} arrow>
                Create a room
              </Button>
              <Button href="/poker/rooms" size="lg" variant="secondary" icon={<LayoutGrid />} arrow>
                Your rooms
              </Button>
            </div>
          </div>
          <div className="scene-fade -mx-4 sm:mx-0 lg:-mr-10">
            <PokerScene />
          </div>
        </section>

        {/* DECKS */}
        <section className="mx-auto max-w-[1200px] px-4 pb-16 pt-4 sm:px-8">
          <p className="mb-5 text-[15px] text-text-3">
            Bring the deck your team <span className="text-text">already uses.</span>
          </p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {DECK_PRESETS.map((d) => (
              <div key={d.id} className="flex items-baseline gap-2.5 text-text-3">
                <span className="font-display text-[22px] font-semibold tracking-[-0.02em]">{d.label}</span>
                <span className="mono text-xs">{d.preview}</span>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-16 sm:px-8">
          <div className="mono mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">How it works</div>
          <h2 className="mb-8 font-display text-[28px] font-semibold tracking-[-0.03em] sm:text-[36px]">
            Three steps to a number everyone trusts
          </h2>
          <Steps
            steps={[
              { icon: "room", title: "Create a room", body: "Name it, pick a deck, and add the stories you want to size." },
              { icon: "invite", title: "Invite the team", body: "Share the link. People type their name once and they are in." },
              { icon: "vote", title: "Vote and reveal", body: "Everyone picks a card. Flip them together, talk it through, and lock in the number." },
            ]}
          />
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-8">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="bg-surface p-7">
                <div className="mono mb-4 text-xs text-accent">0{i + 1}</div>
                <div className="mb-2 font-display text-[17px] font-semibold tracking-[-0.01em]">{f.title}</div>
                <div className="text-sm leading-relaxed text-text-2">{f.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-text-3 transition-colors hover:text-text-2">
            Part of <SpotflowLockup height={15} size="sm" />
          </Link>
          <div className="mono text-xs text-text-3">agile.spotflow.one/poker</div>
        </div>
      </footer>
    </>
  );
}
