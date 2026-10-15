"use client";

import { useEffect, useState } from "react";

/** Current time (ms), ticking every `interval` ms. Adjust with a server clock offset if needed. */
export function useNow(interval = 1000, offset = 0) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset), interval);
    return () => clearInterval(id);
  }, [interval, offset]);
  return now;
}
