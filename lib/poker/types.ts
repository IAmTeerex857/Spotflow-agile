import type { DeckId } from "./decks";

export type PokerPhase = "voting" | "revealed" | "finished";
export type Participation = "player" | "observer" | "none";
export type StoryStatus = "active" | "completed" | "skipped";

export type RoomSettings = {
  allow_stories: boolean;
  confirm_skip: boolean;
  observers_see_votes: boolean;
  reveal_individual: boolean;
  allow_vote_change: boolean;
  countdown: boolean;
  countdown_seconds: number;
};

export const DEFAULT_SETTINGS: RoomSettings = {
  allow_stories: true,
  confirm_skip: true,
  observers_see_votes: true,
  reveal_individual: true,
  allow_vote_change: false,
  countdown: false,
  countdown_seconds: 60,
};

export const SETTING_FIELDS: { key: Exclude<keyof RoomSettings, "countdown_seconds">; label: string }[] = [
  { key: "allow_stories", label: "Use a list of stories in this room" },
  { key: "confirm_skip", label: "Ask before skipping a story" },
  { key: "observers_see_votes", label: "Let observers see who has voted" },
  { key: "reveal_individual", label: "Show each person's vote after the flip" },
  { key: "allow_vote_change", label: "Let players change their vote after the flip" },
  { key: "countdown", label: "Use a countdown timer" },
];

export type Participant = {
  user_id: string;
  name: string;
  participation: Participation;
  is_moderator: boolean;
  is_owner: boolean;
  is_me: boolean;
  /** null when this viewer isn't allowed to know. */
  voted: boolean | null;
  value: string | null;
  seconds: number | null;
};

export type Story = {
  id: string;
  title: string;
  position: number;
  status: StoryStatus;
  estimate: string | null;
  duration_seconds: number;
};

export type Room = {
  id: string;
  slug: string;
  name: string;
  deck: DeckId;
  cards: string[];
  settings: RoomSettings;
  phase: PokerPhase;
  current_story_id: string | null;
  round_started_at: string;
};

export type RoomView =
  | { status: "not_found" }
  | { status: "join_required"; room: { name: string } }
  | {
      status: "ok";
      now: string;
      room: Room;
      me: { user_id: string; participation: Participation; is_moderator: boolean; is_owner: boolean };
      participants: Participant[];
      stories: Story[];
      results: { value: string; count: number }[] | null;
    };

export type ReadyRoom = Extract<RoomView, { status: "ok" }>;

export type MyRoom = {
  id: string;
  slug: string;
  name: string;
  deck: DeckId;
  is_owner: boolean;
  is_moderator: boolean;
  created_at: string;
  last_used_at: string;
  story_count: number;
  completed_count: number;
  total_points: number;
  total_seconds: number;
  avg_seconds: number | null;
  last_story: string | null;
  fastest_name: string | null;
  fastest_seconds: number | null;
  slowest_name: string | null;
  slowest_seconds: number | null;
};

export type RoomInput = {
  name: string;
  deck: DeckId;
  cards: string[];
  settings: RoomSettings;
  stories?: string[];
};
