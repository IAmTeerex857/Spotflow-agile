"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Download, GripVertical, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { formatClock } from "@/lib/format";
import { cardNumber } from "@/lib/poker/decks";
import { downloadText, storiesToCsv } from "@/lib/poker/csv";
import type { Story } from "@/lib/poker/types";

type Tab = "active" | "completed" | "all";

export function StoryQueue({
  roomName,
  stories,
  currentId,
  canManage,
  onAdd,
  onSelect,
  onRetry,
  onDelete,
  onMove,
}: {
  roomName: string;
  stories: Story[];
  currentId: string | null;
  canManage: boolean;
  onAdd: () => void;
  onSelect: (story: string) => void;
  onRetry: (story: string) => void;
  onDelete: (story: string) => void;
  onMove: (story: string, position: number) => void;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const active = stories.filter((s) => s.status === "active");
  const closed = stories.filter((s) => s.status !== "active");
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "To vote", count: active.length },
    { key: "completed", label: "Done", count: closed.length },
    { key: "all", label: "All", count: stories.length },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm-t" aria-label="Stories">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
        <div role="tablist" className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex shrink-0 items-center gap-2 rounded-[9px] px-3 py-2 text-[13px] font-semibold ${
                tab === t.key ? "text-text" : "text-text-3 hover:text-text-2"
              }`}
            >
              {tab === t.key && (
                <motion.span
                  layoutId="story-tab"
                  className="absolute inset-0 rounded-[9px] border border-border bg-bg-subtle"
                  transition={{ type: "spring", stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative">{t.label}</span>
              <span className="relative rounded-full bg-surface px-1.5 text-[11px] text-text-3">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          icon={<Download />}
          disabled={!stories.length}
          onClick={() => downloadText(`${roomName.replace(/[^\w-]+/g, "-").toLowerCase()}-stories.csv`, storiesToCsv(stories))}
        >
          Export
        </Button>
        {canManage && (
          <Button size="sm" variant="soft" icon={<Plus />} onClick={onAdd}>
            Add stories
          </Button>
        )}
      </div>

      {tab === "active" ? (
        <ActiveList
          stories={active}
          currentId={currentId}
          canManage={canManage}
          onSelect={onSelect}
          onDelete={onDelete}
          onMove={onMove}
          onAdd={onAdd}
        />
      ) : (
        <ClosedTable
          stories={tab === "completed" ? closed : stories}
          currentId={currentId}
          canManage={canManage}
          onRetry={onRetry}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}

function ActiveList({
  stories,
  currentId,
  canManage,
  onSelect,
  onDelete,
  onMove,
  onAdd,
}: {
  stories: Story[];
  currentId: string | null;
  canManage: boolean;
  onSelect: (story: string) => void;
  onDelete: (story: string) => void;
  onMove: (story: string, position: number) => void;
  onAdd: () => void;
}) {
  // Reordering shows instantly; the server order takes over on the next refresh.
  const signature = stories.map((s) => `${s.id}:${s.position}`).join("|");
  const [override, setOverride] = useState<{ signature: string; ids: string[] } | null>(null);
  const ids = override?.signature === signature ? override.ids : stories.map((s) => s.id);
  const ordered = ids.map((id) => stories.find((s) => s.id === id)).filter((s): s is Story => Boolean(s));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOverride({ signature, ids: next });
    const i = next.indexOf(String(active.id));
    const before = stories.find((s) => s.id === next[i - 1])?.position;
    const after = stories.find((s) => s.id === next[i + 1])?.position;
    const position =
      before !== undefined && after !== undefined ? (before + after) / 2 : before !== undefined ? before + 1 : (after ?? 1) - 1;
    onMove(String(active.id), position);
  };

  if (!stories.length) {
    return (
      <div className="px-6 py-10 text-center text-sm text-text-3">
        Nothing left to vote on.
        {canManage && (
          <button type="button" onClick={onAdd} className="ml-1 font-semibold text-accent hover:text-accent-hover">
            Add stories
          </button>
        )}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2 p-3">
          {ordered.map((story) => (
            <SortableStory
              key={story.id}
              story={story}
              current={story.id === currentId}
              canManage={canManage}
              onSelect={() => onSelect(story.id)}
              onDelete={() => onDelete(story.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableStory({
  story,
  current,
  canManage,
  onSelect,
  onDelete,
}: {
  story: Story;
  current: boolean;
  canManage: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: story.id,
    disabled: !canManage,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 ${
        current ? "border-accent-border bg-accent-soft" : "border-border bg-surface"
      } ${isDragging ? "relative z-10 shadow-lg-t" : ""}`}
    >
      {canManage && (
        <button
          type="button"
          aria-label={`Reorder ${story.title}`}
          className="cursor-grab touch-none text-text-3 hover:text-text active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{story.title}</span>
      {current ? (
        <span className="shrink-0 rounded-full border border-accent-border bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-accent">
          Voting now
        </span>
      ) : (
        canManage && <IconButton size={30} icon={<Play />} label="Vote on this now" onClick={onSelect} />
      )}
      {canManage && <IconButton size={30} icon={<Trash2 />} label="Delete story" onClick={onDelete} />}
    </li>
  );
}

function ClosedTable({
  stories,
  currentId,
  canManage,
  onRetry,
  onDelete,
}: {
  stories: Story[];
  currentId: string | null;
  canManage: boolean;
  onRetry: (story: string) => void;
  onDelete: (story: string) => void;
}) {
  const points = stories.reduce((n, s) => n + (s.status === "completed" ? (cardNumber(s.estimate ?? "") ?? 0) : 0), 0);
  const seconds = stories.reduce((n, s) => n + s.duration_seconds, 0);
  const cols = "grid-cols-[minmax(0,1fr)_64px_76px] sm:grid-cols-[minmax(0,1fr)_90px_100px_80px]";

  if (!stories.length) return <div className="px-6 py-10 text-center text-sm text-text-3">No finished stories yet.</div>;

  return (
    <div>
      <div className={`grid ${cols} border-b border-border bg-surface-2 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-3`}>
        <div>Story</div>
        <div>Estimate</div>
        <div className="hidden sm:block">Time</div>
        <div />
      </div>
      {stories.map((s) => (
        <div key={s.id} className={`grid ${cols} items-center border-b border-border px-5 py-2.5 text-sm`}>
          <div className="truncate pr-3">
            {s.title}
            {s.id === currentId && s.status === "active" && <span className="ml-2 text-[11px] font-semibold text-accent">Voting now</span>}
          </div>
          <div className={`mono font-semibold ${s.status === "skipped" ? "text-text-3" : ""}`}>
            {s.status === "skipped" ? "Skipped" : (s.estimate ?? "--")}
          </div>
          <div className="mono hidden text-text-3 sm:block">{formatClock(s.duration_seconds)}</div>
          <div className="flex justify-end gap-1">
            {canManage && s.status !== "active" && (
              <IconButton size={30} icon={<RotateCcw />} label="Vote on this again" onClick={() => onRetry(s.id)} />
            )}
            {canManage && <IconButton size={30} icon={<Trash2 />} label="Delete story" onClick={() => onDelete(s.id)} />}
          </div>
        </div>
      ))}
      <div className={`grid ${cols} items-center bg-surface-2 px-5 py-3 text-[13px]`}>
        <div className="font-semibold">Total points</div>
        <div className="mono font-bold text-accent">{points}</div>
        <div className="mono hidden text-text-3 sm:block">{formatClock(seconds)}</div>
        <div />
      </div>
    </div>
  );
}
