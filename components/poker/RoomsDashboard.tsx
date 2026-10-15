"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Copy, Ellipsis, LogOut, Plus, RotateCcw, Search, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { PanelLoader } from "@/components/ui/Loader";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { useToast } from "@/components/ui/Toast";
import { siteUrl } from "@/components/ui/CopyButton";
import { StatusScreen } from "@/components/StatusScreen";
import { errorMessage } from "@/lib/supabase/client";
import { useAsync } from "@/lib/useAsync";
import { formatClock, formatRelative } from "@/lib/format";
import { deckLabel } from "@/lib/poker/decks";
import { pokerApi } from "@/lib/poker/api";
import type { MyRoom, RoomInput } from "@/lib/poker/types";
import { RoomDialog } from "./RoomDialog";

type Pending =
  | { kind: "create" }
  | { kind: "edit"; roomId: string; initial: RoomInput }
  | { kind: "clear" | "delete" | "leave"; room: MyRoom };

export function RoomsDashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { data: rooms, error, reload } = useAsync(pokerApi.myRooms);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Pending | null>(() => (params.get("new") ? { kind: "create" } : null));
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rooms ?? []).filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [rooms, query]);

  /** Runs a room action with a toast on failure; reloads the list afterwards. */
  const act = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
      setPending(null);
      reload();
    }
  };

  // Settings need the full room (deck values, toggles), which the list omits.
  const openSettings = async (room: MyRoom) => {
    try {
      const view = await pokerApi.getRoom(room.slug);
      if (view.status !== "ok") throw new Error("not_found");
      const { name, deck, cards, settings } = view.room;
      setPending({ kind: "edit", roomId: room.id, initial: { name, deck, cards, settings } });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (error) return <StatusScreen seed="poker-rooms-error" title="Couldn't load your rooms">{error}</StatusScreen>;
  if (!rooms) return <PanelLoader label="Loading your rooms" />;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 sm:px-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] sm:text-[32px]">Your rooms</h1>
          <p className="mt-0.5 text-sm text-text-2">Rooms you created or joined from this browser.</p>
        </div>
        <div className="relative w-full sm:w-[260px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms"
            aria-label="Search rooms"
            className="pl-9"
          />
        </div>
        <Button icon={<Plus />} onClick={() => setPending({ kind: "create" })}>
          Create a room
        </Button>
      </div>

      {shown.length === 0 ? (
        <StatusScreen
          seed="poker-no-rooms"
          title={rooms.length ? "No matches" : "No rooms yet"}
          actions={
            rooms.length ? undefined : (
              <Button icon={<Plus />} arrow onClick={() => setPending({ kind: "create" })}>
                Create your first room
              </Button>
            )
          }
        >
          {rooms.length
            ? "Try another search."
            : "Create a room, or open a link a teammate shared. Rooms you join show up here."}
        </StatusScreen>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm-t">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_120px_100px_minmax(0,1.3fr)_70px_112px] gap-4 border-b border-border bg-surface-2 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3 lg:grid">
            <div>Room</div>
            <div>Voters</div>
            <div>Time</div>
            <div>Last used</div>
            <div>Last story</div>
            <div>Points</div>
            <div />
          </div>
          {shown.map((room, i) => (
            <motion.div
              key={room.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border px-5 py-4 text-[13.5px] last:border-b-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_120px_100px_minmax(0,1.3fr)_70px_112px] lg:px-6"
            >
              <div className="min-w-0">
                <Link
                  href={`/poker/room/${room.slug}`}
                  className="block truncate font-display text-[15.5px] font-semibold tracking-[-0.01em] text-accent hover:underline"
                >
                  {room.name}
                </Link>
                <div className="text-xs text-text-3">{deckLabel(room.deck)} deck</div>
              </div>
              <div className="hidden text-[12.5px] leading-[1.6] text-text-2 lg:block">
                {room.fastest_name ? (
                  <>
                    <div className="truncate">Fastest: {room.fastest_name} ({formatClock(room.fastest_seconds ?? 0)})</div>
                    <div className="truncate text-text-3">Slowest: {room.slowest_name} ({formatClock(room.slowest_seconds ?? 0)})</div>
                  </>
                ) : (
                  <span className="text-text-3">No finished stories yet</span>
                )}
              </div>
              <div className="mono hidden text-xs leading-[1.6] text-text-2 lg:block">
                <div>Avg {formatClock(room.avg_seconds ?? 0)}</div>
                <div className="text-text-3">Total {formatClock(room.total_seconds)}</div>
              </div>
              <div className="hidden text-text-2 lg:block">{formatRelative(room.last_used_at)}</div>
              <div className="hidden min-w-0 text-text-2 lg:block">
                <div className="truncate">{room.last_story ?? "Not started"}</div>
                <div className="text-xs text-text-3">
                  {room.completed_count} of {room.story_count} done
                </div>
              </div>
              <div className="mono hidden font-semibold lg:block">{room.total_points}</div>

              <div className="row-span-2 flex items-center justify-end gap-1 lg:row-span-1">
                {room.is_moderator && (
                  <IconButton icon={<Settings2 />} label="Room settings" onClick={() => void openSettings(room)} />
                )}
                <IconButton
                  icon={<Copy />}
                  label="Copy room link"
                  onClick={async () => {
                    await navigator.clipboard.writeText(siteUrl(`/poker/room/${room.slug}`));
                    toast.success("Room link copied");
                  }}
                />
                <Menu trigger={<IconButton icon={<Ellipsis />} label="More" />}>
                  {room.is_moderator && (
                    <>
                      <MenuItem icon={<RotateCcw size={15} />} onSelect={() => setPending({ kind: "clear", room })}>
                        Clear room
                      </MenuItem>
                      <MenuItem
                        icon={<Copy size={15} />}
                        onSelect={() =>
                          void act(async () => router.push(`/poker/room/${await pokerApi.cloneRoom(room.id)}`))
                        }
                      >
                        Clone room
                      </MenuItem>
                      <MenuSeparator />
                    </>
                  )}
                  <MenuItem icon={<LogOut size={15} />} onSelect={() => setPending({ kind: "leave", room })}>
                    Remove from my list
                  </MenuItem>
                  {room.is_owner && (
                    <MenuItem danger icon={<Trash2 size={15} />} onSelect={() => setPending({ kind: "delete", room })}>
                      Delete room
                    </MenuItem>
                  )}
                </Menu>
              </div>
              <div className="mono flex gap-3 text-[11.5px] text-text-3 lg:hidden">
                <span>{formatRelative(room.last_used_at)}</span>
                <span>
                  {room.completed_count}/{room.story_count} done
                </span>
                <span>{room.total_points} pts</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pending?.kind === "create" && (
        <RoomDialog
          open
          onOpenChange={(open) => !open && setPending(null)}
          onSubmit={async (input) => {
            try {
              const slug = await pokerApi.createRoom(input);
              router.push(`/poker/room/${slug}`);
              return true;
            } catch (e) {
              toast.error(errorMessage(e));
              return false;
            }
          }}
        />
      )}
      {pending?.kind === "edit" && (
        <RoomDialog
          open
          initial={pending.initial}
          onOpenChange={(open) => !open && setPending(null)}
          onSubmit={(input) => act(() => pokerApi.updateRoom(pending.roomId, input), "Room saved")}
        />
      )}
      <ConfirmDialog
        open={pending?.kind === "clear"}
        onOpenChange={(open) => !open && setPending(null)}
        title="Clear this room?"
        description="All stories and voting history will be deleted. The room, its deck and its settings stay."
        confirmLabel="Clear room"
        confirmVariant="danger"
        loading={busy}
        onConfirm={() =>
          pending?.kind === "clear" &&
          void act(() => pokerApi.clearRoom(pending.room.id), "Room cleared")
        }
      />
      <ConfirmDialog
        open={pending?.kind === "delete"}
        onOpenChange={(open) => !open && setPending(null)}
        title="Delete this room?"
        description="The room and its whole history will be removed for everyone. This can't be undone."
        confirmLabel="Delete room"
        confirmVariant="danger"
        loading={busy}
        onConfirm={() =>
          pending?.kind === "delete" &&
          void act(() => pokerApi.deleteRoom(pending.room.id), "Room deleted")
        }
      />
      <ConfirmDialog
        open={pending?.kind === "leave"}
        onOpenChange={(open) => !open && setPending(null)}
        title="Remove from your list?"
        description="The room stays for everyone else. Open its link again any time to rejoin."
        confirmLabel="Remove"
        loading={busy}
        onConfirm={() =>
          pending?.kind === "leave" &&
          void act(() => pokerApi.leaveRoom(pending.room.id), "Removed from your list")
        }
      />
    </div>
  );
}
