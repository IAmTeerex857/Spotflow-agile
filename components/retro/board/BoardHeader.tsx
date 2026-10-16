"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BorderBeam } from "border-beam";
import { ArrowRight, CircleHelp, Ellipsis, Lock, LockOpen, Trash2, Hourglass } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { RetroBrand } from "@/components/retro/RetroBrand";
import { useTheme } from "@/components/theme/theme";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CopyButton, siteUrl } from "@/components/ui/CopyButton";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Field";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Popover } from "@/components/ui/Popover";
import type { RetroBoardSummary } from "@/lib/retro/types";
import { phaseInfo } from "@/lib/retro/types";

export function BoardHeader({
  board,
  isModerator,
  peers,
  canAdvance,
  advancing,
  onAdvance,
  onRename,
  onSetPassword,
  onDelete,
}: {
  board: RetroBoardSummary;
  isModerator: boolean;
  peers: { seed: string }[];
  canAdvance: boolean;
  advancing: boolean;
  onAdvance: () => void;
  onRename: (title: string) => void;
  onSetPassword: (password: string | null) => Promise<unknown>;
  onDelete: () => void;
}) {
  const { theme } = useTheme();
  const done = board.phase === "done";
  const advance = phaseInfo(board.phase).advance;

  return (
    <>
      <SiteHeader
        brand={<RetroBrand compact />}
        links={[{ href: "/retro/boards", label: "Past retros" }]}
        actions={
          <>
            <Presence peers={peers} />
            {!done &&
              (isModerator ? (
                <BorderBeam size="sm" colorVariant="sunset" theme={theme} active={canAdvance && !advancing} strength={0.9}>
                  <Button
                    size="sm"
                    icon={<ArrowRight />}
                    arrow
                    disabled={!canAdvance}
                    loading={advancing}
                    onClick={onAdvance}
                  >
                    <span className="sm:hidden">Next step</span>
                    <span className="hidden sm:inline">{advance}</span>
                  </Button>
                </BorderBeam>
              ) : (
                <span className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-btn border border-border bg-bg-subtle px-3 text-[12.5px] font-semibold text-text-3">
                  <Hourglass size={13} />
                  <span className="sm:hidden">Waiting</span>
                  <span className="hidden sm:inline">Moderator moves the board</span>
                </span>
              ))}
          </>
        }
      />

      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-3 px-4 pt-6 sm:px-8">
        <BoardTitle title={board.title} editable={isModerator} onRename={onRename} />
        <div className="flex items-center gap-2">
          <CopyButton text={siteUrl(`/retro/${board.slug}`)} label="Share" />
          <HelpPopover />
          {isModerator && <PasswordPopover hasPassword={board.has_password} onSave={onSetPassword} />}
          {isModerator && (
            <Menu trigger={<IconButton icon={<Ellipsis />} label="More" />}>
              <MenuItem danger icon={<Trash2 size={15} />} onSelect={onDelete}>
                Delete board
              </MenuItem>
            </Menu>
          )}
        </div>
      </div>
    </>
  );
}

function BoardTitle({ title, editable, onRename }: { title: string; editable: boolean; onRename: (t: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (draft !== null) {
    const save = () => {
      const next = draft.trim();
      setDraft(null);
      if (next && next !== title) onRename(next);
    };
    return (
      <input
        autoFocus
        value={draft}
        maxLength={80}
        aria-label="Board title"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setDraft(null);
        }}
        className="-ml-2 min-w-0 max-w-[480px] flex-1 rounded-lg border border-accent bg-surface px-2 py-0.5 text-[24px] font-extrabold tracking-[-0.02em] outline-none sm:text-[26px]"
      />
    );
  }
  return (
    <h1 className="mr-auto min-w-0 text-[24px] font-extrabold tracking-[-0.02em] sm:text-[26px]">
      {editable ? (
        <button
          type="button"
          onClick={() => setDraft(title)}
          title="Rename board"
          className="-ml-2 block max-w-full truncate rounded-lg px-2 py-0.5 text-left transition-colors hover:bg-bg-subtle"
        >
          {title}
        </button>
      ) : (
        <span className="block truncate">{title}</span>
      )}
    </h1>
  );
}

function Presence({ peers }: { peers: { seed: string }[] }) {
  const shown = peers.slice(0, 5);
  if (peers.length === 0) return null;
  return (
    <div className="mr-1 hidden items-center sm:flex" aria-label={`${peers.length} here now`}>
      <div className="flex -space-x-2">
        <AnimatePresence initial={false}>
          {shown.map((p) => (
            <motion.span
              key={p.seed}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              className="rounded-full ring-2 ring-surface"
            >
              <Avatar seed={p.seed} size={28} label="Anonymous teammate" />
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <span className="ml-2 text-xs font-semibold text-text-3">{peers.length} here</span>
    </div>
  );
}

function HelpPopover() {
  return (
    <Popover trigger={<IconButton icon={<CircleHelp />} label="How this works" />} width={300}>
      <div className="text-[13.5px] leading-relaxed text-text-2">
        <Link href="/retro" className="mb-2 inline-block font-semibold text-accent hover:text-accent-hover">
          How Retro works
        </Link>
        <p>
          <strong className="text-text">Fully anonymous.</strong> Nobody is asked for a name, and cards are never
          linked to the person who wrote them. Your own cards have a soft orange outline so you can find them.
        </p>
      </div>
    </Popover>
  );
}

function PasswordPopover({
  hasPassword,
  onSave,
}: {
  hasPassword: boolean;
  onSave: (password: string | null) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (password: string | null) => {
    setBusy(true);
    await onSave(password);
    setBusy(false);
    setValue("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      width={300}
      trigger={
        <IconButton
          icon={hasPassword ? <Lock /> : <LockOpen />}
          label={hasPassword ? "Password is on" : "Add a password"}
          active={hasPassword}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.length >= 4) void save(value);
        }}
      >
        <div className="mb-1 text-sm font-bold">{hasPassword ? "Password is on" : "Password protection"}</div>
        <p className="mb-3 text-[12.5px] leading-relaxed text-text-2">
          {hasPassword
            ? "New people need the password to open this board. People already here keep access."
            : "Optional. New people will need the password to open this board."}
        </p>
        <Input
          type="password"
          value={value}
          minLength={4}
          maxLength={72}
          autoComplete="new-password"
          placeholder={hasPassword ? "Set a new password" : "At least 4 characters"}
          aria-label="Board password"
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          {hasPassword && (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void save(null)}>
              Remove
            </Button>
          )}
          <Button type="submit" size="sm" disabled={value.length < 4} loading={busy}>
            Save
          </Button>
        </div>
      </form>
    </Popover>
  );
}
