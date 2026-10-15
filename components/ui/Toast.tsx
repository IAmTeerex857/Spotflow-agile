"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck } from "lucide-react";

type Tone = "error" | "success";
type ToastItem = { id: number; tone: Tone; message: string };
type ToastApi = { error: (message: string) => void; success: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((tone: Tone, message: string) => {
    const id = ++nextId.current;
    setItems((list) => [...list.filter((t) => t.message !== message), { id, tone, message }].slice(-3));
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4200);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ error: (m) => push("error", m), success: (m) => push("success", m) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[90] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex max-w-[420px] items-center gap-2.5 rounded-full bg-[#141414] py-2.5 pl-3.5 pr-5 text-[13.5px] font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
            >
              {t.tone === "error" ? (
                <CircleAlert size={17} className="shrink-0 text-[#ff8a7a]" />
              ) : (
                <CircleCheck size={17} className="shrink-0 text-[#5fe0a0]" />
              )}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}
