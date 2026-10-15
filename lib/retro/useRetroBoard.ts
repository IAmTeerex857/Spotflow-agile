"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "@/lib/supabase/client";
import { useCoalescedLoad, useLive } from "@/lib/supabase/live";
import { useToast } from "@/components/ui/Toast";
import { retroApi } from "./api";
import type { ReactionEmoji, RetroBoardSummary, RetroBoardView, RetroJoinResult, RetroLane } from "./types";

export type ReadyBoard = Extract<RetroBoardView, { status: "ok" }>;

export type BoardState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "locked"; board: RetroBoardSummary }
  | { kind: "ready"; view: ReadyBoard }
  | { kind: "error"; message: string };

type Peer = { seed: string };

/**
 * Live state of one retro board. The server decides what this browser may
 * see; this hook just keeps the latest view, refetching whenever the board's
 * Realtime signal fires.
 */
export function useRetroBoard(slug: string) {
  const toast = useToast();
  const [state, setState] = useState<BoardState>({ kind: "loading" });

  const fetchBoard = useCallback(async () => {
    try {
      let view = await retroApi.getBoard(slug);
      // Open boards are joined automatically; locked ones wait for a password.
      if (view.status === "join_required" && !view.board.has_password) {
        if ((await retroApi.joinBoard(slug)) === "ok") view = await retroApi.getBoard(slug);
      }
      setState(
        view.status === "ok"
          ? { kind: "ready", view }
          : view.status === "join_required"
            ? { kind: "locked", board: view.board }
            : { kind: "not_found" },
      );
    } catch (e) {
      // Keep showing the last good board if a background refresh fails.
      setState((prev) => (prev.kind === "ready" ? prev : { kind: "error", message: errorMessage(e) }));
    }
  }, [slug]);

  const refresh = useCoalescedLoad(fetchBoard);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const view = state.kind === "ready" ? state.view : null;
  const peers = useLive<Peer>({
    id: view?.board.id ?? null,
    table: "retro_signals",
    column: "board_id",
    onChange: refresh,
    presenceKey: view?.me.avatar_seed ?? null,
    presence: view ? { seed: view.me.avatar_seed } : undefined,
  });

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
    const id = () => view?.board.id ?? "";
    return {
      unlock: async (password: string): Promise<RetroJoinResult> => {
        try {
          const result = await retroApi.joinBoard(slug, password);
          if (result === "ok") await refresh();
          return result;
        } catch (e) {
          toast.error(errorMessage(e));
          return "not_found";
        }
      },
      addCard: (lane: RetroLane, body: string) => run(() => retroApi.addCard(id(), lane, body)),
      editCard: (card: string, body: string) => run(() => retroApi.editCard(card, body)),
      deleteCard: (card: string) => run(() => retroApi.deleteCard(card)),
      advance: () => (view ? run(() => retroApi.advance(id(), view.board.phase)) : Promise.resolve(false)),
      toggleVote: (card: string) => run(() => retroApi.toggleVote(card)),
      groupCards: (card: string, target: string) => run(() => retroApi.groupCards(card, target)),
      ungroupCard: (card: string) => run(() => retroApi.ungroupCard(card)),
      react: (card: string, emoji: ReactionEmoji) => run(() => retroApi.react(card, emoji)),
      rename: (title: string) => run(() => retroApi.renameBoard(id(), title)),
      setPassword: (password: string | null) => run(() => retroApi.setPassword(id(), password)),
      // No refresh afterwards: the caller navigates away instead.
      deleteBoard: async () => {
        try {
          await retroApi.deleteBoard(id());
          return true;
        } catch (e) {
          toast.error(errorMessage(e));
          return false;
        }
      },
    };
  }, [refresh, run, slug, toast, view]);

  return { state, peers, actions };
}
