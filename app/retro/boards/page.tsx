import type { Metadata } from "next";
import { unlisted } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { RetroBrand } from "@/components/retro/RetroBrand";
import { BoardList } from "@/components/retro/BoardList";

export const metadata: Metadata = { title: "Past retros", robots: unlisted };

export default function RetroBoardsPage() {
  return (
    <>
      <SiteHeader brand={<RetroBrand />} links={[{ href: "/retro/boards", label: "Past retros" }]} />
      <BoardList />
    </>
  );
}
