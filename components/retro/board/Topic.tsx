"use client";

import { AnimatePresence, motion } from "motion/react";
import { useDroppable } from "@dnd-kit/core";
import { ThumbsUp } from "lucide-react";
import { spring } from "@/components/ui/Button";
import type { Topic as TopicModel } from "@/lib/retro/topics";
import type { ReactionEmoji, RetroPhase } from "@/lib/retro/types";
import { Note } from "./Note";

export type TopicHandlers = {
  onVote: (card: string) => void;
  onEdit: (card: string, body: string) => void;
  onDelete: (card: string) => void;
  onReact: (card: string, emoji: ReactionEmoji) => void;
  onUnstack: (card: string) => void;
};

/** A single card or a stack of grouped cards, voted on as one topic. */
export function Topic({
  topic,
  phase,
  laneOpen,
  revealIds,
  handlers,
}: {
  topic: TopicModel;
  phase: RetroPhase;
  laneOpen: boolean;
  revealIds: Set<string>;
  handlers: TopicHandlers;
}) {
  const grouping = phase === "group_vote" && topic.lane !== "todo";
  const { setNodeRef, isOver, active } = useDroppable({ id: topic.lead.id, disabled: !grouping });
  const showVotes = topic.lane !== "todo" && (phase === "group_vote" || phase === "action_items");
  const stacked = topic.cards.length > 1;
  const dropTarget = isOver && active && !topic.cards.some((c) => c.id === active.id);

  const vote = showVotes ? (
    <VoteButton
      count={topic.votes}
      voted={topic.voted}
      disabled={phase !== "group_vote"}
      onClick={() => handlers.onVote(topic.lead.id)}
    />
  ) : null;

  const notes = topic.cards.map((card) => (
    <Note
      key={card.id}
      card={card}
      can={{
        editable: card.mine && laneOpen,
        draggable: grouping,
        reactable: phase === "group_vote" || phase === "action_items",
        reveal: revealIds.has(card.id),
        unstackable: stacked && grouping,
      }}
      footer={stacked ? undefined : vote}
      onEdit={(body) => handlers.onEdit(card.id, body)}
      onDelete={() => handlers.onDelete(card.id)}
      onReact={(emoji) => handlers.onReact(card.id, emoji)}
      onUnstack={() => handlers.onUnstack(card.id)}
    />
  ));

  return (
    <motion.div
      ref={setNodeRef}
      layout="position"
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`relative rounded-[14px] transition-shadow ${dropTarget ? "ring-2 ring-accent ring-offset-4 ring-offset-bg" : ""}`}
    >
      {stacked ? (
        <div className="rounded-[14px] border border-accent-border bg-accent-soft/60 p-2">
          <div className="flex flex-col gap-2">{notes}</div>
          <div className="flex items-center justify-between px-2 pb-0.5 pt-2.5">
            <span className="text-xs font-semibold text-accent">{topic.cards.length} cards stacked</span>
            {vote}
          </div>
        </div>
      ) : (
        notes
      )}
    </motion.div>
  );
}

function VoteButton({
  count,
  voted,
  disabled,
  onClick,
}: {
  count: number;
  voted: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={voted}
      aria-label={voted ? `Remove your vote (${count} votes)` : `Vote for this (${count} votes)`}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      transition={spring}
      className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-bold transition-colors disabled:cursor-default ${
        voted
          ? "border-accent bg-accent text-accent-fg"
          : "border-border bg-surface text-text-2 enabled:hover:border-accent-border enabled:hover:text-accent"
      }`}
    >
      <motion.span animate={voted ? { rotate: [0, -18, 0], scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.35 }}>
        <ThumbsUp size={13} strokeWidth={2.4} />
      </motion.span>
      <span className="relative inline-flex h-4 min-w-[1ch] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            className="mono"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={spring}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
