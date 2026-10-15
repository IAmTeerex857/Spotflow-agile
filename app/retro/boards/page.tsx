import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { RetroBrand } from "@/components/retro/RetroBrand";
import { BoardList } from "@/components/retro/BoardList";

export const metadata: Metadata = { title: "Past retros · Spotflow Retro" };

export default function RetroBoardsPage() {
  return (
    <>
      <SiteHeader brand={<RetroBrand />} links={[{ href: "/retro", label: "About Retro" }]} />
      <BoardList />
    </>
  );
}
