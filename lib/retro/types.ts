export type RetroPhase = "brainstorm" | "group_vote" | "action_items" | "done";
export type RetroLane = "went_well" | "improve" | "questions" | "todo";

export const REACTION_EMOJIS = ["👍", "🎉", "❤️", "😄", "😩", "🚀"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type RetroCard = {
  id: string;
  lane: RetroLane;
  body: string;
  /** Running number across the whole board, in the order cards were added. */
  seq: number;
  group_id: string | null;
  mine: boolean;
  votes: number;
  voted: boolean;
  reactions: Partial<Record<ReactionEmoji, number>>;
  my_reaction: ReactionEmoji | null;
};

export type RetroBoardSummary = {
  id: string;
  slug: string;
  title: string;
  phase: RetroPhase;
  has_password: boolean;
  created_at: string;
};

export type RetroBoardView =
  | { status: "not_found" }
  | { status: "join_required"; board: RetroBoardSummary }
  | {
      status: "ok";
      board: RetroBoardSummary;
      me: { role: "moderator" | "participant"; avatar_seed: string };
      member_count: number;
      cards: RetroCard[];
      /** Brainstorm only: how many cards other people have added per column. */
      hidden: Partial<Record<RetroLane, number>>;
    };

export type RetroJoinResult = "ok" | "not_found" | "password_required" | "wrong_password" | "too_many_attempts";

export type RetroBoardListItem = {
  slug: string;
  title: string;
  phase: RetroPhase;
  created_at: string;
  updated_at: string;
  card_count: number;
  action_count: number;
  has_password: boolean;
  is_member: boolean;
  is_moderator: boolean;
};

export const LANES: { key: RetroLane; label: string; placeholder: string }[] = [
  { key: "went_well", label: "Went well", placeholder: "It worked well that…" },
  { key: "improve", label: "To improve", placeholder: "We could improve…" },
  { key: "questions", label: "Questions", placeholder: "I want to ask about…" },
  { key: "todo", label: "Action items", placeholder: "We need to do…" },
];

export const PHASES: { key: RetroPhase; name: string; hint: string; advance: string }[] = [
  {
    key: "brainstorm",
    name: "Brainstorm",
    hint: "Add your thoughts. Nobody can read them until the moderator reveals the board.",
    advance: "Reveal and vote",
  },
  {
    key: "group_vote",
    name: "Group & vote",
    hint: "Drag cards onto each other to stack similar ideas, then vote for what to discuss.",
    advance: "Discuss and add actions",
  },
  {
    key: "action_items",
    name: "Action items",
    hint: "Talk through the top topics and write down what the team will do.",
    advance: "Finish retro",
  },
  { key: "done", name: "Done", hint: "Retro finished. Here is what the team agreed to do.", advance: "Done" },
];

export function phaseInfo(phase: RetroPhase) {
  return PHASES.find((p) => p.key === phase) ?? PHASES[0];
}
