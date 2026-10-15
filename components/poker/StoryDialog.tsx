"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { parseStoryCsv } from "@/lib/poker/csv";

/** Paste stories one per line, or pull them from a one-column CSV. */
export function StoryDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (titles: string[]) => Promise<boolean>;
}) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const titles = text.split("\n").map((t) => t.trim()).filter(Boolean);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const found = parseStoryCsv(await file.text());
    if (!found.length) {
      toast.error("No stories found. Use one column with a title on each row.");
      return;
    }
    setText((t) => [t.trim(), ...found].filter(Boolean).join("\n"));
    toast.success(`Found ${found.length} ${found.length === 1 ? "story" : "stories"} in ${file.name}`);
  };

  const save = async (keepOpen: boolean) => {
    if (!titles.length) return;
    setBusy(true);
    const ok = await onAdd(titles);
    setBusy(false);
    if (!ok) return;
    setText("");
    toast.success(`Added ${titles.length} ${titles.length === 1 ? "story" : "stories"}`);
    if (!keepOpen) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add stories"
      description="One story per line. You can also drop in a CSV with a title column."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void importFile(e.dataTransfer.files[0]);
        }}
        className={`rounded-[12px] transition-shadow ${dragging ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
      >
        <Textarea
          autoFocus
          rows={7}
          value={text}
          aria-label="Stories, one per line"
          placeholder={"Add test card to checkout\nReconciliation report UI"}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-text-3">
        <span>{titles.length ? `${titles.length} ready to add` : "Nothing yet"}</span>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-1.5 font-semibold text-accent hover:text-accent-hover"
        >
          <FileUp size={14} /> Import CSV
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            void importFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2.5">
        <Button variant="secondary" disabled={!titles.length || busy} onClick={() => void save(true)}>
          Add and keep going
        </Button>
        <Button disabled={!titles.length} loading={busy} onClick={() => void save(false)}>
          Add stories
        </Button>
      </div>
    </Dialog>
  );
}
