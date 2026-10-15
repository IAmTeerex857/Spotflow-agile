"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { PanelLoader } from "@/components/ui/Loader";
import { StatusScreen } from "@/components/StatusScreen";
import { NotConnected } from "@/components/NotConnected";
import { isConfigured } from "@/lib/supabase/client";
import { useAsync } from "@/lib/useAsync";
import { formatRelative } from "@/lib/format";
import { retroApi } from "@/lib/retro/api";
import { phaseInfo, type RetroPhase } from "@/lib/retro/types";
import { StartRetroButton } from "./StartRetroButton";

type Filter = "all" | "mine";

export function BoardList() {
  if (!isConfigured) return <NotConnected />;
  return <ConnectedBoardList />;
}

function ConnectedBoardList() {
  const { data: boards, error } = useAsync(retroApi.listBoards);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (boards ?? []).filter(
      (b) => (filter === "all" || b.is_member) && (!q || b.title.toLowerCase().includes(q)),
    );
  }, [boards, filter, query]);

  if (error) return <StatusScreen seed="retro-list-error" title="Couldn't load retros">{error}</StatusScreen>;
  if (!boards) return <PanelLoader label="Loading retros" />;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-20 pt-10 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-[-0.03em]">Past retros</h1>
          <p className="mt-1 text-sm text-text-2">Every board the team has run. Password boards stay locked.</p>
        </div>
        <StartRetroButton size="md" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[300px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title"
            aria-label="Search retros"
            className="pl-9"
          />
        </div>
        <div className="flex rounded-[11px] border border-border bg-surface p-1" role="tablist">
          {(["all", "mine"] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`relative rounded-lg px-3.5 py-1.5 text-[13px] font-semibold ${filter === f ? "text-text" : "text-text-3"}`}
            >
              {filter === f && (
                <motion.span layoutId="board-filter" className="absolute inset-0 rounded-lg bg-bg-subtle" transition={{ type: "spring", stiffness: 500, damping: 36 }} />
              )}
              <span className="relative">{f === "all" ? "All retros" : "Ones I joined"}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <StatusScreen seed="retro-empty" title={boards.length ? "No matches" : "No retros yet"}>
          {boards.length ? "Try another search." : "Start the first one. It takes one click."}
        </StatusScreen>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm-t">
          {shown.map((b, i) => (
            <motion.li
              key={b.slug}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.025 }}
              className="border-b border-border last:border-b-0"
            >
              <Link
                href={`/retro/${b.slug}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-4 transition-colors hover:bg-bg-subtle sm:grid-cols-[minmax(0,1fr)_130px_150px_100px]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[15px] font-bold tracking-[-0.01em]">{b.title}</span>
                  {b.has_password && <Lock size={13} className="shrink-0 text-text-3" aria-label="Password protected" />}
                  {b.is_moderator && (
                    <span className="shrink-0 rounded-full border border-accent-border bg-accent-soft px-2 py-0.5 text-[10.5px] font-bold text-accent">
                      Yours
                    </span>
                  )}
                </div>
                <PhaseBadge phase={b.phase} />
                <span className="whitespace-nowrap text-[13px] text-text-2">
                  {b.card_count} cards · {b.action_count} actions
                </span>
                <span className="text-[13px] text-text-3 sm:text-right">{formatRelative(b.updated_at)}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhaseBadge({ phase }: { phase: RetroPhase }) {
  const done = phase === "done";
  return (
    <span
      className={`justify-self-end rounded-full px-2.5 py-1 text-[11.5px] font-bold sm:justify-self-start ${
        done ? "bg-bg-subtle text-text-3" : "bg-accent-soft text-accent"
      }`}
    >
      {done ? "Finished" : phaseInfo(phase).name}
    </span>
  );
}
