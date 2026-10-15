"use client";

import { Select as RadixSelect } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { usePortalContainer } from "@/components/Surface";
import { fieldClass } from "./Field";

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  label,
  id,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  id?: string;
}) {
  const container = usePortalContainer();
  return (
    <RadixSelect.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <RadixSelect.Trigger id={id} aria-label={label} className={`${fieldClass} flex items-center justify-between gap-2`}>
        <RadixSelect.Value />
        <RadixSelect.Icon className="text-text-3">
          <ChevronDown size={16} strokeWidth={2} />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal container={container}>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-[75] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg-t"
        >
          <RadixSelect.Viewport>
            {options.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[13.5px] outline-none data-[highlighted]:bg-bg-subtle data-[state=checked]:font-semibold"
              >
                <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="text-accent">
                  <Check size={15} strokeWidth={2.4} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
