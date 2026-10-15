"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "@/lib/supabase/client";
import { useCoalescedLoad, useLive } from "@/lib/supabase/live";
import { useToast } from "@/components/ui/Toast";
import { pokerApi } from "./api";
import type { Participation, ReadyRoom, RoomInput } from "./types";

export type RoomState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "ready"; view: ReadyRoom; clockOffset: number }
  | { kind: "error"; message: string };

type Peer = { user_id: string };

/**
 * Live state of one poker room for a browser that already has a name. Joins
 * the room on first load and refetches whenever the room's signal fires.
 */
export function useRoom(slug: string) {
  const toast = useToast();
  const [state, setState] = useState<RoomState>({ kind: "loading" });

  const fetchRoom = useCallback(async () => {
    try {
      let view = await pokerApi.getRoom(slug);
      if (view.status === "join_required") {
        await pokerApi.joinRoom(slug);
        view = await pokerApi.getRoom(slug);
      }
      if (view.status === "ok") {
        // Server time minus local time, so countdowns agree across devices.
        const clockOffset = new Date(view.now).getTime() - Date.now();
        setState({ kind: "ready", view, clockOffset });
      } else {
        setState({ kind: "not_found" });
      }
    } catch (e) {
      setState((prev) => (prev.kind === "ready" ? prev : { kind: "error", message: errorMessage(e) }));
    }
  }, [slug]);

  const refresh = useCoalescedLoad(fetchRoom);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const view = state.kind === "ready" ? state.view : null;
  const peers = useLive<Peer>({
    id: view?.room.id ?? null,
    table: "poker_signals",
    column: "room_id",
    onChange: refresh,
    presenceKey: view?.me.user_id ?? null,
    presence: view ? { user_id: view.me.user_id } : undefined,
  });
  const online = useMemo(() => new Set(peers.map((p) => p.user_id)), [peers]);

  /** Runs an action, refreshes, and reports success. Failures show a toast. */
  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
        return true;
      } catch (e) {
        toast.error(errorMessage(e));
        return false;
      } finally {
        await refresh();
      }
    },
    [refresh, toast],
  );

  const actions = useMemo(() => {
    const id = () => view?.room.id ?? "";
    return {
      vote: (value: string | null) => run(() => pokerApi.vote(id(), value)),
      reveal: () => run(() => pokerApi.reveal(id())),
      finish: (estimate: string | null) => run(() => pokerApi.finish(id(), estimate)),
      clearVotes: () => run(() => pokerApi.clearVotes(id())),
      resetTimer: () => run(() => pokerApi.resetTimer(id())),
      nextStory: () => run(() => pokerApi.nextStory(id())),
      skipStory: () => run(() => pokerApi.skipStory(id())),
      addStories: (titles: string[]) => run(() => pokerApi.addStories(id(), titles)),
      selectStory: (story: string) => run(() => pokerApi.selectStory(story)),
      retryStory: (story: string) => run(() => pokerApi.retryStory(story)),
      deleteStory: (story: string) => run(() => pokerApi.deleteStory(story)),
      moveStory: (story: string, position: number) => run(() => pokerApi.moveStory(story, position)),
      setRole: (user: string, participation: Participation, isModerator: boolean) =>
        run(() => pokerApi.setRole(id(), user, participation, isModerator)),
      removeParticipant: (user: string) => run(() => pokerApi.removeParticipant(id(), user)),
      updateRoom: (input: RoomInput) => run(() => pokerApi.updateRoom(id(), input)),
    };
  }, [run, view]);

  return { state, online, actions };
}
