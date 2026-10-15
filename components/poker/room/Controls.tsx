"use client";

import { useState } from "react";
import { BorderBeam } from "border-beam";
import { Eye, Lock, RotateCcw, SkipForward, StepForward, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/components/theme/theme";
import type { PokerPhase } from "@/lib/poker/types";
import type { Distribution } from "./Results";

export type ControlActions = {
  reveal: () => Promise<boolean>;
  finish: (estimate: string | null) => Promise<boolean>;
  clearVotes: () => Promise<boolean>;
  resetTimer: () => Promise<boolean>;
  nextStory: () => Promise<boolean>;
  skip: () => void;
};

export function StatusBanner({
  phase,
  hasStory,
  waiting,
  estimate,
}: {
  phase: PokerPhase;
  hasStory: boolean;
  waiting: number;
  estimate: string | null;
}) {
  const highlight = phase !== "voting" && hasStory;
  const text = !hasStory
    ? "Add a story to start voting"
    : phase === "voting"
      ? waiting === 0
        ? "Everyone has voted"
        : `Waiting on ${waiting} ${waiting === 1 ? "player" : "players"}`
      : phase === "revealed"
        ? "Cards are flipped"
        : `Estimate locked in: ${estimate ?? "none"}`;
  return (
    <div
      role="status"
      className={`rounded-[13px] border px-4 py-3.5 text-center font-display text-[15px] font-semibold ${
        highlight ? "border-accent-border bg-accent-soft text-accent" : "border-border bg-surface text-text"
      }`}
    >
      {text}
    </div>
  );
}

/** Facilitator buttons for the current phase. Shown to moderators only. */
export function Controls({
  phase,
  everyoneVoted,
  cards,
  results,
  actions,
}: {
  phase: PokerPhase;
  everyoneVoted: boolean;
  cards: string[];
  results: Distribution | null;
  actions: ControlActions;
}) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState<string | null>(null);

  const press = (key: string, action: () => Promise<boolean>) => async () => {
    setBusy(key);
    await action();
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface p-3 shadow-sm-t">
      {phase === "voting" && (
        <>
          <BorderBeam size="sm" colorVariant="ocean" theme={theme} active={everyoneVoted} strength={0.8}>
            <Button fullWidth icon={<Eye />} loading={busy === "reveal"} onClick={press("reveal", actions.reveal)}>
              Flip cards
            </Button>
          </BorderBeam>
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="secondary" icon={<TimerReset />} onClick={press("timer", actions.resetTimer)} aria-label="Reset timer">
              Timer
            </Button>
            <Button size="sm" variant="secondary" icon={<RotateCcw />} onClick={press("clear", actions.clearVotes)} aria-label="Clear votes">
              Clear
            </Button>
            <Button size="sm" variant="secondary" icon={<SkipForward />} onClick={actions.skip} aria-label="Skip story">
              Skip
            </Button>
          </div>
        </>
      )}

      {phase === "revealed" && (
        <>
          <LockIn cards={cards} results={results} busy={busy === "finish"} onLock={(v) => press("finish", () => actions.finish(v))()} />
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" icon={<RotateCcw />} onClick={press("clear", actions.clearVotes)}>
              Vote again
            </Button>
            <Button size="sm" variant="secondary" icon={<SkipForward />} onClick={actions.skip}>
              Skip
            </Button>
          </div>
        </>
      )}

      {phase === "finished" && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" icon={<RotateCcw />} onClick={press("clear", actions.clearVotes)}>
            Vote again
          </Button>
          <Button icon={<StepForward />} arrow loading={busy === "next"} onClick={press("next", actions.nextStory)}>
            Next story
          </Button>
        </div>
      )}
    </div>
  );
}

/** Pick the final estimate, defaulting to the most picked card. */
function LockIn({
  cards,
  results,
  busy,
  onLock,
}: {
  cards: string[];
  results: Distribution | null;
  busy: boolean;
  onLock: (value: string) => void;
}) {
  const [value, setValue] = useState(results?.[0]?.value ?? cards[0]);
  return (
    <div className="flex gap-2">
      <div className="w-[96px] shrink-0">
        <Select label="Final estimate" value={value} onValueChange={setValue} options={cards.map((c) => ({ value: c, label: c }))} />
      </div>
      <Button fullWidth icon={<Lock />} loading={busy} onClick={() => onLock(value)}>
        Lock in
      </Button>
    </div>
  );
}
