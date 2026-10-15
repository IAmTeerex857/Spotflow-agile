"use client";

import { useId } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { Check } from "lucide-react";

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-surface-2 text-accent-fg transition-colors data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-50"
      >
        <RadixCheckbox.Indicator>
          <Check size={13} strokeWidth={3} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label htmlFor={id} className={`cursor-pointer text-sm leading-snug ${checked ? "text-text" : "text-text-2"}`}>
        {label}
      </label>
    </div>
  );
}
