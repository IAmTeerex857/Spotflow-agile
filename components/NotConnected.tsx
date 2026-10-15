"use client";

import { StatusScreen } from "./StatusScreen";

/** Shown when the Supabase environment variables are missing. */
export function NotConnected() {
  return (
    <StatusScreen seed="not-connected" title="Not connected yet">
      This app needs its database. Add <span className="mono text-text">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
      <span className="mono text-text">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> to{" "}
      <span className="mono text-text">.env.local</span>, then restart the app.
    </StatusScreen>
  );
}
