"use client";

import { themeBootScript } from "./theme";

/**
 * Executes during HTML parsing on a hard load (server renders it as
 * JavaScript) and is inert on the client (rendered as text/plain), which keeps
 * React from warning about script tags during hydration.
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeBootScript }}
    />
  );
}
