"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useDroppable } from "@dnd-kit/core";
import { CornerDownLeft } from "lucide-react";
import { IconChat, IconCheckSquare, IconFrowny, IconSmiley } from "@/components/retro/icons";
import { Spinner } from "@/components/ui/Loader";
import type { Topic as TopicModel } from "@/lib/retro/topics";
import type { RetroLane, RetroPhase } from "@/lib/retro/types";
import { GhostNote } from "./Note";
import { Topic, type TopicHandlers } from "./Topic";

const LANE_ICON: Record<RetroLane, React.ReactNode> = {
  went_well: <IconSmiley size={19} />,
  improve: <IconFrowny size={19} />,
  questions: <IconChat size={19} />,
  todo: <IconCheckSquare size={19} />,
};

export function Column({
  lane,
  label,
  placeholder,
  phase,
  open,
  topics,
  hidden,
  revealIds,
  handlers,
  onAdd,
}: {
  lane: RetroLane;
  label: string;
  placeholder: string;
  phase: RetroPhase;
  open: boolean;
  topics: TopicModel[];
  hidden: number;
  revealIds: Set<string>;
  handlers: TopicHandlers;
  onAdd: (body: string) => Promise<unknown>;
}) {
  const { setNodeRef } = useDroppable({ id: `lane:${lane}`, disabled: phase !== "group_vote" || lane === "todo" });
  const count = topics.reduce((n, t) => n + t.cards.length, 0) + hidden;

  return (
    <section ref={setNodeRef} aria-label={label} className="flex min-w-0 flex-col gap-3">
      <header className="flex items-center gap-2 px-1">
        <span className={lane === "todo" ? "text-accent" : "text-text-2"}>{LANE_ICON[lane]}</span>
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-2">{label}</h2>
        <span className="mono ml-auto rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] text-text-3">{count}</span>
      </header>

      {open ? (
        <Composer placeholder={placeholder} onAdd={onAdd} />
      ) : (
        phase !== "done" && (
          <div className="rounded-[12px] border border-dashed border-border px-3.5 py-2.5 text-[13px] text-text-3">
            {placeholder}
          </div>
        )
      )}

      <div className="flex flex-col gap-3 pb-1 md:min-h-[110px] md:pb-6">
        <AnimatePresence initial={false}>
          {topics.map((topic) => (
            <Topic
              key={topic.key}
              topic={topic}
              phase={phase}
              laneOpen={open}
              revealIds={revealIds}
              handlers={handlers}
            />
          ))}
          {Array.from({ length: hidden }, (_, i) => (
            <GhostNote key={`ghost-${i}`} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Composer({ placeholder, onAdd }: { placeholder: string; onAdd: (body: string) => Promise<unknown> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const body = value.trim();
    if (!body || busy) return;
    setBusy(true);
    setValue("");
    await onAdd(body);
    setBusy(false);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        maxLength={500}
        rows={Math.min(6, Math.max(2, value.split("\n").length))}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        className="w-full resize-none rounded-[12px] border border-border-strong bg-surface px-3.5 py-2.5 pr-11 text-sm leading-relaxed text-text shadow-sm-t outline-none transition-colors placeholder:text-text-3 focus:border-accent"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={!value.trim() || busy}
        aria-label="Add card"
        className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-fg transition-opacity disabled:opacity-30"
      >
        {busy ? <Spinner size={12} /> : <CornerDownLeft size={14} strokeWidth={2.4} />}
      </button>
    </div>
  );
}
