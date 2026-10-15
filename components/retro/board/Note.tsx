"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDraggable } from "@dnd-kit/core";
import { Pencil, Trash2, Undo2 } from "lucide-react";
import { RevealText } from "@/components/ui/Loader";
import type { ReactionEmoji, RetroCard } from "@/lib/retro/types";
import { ReactionPicker } from "./ReactionPicker";

const TILTS = ["-0.7deg", "0.5deg", "0.25deg", "-0.4deg", "0.8deg", "-0.2deg"];

export type NoteCapabilities = {
  editable: boolean;
  draggable: boolean;
  reactable: boolean;
  /** Animate the text in, for cards uncovered by the reveal. */
  reveal: boolean;
  /** Shown on stacked cards so they can be pulled back out. */
  unstackable: boolean;
};

export function Note({
  card,
  can,
  footer,
  onEdit,
  onDelete,
  onReact,
  onUnstack,
}: {
  card: RetroCard;
  can: NoteCapabilities;
  footer?: React.ReactNode;
  onEdit: (body: string) => void;
  onDelete: () => void;
  onReact: (emoji: ReactionEmoji) => void;
  onUnstack: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: !can.draggable,
  });

  const chips = (Object.entries(card.reactions) as [ReactionEmoji, number][]).filter(([, n]) => n > 0);

  return (
    <motion.div
      ref={setNodeRef}
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      style={{ rotate: TILTS[card.seq % TILTS.length] }}
      className={`note-shape group relative border bg-paper px-4 pb-3 pt-3.5 shadow-note-t ${
        can.draggable ? "cursor-grab touch-none active:cursor-grabbing" : ""
      } ${card.mine ? "border-accent-border" : "border-border"}`}
      {...(can.draggable ? { ...attributes, ...listeners } : {})}
    >
      {editing ? (
        <EditBox
          initial={card.body}
          onCancel={() => setEditing(false)}
          onSave={(body) => {
            setEditing(false);
            if (body !== card.body) onEdit(body);
          }}
        />
      ) : (
        <div className="whitespace-pre-wrap break-words pr-6 text-[14.5px] leading-[1.5] text-text">
          {can.reveal ? <RevealText text={card.body} /> : card.body}
        </div>
      )}

      {!editing && (can.editable || can.unstackable) && (
        <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {can.unstackable && (
            <NoteAction label="Take out of stack" onClick={onUnstack}>
              <Undo2 size={13} />
            </NoteAction>
          )}
          {can.editable && (
            <>
              <NoteAction label="Edit card" onClick={() => setEditing(true)}>
                <Pencil size={13} />
              </NoteAction>
              <NoteAction label="Delete card" onClick={onDelete}>
                <Trash2 size={13} />
              </NoteAction>
            </>
          )}
        </div>
      )}

      <div className="mt-2.5 flex min-h-8 items-center gap-1.5">
        <span className="mono mr-auto text-[11px] text-text-3">#{card.seq}</span>
        <AnimatePresence initial={false}>
          {chips.map(([emoji, n]) => (
            <motion.button
              key={emoji}
              type="button"
              layout
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 25 }}
              disabled={!can.reactable}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onReact(emoji)}
              aria-label={`${emoji} ${n}`}
              className={`flex select-none items-center gap-1 rounded-full border px-2 py-[3px] text-[12px] leading-none ${
                card.my_reaction === emoji ? "border-accent-border bg-accent-soft" : "border-border bg-bg-subtle"
              }`}
            >
              <span>{emoji}</span>
              <span className="mono font-semibold text-text-2">{n}</span>
            </motion.button>
          ))}
        </AnimatePresence>
        {can.reactable && <ReactionPicker mine={card.my_reaction} onPick={onReact} />}
        {footer}
      </div>
    </motion.div>
  );
}

function NoteAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md text-text-3 transition-colors hover:bg-bg-subtle hover:text-text"
    >
      {children}
    </button>
  );
}

function EditBox({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (body: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <textarea
      autoFocus
      value={value}
      maxLength={500}
      rows={Math.min(8, Math.max(2, value.split("\n").length))}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => (value.trim() ? onSave(value.trim()) : onCancel())}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (value.trim()) onSave(value.trim());
        }
      }}
      className="w-full resize-none rounded-md border border-accent-border bg-surface px-2 py-1.5 text-[14.5px] leading-[1.5] outline-none"
    />
  );
}

/** Placeholder for a card someone else wrote during Brainstorm. */
export function GhostNote({ index }: { index: number }) {
  const widths = [
    ["78%", "52%"],
    ["64%", "70%"],
    ["84%", "40%"],
  ][index % 3];
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      aria-label="A teammate's card, hidden until the reveal"
      className="note-shape relative overflow-hidden border border-border bg-paper px-4 py-4 shadow-note-t"
      style={{ rotate: TILTS[(index + 2) % TILTS.length] }}
    >
      <div className="flex flex-col gap-2 blur-[2.5px]">
        {widths.map((w, i) => (
          <div key={i} className="h-2.5 rounded bg-border-strong" style={{ width: w }} />
        ))}
      </div>
      <motion.div
        aria-hidden
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-surface/70 to-transparent"
        initial={{ x: "-120%" }}
        animate={{ x: "260%" }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 + index * 0.3 }}
      />
    </motion.div>
  );
}

/** Static copy of a note that follows the pointer while dragging. */
export function NotePreview({ card }: { card: RetroCard }) {
  return (
    <div className="note-shape w-[min(300px,80vw)] rotate-2 cursor-grabbing border border-accent-border bg-paper px-4 py-3.5 shadow-lg-t">
      <div className="line-clamp-4 whitespace-pre-wrap break-words text-[14.5px] leading-[1.5] text-text">{card.body}</div>
      <div className="mono mt-2 text-[11px] text-text-3">#{card.seq}</div>
    </div>
  );
}
