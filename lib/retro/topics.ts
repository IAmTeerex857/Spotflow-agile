import type { RetroCard, RetroLane } from "./types";

/** A single card, or a stack of grouped cards that is voted on as one. */
export type Topic = {
  key: string;
  lane: RetroLane;
  cards: RetroCard[];
  lead: RetroCard;
  votes: number;
  voted: boolean;
};

export function buildTopics(cards: RetroCard[], byVotes: boolean): Topic[] {
  const groups = new Map<string, RetroCard[]>();
  for (const card of cards) {
    const key = card.group_id ?? card.id;
    groups.set(key, [...(groups.get(key) ?? []), card]);
  }

  const topics = [...groups.entries()].map(([key, members]) => {
    const sorted = [...members].sort((a, b) => a.seq - b.seq);
    return {
      key,
      lane: sorted[0].lane,
      cards: sorted,
      lead: sorted[0],
      votes: sorted.reduce((n, c) => n + c.votes, 0),
      voted: sorted.some((c) => c.voted),
    };
  });

  return topics.sort((a, b) => (byVotes ? b.votes - a.votes : 0) || a.lead.seq - b.lead.seq);
}
