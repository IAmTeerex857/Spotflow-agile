"use client";

import { Popover as RadixPopover } from "radix-ui";
import { usePortalContainer } from "@/components/Surface";

export function Popover({
  trigger,
  children,
  width = 290,
  align = "end",
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const container = usePortalContainer();
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal container={container}>
        <RadixPopover.Content
          align={align}
          sideOffset={8}
          collisionPadding={12}
          style={{ width }}
          className="z-[70] rounded-[14px] border border-border bg-surface p-[18px] shadow-lg-t outline-none"
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
