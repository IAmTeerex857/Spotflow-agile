"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Crown, Star, UserMinus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Menu, MenuCheckItem, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";
import { formatClock } from "@/lib/format";
import type { Participant, Participation, PokerPhase } from "@/lib/poker/types";

export function PlayerList({
  participants,
  online,
  phase,
  clock,
  canManage,
  onRole,
  onRemove,
}: {
  participants: Participant[];
  online: Set<string>;
  phase: PokerPhase;
  clock: React.ReactNode;
  canManage: boolean;
  onRole: (user: string, participation: Participation, isModerator: boolean) => void;
  onRemove: (user: string) => void;
}) {
  return (
    <section className="rounded-[14px] border border-border bg-surface shadow-sm-t" aria-label="Players">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-semibold">
          People <span className="text-text-3">· {participants.length}</span>
        </span>
        {clock}
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {participants.map((p) => (
            <motion.li
              key={p.user_id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border last:border-b-0"
            >
              <PlayerRow
                p={p}
                online={online.has(p.user_id)}
                phase={phase}
                canManage={canManage}
                onRole={onRole}
                onRemove={onRemove}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

function PlayerRow({
  p,
  online,
  phase,
  canManage,
  onRole,
  onRemove,
}: {
  p: Participant;
  online: boolean;
  phase: PokerPhase;
  canManage: boolean;
  onRole: (user: string, participation: Participation, isModerator: boolean) => void;
  onRemove: (user: string) => void;
}) {
  const isPlayer = p.participation === "player";
  // Players show live presence; observers and moderator-only people are grey.
  const dot = !isPlayer ? "bg-inactive" : online ? "bg-online" : "bg-offline";
  const role = isPlayer ? "Player" : p.participation === "observer" ? "Observer" : "Moderator only";

  const avatar = (
    <span className="relative flex shrink-0">
      <Avatar seed={p.name} size={34} label={p.name} />
      <span
        className={`absolute -bottom-px -right-px h-[11px] w-[11px] rounded-full border-2 border-surface ${dot}`}
        aria-label={isPlayer ? (online ? "Online" : "Offline") : role}
      />
    </span>
  );

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      {canManage ? (
        <Menu
          align="start"
          width={220}
          trigger={
            <button type="button" aria-label={`Change role for ${p.name}`} className="rounded-full">
              {avatar}
            </button>
          }
        >
          <MenuLabel>
            <div className="truncate text-[13px] font-semibold">{p.name}</div>
            <div className="text-[11.5px] text-text-3">{role}</div>
          </MenuLabel>
          <MenuSeparator />
          <MenuCheckItem checked={isPlayer} onCheckedChange={() => onRole(p.user_id, "player", p.is_moderator)}>
            Player
          </MenuCheckItem>
          <MenuCheckItem
            checked={p.participation === "observer"}
            onCheckedChange={() => onRole(p.user_id, "observer", p.is_moderator)}
          >
            Observer
          </MenuCheckItem>
          <MenuCheckItem
            checked={p.is_moderator}
            onCheckedChange={(on) =>
              onRole(p.user_id, !on && p.participation === "none" ? "observer" : p.participation, on)
            }
          >
            Moderator
          </MenuCheckItem>
          {!p.is_owner && !p.is_me && (
            <>
              <MenuSeparator />
              <MenuItem danger icon={<UserMinus size={15} />} onSelect={() => onRemove(p.user_id)}>
                Remove from room
              </MenuItem>
            </>
          )}
        </Menu>
      ) : (
        avatar
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-medium">{p.name}</span>
          {p.is_me && <span className="text-[11px] text-text-3">(you)</span>}
          {p.is_owner && <Crown size={12} className="shrink-0 text-warn" aria-label="Room owner" />}
          {p.is_moderator && !p.is_owner && <Star size={12} className="shrink-0 text-warn" aria-label="Moderator" />}
        </div>
        <div className="mono text-[11px] text-text-3">
          {!isPlayer ? role : p.seconds !== null ? formatClock(p.seconds) : "--:--"}
        </div>
      </div>

      <VoteState p={p} phase={phase} />
    </div>
  );
}

function VoteState({ p, phase }: { p: Participant; phase: PokerPhase }) {
  if (p.participation !== "player") return null;
  const revealed = phase !== "voting";
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {revealed && p.value ? (
        <motion.span
          key="value"
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className="mono min-w-[34px] rounded-lg border border-border-strong bg-surface-2 px-2 py-1 text-center text-[15px] font-semibold"
        >
          {p.value}
        </motion.span>
      ) : p.voted ? (
        <motion.span
          key="voted"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 22 }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-fg"
          aria-label="Voted"
        >
          <Check size={15} strokeWidth={3} />
        </motion.span>
      ) : p.voted === false && !revealed ? (
        <motion.span key="thinking" className="flex gap-1 pr-1" aria-label="Still deciding">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-text-3"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
