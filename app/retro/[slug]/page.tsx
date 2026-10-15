import { RetroBoard } from "@/components/retro/board/RetroBoard";

export default async function RetroBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RetroBoard slug={slug} />;
}
