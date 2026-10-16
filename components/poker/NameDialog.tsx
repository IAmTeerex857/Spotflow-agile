"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Field";
import { PanelLoader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";
import { errorMessage } from "@/lib/supabase/client";
import { usePokerName } from "@/lib/poker/useName";

export function NameDialog({
  open,
  onOpenChange,
  dismissible = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible?: boolean;
}) {
  const { name, setName } = usePokerName();
  const toast = useToast();
  const [draft, setDraft] = useState(name ?? "");
  const [busy, setBusy] = useState(false);
  const clean = draft.trim();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clean) return;
    setBusy(true);
    try {
      await setName(clean);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      size="sm"
      title={name ? "Change your name" : "What should we call you?"}
      description="Your teammates see this next to your vote. No account needed."
    >
      <form onSubmit={save}>
        <div className="mb-5 flex items-center gap-3 rounded-[12px] border border-border bg-surface-2 p-3">
          <Avatar seed={clean || "new-player"} size={44} animate="always" />
          <div className="min-w-0">
            <div className="truncate font-display text-[15px] font-semibold">{clean || "Your name"}</div>
            <div className="text-xs text-text-3">This is how you&apos;ll appear in rooms</div>
          </div>
        </div>
        <Label htmlFor="player-name">Name</Label>
        <Input
          id="player-name"
          autoFocus
          value={draft}
          maxLength={40}
          autoComplete="name"
          placeholder="e.g. Tomisin"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" fullWidth className="mt-5" icon={<ArrowRight />} disabled={!clean} loading={busy}>
          {name ? "Save name" : "Continue"}
        </Button>
      </form>
    </Dialog>
  );
}

/** Renders children once this browser has a poker name; asks for one first. */
export function NameGate({ children }: { children: React.ReactNode }) {
  const { name } = usePokerName();
  if (name === undefined) return <PanelLoader tool="poker" label="Getting things ready" />;
  if (name === null) {
    return (
      <>
        <div className="min-h-[60vh]" />
        <NameDialog open onOpenChange={() => {}} dismissible={false} />
      </>
    );
  }
  return <>{children}</>;
}
