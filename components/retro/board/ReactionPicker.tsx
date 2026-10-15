"use client";

import { useEffect, useRef, useState } from "react";
import { Liquid } from "liquid-gooey";
import { SmilePlus, X } from "lucide-react";
import { REACTION_EMOJIS, type ReactionEmoji } from "@/lib/retro/types";

const STEP = 34;

/**
 * A round button that splits into emoji droplets (liquid-gooey "morph").
 * The droplets fan out to the left so the picker never leaves its card.
 */
export function ReactionPicker({
  mine,
  onPick,
  disabled,
}: {
  mine: ReactionEmoji | null;
  onPick: (emoji: ReactionEmoji) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="h-8 w-8" onPointerDown={(e) => e.stopPropagation()}>
      {/* Every item sits in the same grid cell, so all droplets start from the button. */}
      <Liquid
        blur={6}
        contrast={16}
        fill="var(--surface)"
        shadow="0 1px 2px rgba(0,0,0,0.14), 0 6px 16px rgba(0,0,0,0.12)"
        filterPadding={REACTION_EMOJIS.length * STEP + 24}
        className="grid h-8 w-8 [&>div]:[grid-area:1/1]"
      >
        {REACTION_EMOJIS.map((emoji, i) => (
          <Liquid.Item
            key={emoji}
            x={open ? -(REACTION_EMOJIS.length - i) * STEP : 0}
            transition="bouncy"
            delay={open ? (REACTION_EMOJIS.length - i) * 18 : 0}
          >
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              aria-label={`React with ${emoji}`}
              onClick={() => {
                onPick(emoji);
                setOpen(false);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] leading-none transition-opacity ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              } ${mine === emoji ? "bg-accent-soft" : ""}`}
            >
              {emoji}
            </button>
          </Liquid.Item>
        ))}
        <Liquid.Item>
          <button
            type="button"
            disabled={disabled}
            aria-expanded={open}
            aria-label={open ? "Close reactions" : "Add a reaction"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-3 transition-colors hover:text-text disabled:opacity-40"
          >
            {open ? <X size={15} strokeWidth={2.2} /> : <SmilePlus size={16} strokeWidth={2} />}
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  );
}
