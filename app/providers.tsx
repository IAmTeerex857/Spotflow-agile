"use client";

import { MotionConfig } from "motion/react";
import { Tooltip } from "radix-ui";
import { Toaster } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <Tooltip.Provider delayDuration={250}>
        <Toaster>{children}</Toaster>
      </Tooltip.Provider>
    </MotionConfig>
  );
}
