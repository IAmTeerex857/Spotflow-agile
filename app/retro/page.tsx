import Link from "next/link";
import { SpotflowLockup } from "@/components/SpotflowLogo";
import { History } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/Button";
import { BlobSteps } from "@/components/BlobSteps";
import { RetroScene } from "@/components/hero/RetroScene";
import { RetroBrand } from "@/components/retro/RetroBrand";
import { StartRetroButton } from "@/components/retro/StartRetroButton";
import { IconBolt, IconIncognito, IconLock, IconPhone } from "@/components/retro/icons";

const FEATURES = [
  { icon: <IconIncognito size={19} />, title: "Anonymous", body: "No names, no emails, no accounts. Nobody can tell who wrote what." },
  { icon: <IconBolt size={19} />, title: "Live", body: "Cards, votes and reactions show up for everyone the moment they happen." },
  { icon: <IconLock size={19} />, title: "Private if you want", body: "Add a password and only people who know it can open the board." },
  { icon: <IconPhone size={19} />, title: "Works on any screen", body: "Join from a laptop or a phone. There is nothing to install." },
];

export default function RetroLanding() {
  return (
    <>
      <SiteHeader
        brand={<RetroBrand />}
        links={[
          { href: "#how-it-works", label: "How it works" },
          { href: "/retro/boards", label: "Past retros" },
        ]}
      />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 70% at 78% 45%, var(--accent-soft), transparent 70%)",
            }}
          />
          <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-6 px-4 pb-10 pt-12 sm:px-8 lg:min-h-[min(calc(100vh-64px),760px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-10">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-border bg-surface px-3 py-1 text-xs font-semibold text-accent shadow-sm-t">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Anonymous sprint retros
              </div>
              <h1 className="text-balance mb-6 text-[40px] font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-[52px] xl:text-[58px]">
                Reflect honestly.
                <br />
                <span className="text-accent">Leave with a plan.</span>
              </h1>
              <p className="text-pretty mb-9 max-w-[44ch] text-lg leading-relaxed text-text-2">
                Everyone writes in private. When the team is ready, every card is revealed at once.
                Group the ideas, vote on what matters, and agree on what to do next.
              </p>
              <div className="flex flex-wrap gap-3">
                <StartRetroButton />
                <Button href="/retro/boards" variant="secondary" size="lg" icon={<History />} arrow>
                  Past retros
                </Button>
              </div>
            </div>
            <div className="scene-fade relative -mx-4 sm:mx-0 lg:-mr-16">
              <RetroScene />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-20 sm:px-8">
          <div className="mono mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">How it works</div>
          <h2 className="mb-8 text-[28px] font-extrabold tracking-[-0.03em] sm:text-[36px]">Four steps, one board</h2>
          <BlobSteps
            steps={[
              { seed: "retro-step-write", title: "Write", body: "Add cards to three columns. Only you can read yours until the reveal." },
              { seed: "retro-step-reveal", title: "Reveal, group and vote", body: "Every card appears at once. Stack similar ones and vote for what to discuss." },
              { seed: "retro-step-act", title: "Agree on actions", body: "Talk through the top topics and write down what the team will do." },
              { seed: "retro-step-done", title: "Done", body: "The board ends with a clean list of action items. Nothing else to click." },
            ]}
          />
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm-t transition-all duration-200 hover:-translate-y-1 hover:border-accent-border hover:shadow-md-t"
              >
                <div className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border border-accent-border bg-accent-soft text-accent">
                  {f.icon}
                </div>
                <div className="mb-2 text-base font-bold tracking-[-0.01em]">{f.title}</div>
                <div className="text-[13.5px] leading-relaxed text-text-2">{f.body}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-text-3 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-text-3 transition-colors hover:text-text-2">
            Part of <SpotflowLockup height={15} size="sm" />
          </Link>
          <div className="mono">agile.spotflow.one/retro</div>
        </div>
      </footer>
    </>
  );
}
