"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { pokerApi } from "./api";

/**
 * The player's display name, shared by every component on the page.
 * `undefined` while loading, `null` when this browser hasn't picked one yet.
 */
let current: string | null | undefined;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: string | null) {
  current = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePokerName() {
  const name = useSyncExternalStore(
    subscribe,
    () => current,
    () => undefined,
  );

  useEffect(() => {
    if (current !== undefined || loading) return;
    loading = pokerApi
      .getName()
      .then((n) => emit(n))
      .catch(() => emit(null))
      .finally(() => {
        loading = null;
      });
  }, []);

  const setName = useCallback(async (next: string) => {
    await pokerApi.setName(next);
    emit(next.trim().replace(/\s+/g, " "));
  }, []);

  return { name, setName };
}
