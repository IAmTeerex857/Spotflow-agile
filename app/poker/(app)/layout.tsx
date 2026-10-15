import { TopBar } from "@/components/poker/TopBar";

/** Chrome for the Poker app pages (Your rooms and rooms). */
export default function PokerAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      {children}
    </>
  );
}
