"use client";

import { DropdownMenu } from "radix-ui";
import { Check } from "lucide-react";
import { usePortalContainer } from "@/components/Surface";

/** Keyboard-accessible dropdown menu. Compose with the item components below. */
export function Menu({
  trigger,
  children,
  align = "end",
  width = 200,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  width?: number;
}) {
  const container = usePortalContainer();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal container={container}>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          style={{ width }}
          className="z-[70] overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-lg-t outline-none"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const itemClass =
  "flex w-full cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-bg-subtle";

export function MenuItem({
  icon,
  danger,
  hint,
  disabled,
  onSelect,
  children,
}: {
  icon?: React.ReactNode;
  danger?: boolean;
  hint?: string;
  disabled?: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`${itemClass} ${danger ? "text-danger" : "text-text"}`}
    >
      {icon && <span className={danger ? "" : "text-text-3"}>{icon}</span>}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-[10.5px] text-text-3">{hint}</span>}
    </DropdownMenu.Item>
  );
}

export function MenuCheckItem({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => e.preventDefault()}
      className={`${itemClass} ${checked ? "font-semibold" : ""}`}
    >
      <span className="flex-1">{children}</span>
      <DropdownMenu.ItemIndicator className="text-accent">
        <Check size={15} strokeWidth={2.4} />
      </DropdownMenu.ItemIndicator>
    </DropdownMenu.CheckboxItem>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DropdownMenu.Label className="px-2.5 pb-2 pt-1.5">{children}</DropdownMenu.Label>;
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-border" />;
}
