import { ArrowRight } from "lucide-react";
import { SPRINGY } from "@/lib/motion";

/*
 * Hover treatment for rows in the apps' lists, borrowed from the hub's tool
 * cards: the row lifts a touch with a springy ease and an arrow slides in.
 */

/** Classes for a list row (needs `bg-surface` underneath to cover neighbours). */
export const ROW_HOVER = `group relative bg-surface transition-[translate,background-color,box-shadow] duration-300 ${SPRINGY} hover:z-10 hover:-translate-y-0.5 hover:bg-bg-subtle hover:shadow-[var(--shadow-md)]`;

/** Classes for the row's list item, so the first and last rows keep the list's rounded corners. */
export const ROW_ITEM = "[&:first-child>*]:rounded-t-2xl [&:last-child>*]:rounded-b-2xl";

/** Arrow that slides in beside the row title on hover. */
export function RowArrow() {
  return (
    <ArrowRight
      size={15}
      strokeWidth={2.2}
      aria-hidden
      className={`shrink-0 -translate-x-1.5 text-accent opacity-0 transition-[opacity,translate] duration-300 ${SPRINGY} group-hover:translate-x-0 group-hover:opacity-100`}
    />
  );
}
