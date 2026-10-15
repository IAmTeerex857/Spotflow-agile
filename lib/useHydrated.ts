import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during SSR and hydration, true afterwards. For browser-only widgets. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
