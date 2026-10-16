"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ClipboardList, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { CopyButton } from "@/components/ui/CopyButton";
import { PanelLoader } from "@/components/ui/Loader";
import { StatusScreen } from "@/components/StatusScreen";
import { NotConnected } from "@/components/NotConnected";
import { isConfigured } from "@/lib/supabase/client";
import { buildTopics } from "@/lib/retro/topics";
import { LANES, phaseInfo, type RetroLane } from "@/lib/retro/types";
import { useRetroBoard, type ReadyBoard } from "@/lib/retro/useRetroBoard";
import { rise } from "@/lib/motion";
import { BoardHeader } from "./BoardHeader";
import { Column } from "./Column";
import { NotePreview } from "./Note";
import { PasswordGate } from "./PasswordGate";
import { PhaseSteps } from "./PhaseSteps";
import { StartRetroButton } from "../StartRetroButton";
import type { TopicHandlers } from "./Topic";

export function RetroBoard({ slug }: { slug: string }) {
  if (!isConfigured) return <NotConnected />;
  return <ConnectedBoard slug={slug} />;
}

function ConnectedBoard({ slug }: { slug: string }) {
  const { state, peers, actions } = useRetroBoard(slug);

  switch (state.kind) {
    case "loading":
      return <PanelLoader tool="retro" label="Opening the board" />;
    case "not_found":
      return (
        <StatusScreen
          seed="retro-missing"
          title="This board doesn't exist"
          actions={<Button href="/retro/boards" icon={<History />}>See all retros</Button>}
        >
          It may have been deleted, or the link is incomplete.
        </StatusScreen>
      );
    case "error":
      return <StatusScreen seed="retro-error" title="Couldn't open the board">{state.message}</StatusScreen>;
    case "locked":
      return <PasswordGate title={state.board.title} onUnlock={actions.unlock} />;
    case "ready":
      return <Board view={state.view} peers={peers} actions={actions} />;
  }
}

function Board({
  view,
  peers,
  actions,
}: {
  view: ReadyBoard;
  peers: { seed: string }[];
  actions: ReturnType<typeof useRetroBoard>["actions"];
}) {
  const router = useRouter();
  const { board, cards, hidden, me } = view;
  const phase = board.phase;
  const isModerator = me.role === "moderator";

  const [confirm, setConfirm] = useState<null | "reveal" | "delete">(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Cards uncovered by the reveal animate their text in once.
  const [seenPhase, setSeenPhase] = useState(phase);
  const [revealIds, setRevealIds] = useState<Set<string>>(() => new Set());
  if (phase !== seenPhase) {
    setSeenPhase(phase);
    if (seenPhase === "brainstorm") setRevealIds(new Set(cards.filter((c) => !c.mine).map((c) => c.id)));
  }

  const topicsByLane = useMemo(() => {
    const topics = buildTopics(cards, phase === "action_items" || phase === "done");
    const byLane = new Map<RetroLane, typeof topics>();
    for (const lane of LANES) byLane.set(lane.key, topics.filter((t) => t.lane === lane.key));
    return byLane;
  }, [cards, phase]);

  const brainstormCount = cards.filter((c) => c.lane !== "todo").length + Object.values(hidden).reduce((a, b) => a + (b ?? 0), 0);
  const canAdvance = isModerator && (phase !== "brainstorm" || brainstormCount > 0);

  const advance = async () => {
    setBusy(true);
    await actions.advance();
    setBusy(false);
    setConfirm(null);
  };

  const handlers: TopicHandlers = {
    onVote: (card) => void actions.toggleVote(card),
    onEdit: (card, body) => void actions.editCard(card, body),
    onDelete: (card) => void actions.deleteCard(card),
    onReact: (card, emoji) => void actions.react(card, emoji),
    onUnstack: (card) => void actions.ungroupCard(card),
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragId(null);
    if (!over) return;
    const card = cards.find((c) => c.id === active.id);
    if (!card) return;
    const target = String(over.id);
    if (target.startsWith("lane:")) {
      if (card.group_id) void actions.ungroupCard(card.id);
      return;
    }
    const targetCard = cards.find((c) => c.id === target);
    if (targetCard && targetCard.id !== card.id && (!card.group_id || card.group_id !== targetCard.group_id)) {
      void actions.groupCards(card.id, targetCard.id);
    }
  };

  const lanes = phase === "done" ? LANES.filter((l) => l.key === "todo") : LANES;
  const dragCard = cards.find((c) => c.id === dragId);
  const actionItems = cards.filter((c) => c.lane === "todo");

  return (
    <div className="flex min-h-screen flex-col">
      <BoardHeader
        board={board}
        isModerator={isModerator}
        peers={peers}
        canAdvance={canAdvance}
        advancing={busy}
        onAdvance={() => (phase === "brainstorm" ? setConfirm("reveal") : void advance())}
        onRename={(title) => void actions.rename(title)}
        onSetPassword={actions.setPassword}
        onDelete={() => setConfirm("delete")}
      />

      <motion.div
        {...rise(0)}
        className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-5 sm:px-7"
      >
        <PhaseSteps phase={phase} />
        <p className="text-[13px] text-text-3">{phaseInfo(phase).hint}</p>
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => setDragId(String(active.id))}
        onDragCancel={() => setDragId(null)}
        onDragEnd={onDragEnd}
      >
        <main
          className={`mx-auto grid w-full flex-1 gap-x-6 gap-y-8 px-4 pb-16 pt-5 sm:px-7 ${
            phase === "done" ? "max-w-[560px]" : "max-w-[1440px] md:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          {phase === "done" && (
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">Retro finished</div>
                <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em]">What the team will do</h2>
              </div>
              {actionItems.length > 0 && (
                <CopyButton text={actionItems.map((c) => `- ${c.body}`).join("\n")} label="Copy list" icon={<ClipboardList />} />
              )}
            </div>
          )}
          {lanes.map((lane, i) => (
            <motion.div key={lane.key} {...rise(0.06 + i * 0.06)} className="min-w-0">
              <Column
                lane={lane.key}
                label={lane.label}
                placeholder={lane.placeholder}
                phase={phase}
                open={lane.key === "todo" ? phase === "action_items" : phase === "brainstorm"}
                topics={topicsByLane.get(lane.key) ?? []}
                hidden={phase === "brainstorm" ? (hidden[lane.key] ?? 0) : 0}
                revealIds={revealIds}
                handlers={handlers}
                onAdd={(body) => actions.addCard(lane.key, body)}
              />
            </motion.div>
          ))}
        </main>
        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
          {dragCard ? <NotePreview card={dragCard} /> : null}
        </DragOverlay>
      </DndContext>

      {phase === "done" && (
        <div className="mx-auto mb-16 flex gap-3">
          <Button href="/retro/boards" variant="secondary" icon={<History />}>
            All retros
          </Button>
          <StartRetroButton size="md" label="Start another" />
        </div>
      )}

      <ConfirmDialog
        open={confirm === "reveal"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Reveal every card?"
        description="Everyone will see all cards at once. This can't be undone."
        confirmLabel="Reveal and vote"
        loading={busy}
        onConfirm={() => void advance()}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Delete this board?"
        description="All cards, votes and action items will be removed for everyone. This can't be undone."
        confirmLabel="Delete board"
        confirmVariant="danger"
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          if (await actions.deleteBoard()) router.push("/retro/boards");
          else setBusy(false);
        }}
      />
    </div>
  );
}
