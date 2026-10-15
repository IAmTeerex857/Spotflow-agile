import Link from "next/link";
import { Surface } from "@/components/Surface";
import { SiteHeader } from "@/components/SiteHeader";
import { SuiteMark } from "@/components/hub/SuiteMark";
import { HeroActions } from "@/components/hub/HeroActions";
import { ToolCard } from "@/components/hub/ToolCard";
import { PokerPreview, RetroPreview } from "@/components/hub/ToolPreviews";
import { HubScene } from "@/components/hero/HubScene";
import { BlobSteps } from "@/components/BlobSteps";
import { PokerMark } from "@/components/poker/PokerMark";
import { RetroMark } from "@/components/retro/icons";

export default function HubLanding() {
  return (
    <Surface name="hub">
      <SiteHeader
        brand={
          <Link href="/" className="flex items-center gap-2.5">
            <SuiteMark size={30} />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Spotflow Agile Tools</span>
          </Link>
        }
        links={[
          { href: "/poker", label: "Poker" },
          { href: "/retro", label: "Retro" },
          { href: "#how-it-works", label: "How it works" },
        ]}
      />

      <main>
        {/* HERO */}
        <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-10 px-4 pb-16 pt-10 sm:px-8 lg:min-h-[min(calc(100vh-64px),780px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:py-6">
          <div className="flex flex-col justify-end pb-2 lg:pb-14">
            <div className="mono mb-6 text-xs uppercase tracking-[0.16em] text-text-3">
              For the Spotflow team
            </div>
            <h1 className="text-balance mb-6 text-[42px] font-semibold leading-[1] tracking-[-0.045em] sm:text-[52px] xl:text-[60px]">
              Estimate together.
              <br />
              Reflect honestly.
            </h1>
            <p className="text-pretty mb-9 max-w-[46ch] text-lg leading-relaxed text-text-2">
              Planning poker and sprint retros in one place. Open a session, share the link, and the
              team is in. Nobody has to sign up.
            </p>
            <HeroActions />
          </div>

          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-[28px] bg-panel p-2 sm:min-h-[520px] lg:p-4">
            <HubScene />
          </div>
        </section>

        {/* TOOLS */}
        <section className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-8">
          <SectionHeading eyebrow="The tools" title="Two rituals, one home" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ToolCard
              href="/poker"
              accent="poker"
              name="Poker"
              kicker="SPRINT PLANNING"
              description="Size stories without anyone anchoring the number. Everyone picks a card in private, then all cards flip at once."
              meta="Enter your name and you're in. Rooms you join are saved for next time."
              cta="Open Poker"
              logo={
                <span data-surface="poker" className="contents">
                  <PokerMark size={34} />
                </span>
              }
              preview={<PokerPreview />}
            />
            <ToolCard
              href="/retro"
              accent="retro"
              name="Retro"
              kicker="SPRINT REVIEW"
              description="Look back on the sprint with no names attached. Write in private, reveal together, vote, and leave with action items."
              meta="Fully anonymous. Add a password if a board should stay private."
              cta="Open Retro"
              logo={
                <span data-surface="retro" className="contents">
                  <RetroMark size={34} />
                </span>
              }
              preview={<RetroPreview />}
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 pb-24 sm:px-8">
          <SectionHeading eyebrow="How it works" title="From link to decision in minutes" />
          <BlobSteps
            steps={[
              {
                seed: "hub-step-open",
                title: "Open a session",
                body: "Pick Poker or Retro and start one with a single click. There is nothing to set up first.",
              },
              {
                seed: "hub-step-share",
                title: "Share the link",
                body: "Drop it in your team chat. Poker asks for a name. Retro asks for nothing at all.",
              },
              {
                seed: "hub-step-decide",
                title: "Decide together",
                body: "Votes and cards stay hidden until everyone reveals at the same moment, so nobody follows the crowd.",
              },
            ]}
          />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <SuiteMark size={22} radius={6} />
            <span className="text-[13px] text-text-2">Spotflow Agile Tools</span>
          </div>
          <span className="mono text-xs text-text-3">agile.spotflow.one</span>
        </div>
      </footer>
    </Surface>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <div className="mono mb-3 text-xs uppercase tracking-[0.16em] text-text-3">{eyebrow}</div>
      <h2 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-[36px]">{title}</h2>
    </div>
  );
}
