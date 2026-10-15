"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/supabase/client";

/**
 * Loads data once on mount and again whenever `reload` is called. `fetcher`
 * must be stable (a module-level function), or it will refetch every render.
 */
export function useAsync<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => active && setState({ data }))
      .catch((e) => active && setState((s) => ({ ...s, error: errorMessage(e) })));
    return () => {
      active = false;
    };
  }, [fetcher, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: state.data, error: state.error, reload };
}
