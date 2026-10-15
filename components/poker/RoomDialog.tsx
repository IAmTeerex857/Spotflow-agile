"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { DECK_OPTIONS, deckValues, type DeckId } from "@/lib/poker/decks";
import { DEFAULT_SETTINGS, SETTING_FIELDS, type RoomInput, type RoomSettings } from "@/lib/poker/types";

const COUNTDOWNS = [30, 60, 90, 120, 180, 300].map((s) => ({
  value: String(s),
  label: s < 60 ? `${s} seconds` : `${s / 60} minute${s === 60 ? "" : "s"}`,
}));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing room. */
  initial?: RoomInput;
  /** Resolves true when saved; the dialog then closes. */
  onSubmit: (input: RoomInput) => Promise<boolean>;
};

/** Create or edit a room. Mount it fresh for each opening so the form resets. */
export function RoomDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const editing = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [deck, setDeck] = useState<DeckId>(initial?.deck ?? "scrum");
  const [cards, setCards] = useState<string[]>(initial?.cards ?? deckValues("scrum"));
  const [customText, setCustomText] = useState((initial?.deck === "custom" ? initial.cards : deckValues("scrum")).join(", "));
  const [settings, setSettings] = useState<RoomSettings>(initial?.settings ?? DEFAULT_SETTINGS);
  const [stories, setStories] = useState("");
  const [busy, setBusy] = useState(false);

  const presetValues = useMemo(() => (deck === "custom" ? [] : deckValues(deck)), [deck]);
  const finalCards =
    deck === "custom"
      ? customText.split(",").map((c) => c.trim()).filter(Boolean)
      : presetValues.filter((v) => cards.includes(v));
  const valid = name.trim().length > 0 && finalCards.length >= 2;

  const pickDeck = (next: DeckId) => {
    setDeck(next);
    if (next !== "custom") setCards(deckValues(next));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    const saved = await onSubmit({
      name: name.trim(),
      deck,
      cards: finalCards,
      settings,
      stories: stories.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setBusy(false);
    if (saved) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="lg" title={editing ? "Room settings" : "Create a room"}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
          <div>
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              autoFocus
              value={name}
              maxLength={80}
              placeholder="e.g. Frontend sprint 46"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="room-deck">Deck</Label>
            <Select id="room-deck" label="Deck" value={deck} onValueChange={pickDeck} options={DECK_OPTIONS} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-2">
              {deck === "custom" ? "Card values, separated by commas" : "Cards in play"}
            </span>
            {deck !== "custom" && (
              <span className="text-xs text-text-3">
                {finalCards.length} of {presetValues.length}
              </span>
            )}
          </div>
          {deck === "custom" ? (
            <Input
              value={customText}
              aria-label="Custom card values"
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="1, 2, 3, 5, 8, ?"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {presetValues.map((v) => {
                const on = cards.includes(v);
                return (
                  <motion.button
                    key={v}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    aria-pressed={on}
                    onClick={() => setCards((cs) => (on ? cs.filter((c) => c !== v) : [...cs, v]))}
                    className={`mono h-11 min-w-10 rounded-[9px] border-[1.5px] px-2.5 text-sm font-semibold transition-colors ${
                      on ? "border-accent bg-accent-soft text-accent" : "border-border-strong bg-surface-2 text-text-3 line-through"
                    }`}
                  >
                    {v}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <fieldset className="flex flex-col gap-3 rounded-[12px] border border-border bg-surface-2 p-4">
          <legend className="px-1 text-xs font-semibold text-text-2">Room settings</legend>
          {SETTING_FIELDS.map((f) => (
            <Checkbox
              key={f.key}
              checked={settings[f.key]}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, [f.key]: v }))}
              label={f.label}
            />
          ))}
          {settings.countdown && (
            <div className="ml-7 max-w-[200px]">
              <Select
                label="Countdown length"
                value={String(settings.countdown_seconds)}
                onValueChange={(v) => setSettings((s) => ({ ...s, countdown_seconds: Number(v) }))}
                options={COUNTDOWNS}
              />
            </div>
          )}
        </fieldset>

        {!editing && settings.allow_stories && (
          <div>
            <Label htmlFor="room-stories">Stories (optional, one per line)</Label>
            <Textarea
              id="room-stories"
              rows={4}
              value={stories}
              placeholder={"Login page\nPayments integration"}
              onChange={(e) => setStories(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid} loading={busy}>
            {editing ? "Save changes" : "Create room"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
