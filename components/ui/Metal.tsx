"use client";

import { MetalFx, type MetalFxProps } from "metal-fx";
import { useTheme } from "@/components/theme/theme";
import { useHydrated } from "@/lib/useHydrated";

/**
 * Liquid-metal ring around a single element. WebGL only exists in the browser,
 * so the ring mounts after hydration and the child renders plain until then.
 */
export function Metal({ children, ...props }: Omit<MetalFxProps, "theme">) {
  const hydrated = useHydrated();
  const { theme } = useTheme();
  if (!hydrated) return <>{children}</>;
  return (
    <MetalFx theme={theme} {...props}>
      {children}
    </MetalFx>
  );
}
