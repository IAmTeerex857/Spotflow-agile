"use client";

import { createContext, useContext, useState } from "react";

export type SurfaceName = "hub" | "poker" | "retro";

const SurfaceContext = createContext<HTMLElement | null>(null);

/**
 * Re-scopes the design tokens to one of the three surfaces and paints its
 * background. Overlays (dialogs, menus, tooltips) portal into this element via
 * `usePortalContainer`, so they keep the surface's palette instead of falling
 * back to the hub tokens on <body>.
 */
export function Surface({
  name,
  children,
  className = "",
}: {
  name: SurfaceName;
  children: React.ReactNode;
  className?: string;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setNode} data-surface={name} className={`min-h-screen bg-bg text-text ${className}`}>
      <SurfaceContext.Provider value={node}>{children}</SurfaceContext.Provider>
    </div>
  );
}

export function usePortalContainer() {
  return useContext(SurfaceContext) ?? undefined;
}
