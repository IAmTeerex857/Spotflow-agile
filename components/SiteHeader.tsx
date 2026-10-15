import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export type NavLink = { href: string; label: string };

/** Sticky, blurred top bar shared by the three surfaces. */
export function SiteHeader({
  brand,
  links = [],
  actions,
  maxWidth = "max-w-[1200px]",
}: {
  brand: React.ReactNode;
  links?: NavLink[];
  actions?: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[color-mix(in_srgb,var(--bg)_84%,transparent)] backdrop-blur-md">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between gap-4 px-4 py-3 sm:px-8`}>
        <div className="flex min-w-0 items-center gap-6">
          {brand}
          {links.length > 0 && (
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-1.5 text-sm text-text-2 transition-colors hover:bg-bg-subtle hover:text-text"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
