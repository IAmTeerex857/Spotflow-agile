"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Clock, LayoutGrid, Settings2, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { CopyButton, siteUrl } from "@/components/ui/CopyButton";
import { PanelLoader } from "@/components/ui/Loader";
import { StatusScreen } from "@/components/StatusScreen";
import { formatClock } from "@/lib/format";
import { rise } from "@/lib/motion";
import { deckLabel } from "@/lib/poker/decks";
import { useRoom } from "@/lib/poker/useRoom";
import type { ReadyRoom } from "@/lib/poker/types";
import { useNow } from "@/lib/useNow";
import { RoomDialog } from "../RoomDialog";
import { StoryDialog } from "../StoryDialog";
import { Controls, StatusBanner } from "./Controls";
import { DeckCards } from "./DeckCards";
import { PlayerList } from "./PlayerList";
import { Results } from "./Results";
import { StoryQueue } from "./StoryQueue";

export function PokerRoom({ slug }: { slug: string }) {
  const { state, online, actions } = useRoom(slug);

  switch (state.kind) {
    case "loading":
      return <PanelLoader tool="poker" label="Joining the room" />;
    case "not_found":
      return (
        <StatusScreen
          seed="poker-missing"
          title="This room doesn't exist"
          actions={<Button href="/poker/rooms" icon={<LayoutGrid />}>Your rooms</Button>}
        >
          It may have been deleted, or the link is incomplete.
        </StatusScreen>
      );
    case "error":
      return <StatusScreen seed="poker-error" title="Couldn't open the room">{state.message}</StatusScreen>;
    case "ready":
      return <Room view={state.view} clockOffset={state.clockOffset} online={online} actions={actions} />;
  }
}

function Room({
  view,
  clockOffset,
  online,
  actions,
}: {
  view: ReadyRoom;
  clockOffset: number;
  online: Set<string>;
  actions: ReturnType<typeof useRoom>["actions"];
}) {
  const { room, me, participants, stories, results } = view;
  const [dialog, setDialog] = useState<null | "settings" | "stories" | "skip">(null);

  const story = stories.find((s) => s.id === room.current_story_id) ?? null;
  const players = participants.filter((p) => p.participation === "player");
  const voted = players.filter((p) => p.voted).length;
  const mine = participants.find((p) => p.is_me);
  const isPlayer = me.participation === "player";
  const canVote =
    isPlayer && Boolean(story) && (room.phase === "voting" || (room.phase === "revealed" && room.settings.allow_vote_change));

  const skip = () => (room.settings.confirm_skip ? setDialog("skip") : void actions.skipStory());

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-8">
      <motion.div {...rise(0)} className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex w-full min-w-0 items-baseline gap-3 sm:w-auto sm:flex-1">
          <h1 className="truncate font-display text-[24px] font-semibold tracking-[-0.02em] sm:text-[26px]">{room.name}</h1>
          <span className="hidden shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-text-3 sm:inline">
            {deckLabel(room.deck)} deck
          </span>
        </div>
        {me.is_moderator && (
          <Button size="sm" variant="secondary" icon={<Settings2 />} onClick={() => setDialog("settings")}>
            Settings
          </Button>
        )}
        <CopyButton text={siteUrl(`/poker/room/${room.slug}`)} label="Invite link" />
      </motion.div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <motion.section {...rise(0.06)} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm-t" aria-label="Current story">
          <div className="border-b border-border px-6 py-4 text-center">
            <div className="mono mb-1 text-[11px] uppercase tracking-[0.12em] text-text-3">
              {story ? "Now estimating" : "No story yet"}
            </div>
            <div className="font-display text-lg font-medium tracking-[-0.01em]">
              {story?.title ?? (me.is_moderator ? "Add stories to get started" : "Waiting for the moderator to add stories")}
            </div>
          </div>
          {!story ? (
            <div className="flex justify-center px-6 py-14">
              {me.is_moderator && (
                <Button onClick={() => setDialog("stories")} arrow>
                  Add stories
                </Button>
              )}
            </div>
          ) : room.phase === "voting" || !results ? (
            <div className="px-5 py-9 sm:px-7">
              <DeckCards
                cards={room.cards}
                selected={mine?.value ?? null}
                disabled={!canVote}
                onPick={(value) => void actions.vote(value)}
              />
              {!isPlayer && (
                <p className="mt-6 text-center text-[13px] text-text-3">
                  You&apos;re {me.participation === "observer" ? "observing" : "moderating"}, so you don&apos;t vote.
                </p>
              )}
            </div>
          ) : (
            <>
              <Results results={results} />
              {canVote && (
                <div className="border-t border-border px-5 pb-6 pt-5">
                  <p className="mb-4 text-center text-[13px] text-text-3">You can still change your vote.</p>
                  <DeckCards cards={room.cards} selected={mine?.value ?? null} disabled={false} onPick={(v) => void actions.vote(v)} />
                </div>
              )}
            </>
          )}
        </motion.section>

        <motion.aside {...rise(0.12)} className="flex flex-col gap-3.5">
          <StatusBanner phase={room.phase} hasStory={Boolean(story)} waiting={players.length - voted} estimate={story?.estimate ?? null} />
          {me.is_moderator && story && (
            <Controls
              key={`${story.id}:${room.phase}`}
              phase={room.phase}
              everyoneVoted={players.length > 0 && voted === players.length}
              cards={room.cards}
              results={results}
              actions={{
                reveal: actions.reveal,
                finish: actions.finish,
                clearVotes: actions.clearVotes,
                resetTimer: actions.resetTimer,
                nextStory: actions.nextStory,
                skip,
              }}
            />
          )}
          <PlayerList
            participants={participants}
            online={online}
            phase={room.phase}
            clock={<RoundClock startedAt={room.round_started_at} offset={clockOffset} running={room.phase === "voting" && Boolean(story)} countdown={room.settings.countdown ? room.settings.countdown_seconds : null} />}
            canManage={me.is_moderator}
            onRole={(user, participation, isModerator) => void actions.setRole(user, participation, isModerator)}
            onRemove={(user) => void actions.removeParticipant(user)}
          />
        </motion.aside>
      </div>

      {room.settings.allow_stories && (
        <motion.div {...rise(0.18)} className="mt-5">
          <StoryQueue
            roomName={room.name}
            stories={stories}
            currentId={room.current_story_id}
            canManage={me.is_moderator}
            onAdd={() => setDialog("stories")}
            onSelect={(id) => void actions.selectStory(id)}
            onRetry={(id) => void actions.retryStory(id)}
            onDelete={(id) => void actions.deleteStory(id)}
            onMove={(id, position) => void actions.moveStory(id, position)}
          />
        </motion.div>
      )}

      {dialog === "settings" && (
        <RoomDialog
          open
          initial={{ name: room.name, deck: room.deck, cards: room.cards, settings: room.settings }}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={actions.updateRoom}
        />
      )}
      {dialog === "stories" && (
        <StoryDialog open onOpenChange={(open) => !open && setDialog(null)} onAdd={actions.addStories} />
      )}
      <ConfirmDialog
        open={dialog === "skip"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Skip this story?"
        description="It moves to Done as skipped. You can vote on it again later."
        confirmLabel="Skip story"
        onConfirm={() => {
          setDialog(null);
          void actions.skipStory();
        }}
      />
    </div>
  );
}

/** Time spent on this round, or the countdown when the room uses one. */
function RoundClock({
  startedAt,
  offset,
  running,
  countdown,
}: {
  startedAt: string;
  offset: number;
  running: boolean;
  countdown: number | null;
}) {
  const now = useNow(1000, offset);
  if (!running) return null;
  const elapsed = Math.max(0, (now - new Date(startedAt).getTime()) / 1000);

  if (countdown !== null) {
    const left = Math.max(0, countdown - elapsed);
    return (
      <span
        className={`mono flex items-center gap-1.5 text-[13px] font-semibold ${left <= 10 ? "text-danger" : "text-accent"}`}
        aria-live="polite"
      >
        <Timer size={15} />
        {left > 0 ? formatClock(left) : "Time's up"}
      </span>
    );
  }
  return (
    <span className="mono flex items-center gap-1.5 text-[13px] font-semibold text-accent">
      <Clock size={15} />
      {formatClock(elapsed)}
    </span>
  );
}
