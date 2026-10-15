"use client";

import { AnimatePresence, motion } from "motion/react";
import { Dialog as RadixDialog } from "radix-ui";
import { X } from "lucide-react";
import { usePortalContainer } from "@/components/Surface";
import { Button, type ButtonVariant } from "./Button";

const WIDTH = { sm: "max-w-[420px]", md: "max-w-[520px]", lg: "max-w-[580px]" } as const;

/**
 * Accessible modal: focus is trapped, Escape and outside clicks close it, and
 * focus returns to the trigger. Always controlled so exit animations can run.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  dismissible = true,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  size?: keyof typeof WIDTH;
  /** When false, Escape, outside clicks and the close button are disabled. */
  dismissible?: boolean;
  children: React.ReactNode;
}) {
  const container = usePortalContainer();
  const block = (e: Event) => {
    if (!dismissible) e.preventDefault();
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount container={container}>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-[rgba(20,16,10,0.5)] backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </RadixDialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-[61] flex items-start justify-center overflow-y-auto p-4 pt-[10vh]">
              <RadixDialog.Content
                asChild
                forceMount
                onEscapeKeyDown={block}
                onPointerDownOutside={block}
                onInteractOutside={block}
              >
                <motion.div
                  className={`pointer-events-auto relative w-full ${WIDTH[size]} rounded-[18px] border border-border bg-surface shadow-lg-t`}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                >
                  <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
                    <div>
                      <RadixDialog.Title className="font-display text-lg font-semibold tracking-[-0.01em]">
                        {title}
                      </RadixDialog.Title>
                      {description ? (
                        <RadixDialog.Description className="mt-1.5 text-sm leading-relaxed text-text-2">
                          {description}
                        </RadixDialog.Description>
                      ) : (
                        <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
                      )}
                    </div>
                    {dismissible && (
                      <RadixDialog.Close
                        aria-label="Close"
                        className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-3 transition-colors hover:bg-bg-subtle hover:text-text"
                      >
                        <X size={17} strokeWidth={2} />
                      </RadixDialog.Close>
                    )}
                  </div>
                  <div className="px-6 pb-6 pt-3">{children}</div>
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

/** Yes/no confirmation built on `Dialog`. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} size="sm">
      <div className="flex justify-end gap-2.5 pt-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
