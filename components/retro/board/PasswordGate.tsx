"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import type { RetroJoinResult } from "@/lib/retro/types";

const FEEDBACK: Partial<Record<RetroJoinResult, string>> = {
  wrong_password: "That password isn't right.",
  too_many_attempts: "Too many tries. Wait a few minutes and try again.",
  not_found: "This board no longer exists.",
};

export function PasswordGate({
  title,
  onUnlock,
}: {
  title: string;
  onUnlock: (password: string) => Promise<RetroJoinResult>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await onUnlock(password);
    setBusy(false);
    if (result !== "ok") setFeedback(FEEDBACK[result] ?? null);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[400px] rounded-[20px] border border-border bg-surface p-8 text-center shadow-lg-t"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-border bg-accent-soft text-accent">
          <LockKeyhole size={22} />
        </div>
        <h1 className="text-xl font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="mb-6 mt-1.5 text-sm text-text-2">This board is private. Enter its password to join.</p>
        <Input
          type="password"
          autoFocus
          value={password}
          aria-label="Board password"
          placeholder="Password"
          onChange={(e) => {
            setPassword(e.target.value);
            setFeedback(null);
          }}
        />
        {feedback && (
          <p role="alert" className="mt-2.5 text-left text-[13px] font-medium text-danger">
            {feedback}
          </p>
        )}
        <Button type="submit" fullWidth className="mt-4" disabled={!password} loading={busy}>
          Join board
        </Button>
      </form>
    </div>
  );
}
