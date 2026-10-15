"use client";

import { Blobatar } from "@blobatar/react";

/** Centered full-page message used for not found, errors and setup states. */
export function StatusScreen({
  seed,
  title,
  children,
  actions,
}: {
  seed: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <Blobatar name={seed} size={84} background="squircle" animate="always" />
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      {children && <div className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-text-2">{children}</div>}
      {actions && <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}