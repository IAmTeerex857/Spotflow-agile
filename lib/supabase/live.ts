"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSession, supabase } from "./client";

/**
 * Runs `load` so that overlapping calls collapse: while one load is in flight,
 * further requests are remembered and served by a single follow-up load.
 */
export function useCoalescedLoad(load: () => Promise<void>) {
  const loadRef = useRef(load);
  const state = useRef({ running: false, again: false });

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  return useCallback(async () => {
    if (state.current.running) {
      state.current.again = true;
      return;
    }
    state.current.running = true;
    try {
      do {
        state.current.again = false;
        await loadRef.current();
      } while (state.current.again);
    } finally {
      state.current.running = false;
    }
  }, []);
}

type LiveOptions<P> = {
  /** Board or room id; nothing subscribes until it is known. */
  id: string | null;
  table: "retro_signals" | "poker_signals";
  column: "board_id" | "room_id";
  /** Called whenever the server reports a change (and on reconnect/focus). */
  onChange: () => void;
  /** Presence key (stable per browser) and the payload this browser shares. */
  presenceKey?: string | null;
  presence?: P;
};

/**
 * One Realtime channel per board/room: listens to its signal row and tracks
 * who is online. Returns the presence payloads of everyone connected.
 */
export function useLive<P extends Record<string, unknown>>({
  id,
  table,
  column,
  onChange,
  presenceKey,
  presence,
}: LiveOptions<P>) {
  const [peers, setPeers] = useState<P[]>([]);
  const onChangeRef = useRef(onChange);
  const presenceRef = useRef(presence);
  const channelRef = useRef<ReturnType<ReturnType<typeof supabase>["channel"]> | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Re-share presence when its payload changes (e.g. a renamed player).
  const presenceJson = JSON.stringify(presence ?? null);
  useEffect(() => {
    const payload = JSON.parse(presenceJson) as P | null;
    presenceRef.current = payload ?? undefined;
    if (payload) void channelRef.current?.track(payload);
  }, [presenceJson]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const sb = supabase();
    const channel = sb.channel(`${table}:${id}`, {
      config: { presence: { key: presenceKey ?? undefined } },
    });
    channelRef.current = channel;

    channel
      .on("postgres_changes", { event: "UPDATE", schema: "public", table, filter: `${column}=eq.${id}` }, () =>
        onChangeRef.current(),
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<P>();
        setPeers(Object.values(state).map((metas) => metas[0]).filter(Boolean));
      });

    void ensureSession().then(() => {
      if (cancelled) return;
      channel.subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        // Catch up on anything missed while connecting.
        onChangeRef.current();
        if (presenceRef.current) void channel.track(presenceRef.current);
      });
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") onChangeRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      channelRef.current = null;
      void sb.removeChannel(channel);
    };
  }, [id, table, column, presenceKey]);

  return peers;
}
