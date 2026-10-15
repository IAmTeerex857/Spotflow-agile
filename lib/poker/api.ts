"use client";

import { rpc } from "@/lib/supabase/client";
import type { MyRoom, Participation, RoomInput, RoomView } from "./types";

const roomArgs = (input: RoomInput) => ({
  p_name: input.name,
  p_deck: input.deck,
  p_cards: input.cards,
  p_settings: input.settings,
});

/** Typed wrappers over the poker_* database functions. */
export const pokerApi = {
  getName: () => rpc<string | null>("poker_get_name"),
  setName: (name: string) => rpc<void>("poker_set_name", { p_name: name }),

  myRooms: () => rpc<MyRoom[]>("poker_my_rooms"),
  createRoom: (input: RoomInput) =>
    rpc<string>("poker_create_room", { ...roomArgs(input), p_stories: input.stories ?? [] }),
  updateRoom: (room: string, input: RoomInput) => rpc<void>("poker_update_room", { p_room: room, ...roomArgs(input) }),
  joinRoom: (slug: string) => rpc<string>("poker_join_room", { p_slug: slug }),
  leaveRoom: (room: string) => rpc<void>("poker_leave_room", { p_room: room }),
  getRoom: (slug: string) => rpc<RoomView>("poker_get_room", { p_slug: slug }),
  clearRoom: (room: string) => rpc<void>("poker_clear_room", { p_room: room }),
  cloneRoom: (room: string) => rpc<string>("poker_clone_room", { p_room: room }),
  deleteRoom: (room: string) => rpc<void>("poker_delete_room", { p_room: room }),

  vote: (room: string, value: string | null) => rpc<void>("poker_vote", { p_room: room, p_value: value }),
  reveal: (room: string) => rpc<void>("poker_reveal", { p_room: room }),
  finish: (room: string, estimate: string | null) => rpc<void>("poker_finish", { p_room: room, p_estimate: estimate }),
  clearVotes: (room: string) => rpc<void>("poker_clear_votes", { p_room: room }),
  resetTimer: (room: string) => rpc<void>("poker_reset_timer", { p_room: room }),
  nextStory: (room: string) => rpc<void>("poker_next_story", { p_room: room }),
  skipStory: (room: string) => rpc<void>("poker_skip_story", { p_room: room }),

  addStories: (room: string, titles: string[]) => rpc<number>("poker_add_stories", { p_room: room, p_titles: titles }),
  selectStory: (story: string) => rpc<void>("poker_select_story", { p_story: story }),
  retryStory: (story: string) => rpc<void>("poker_retry_story", { p_story: story }),
  deleteStory: (story: string) => rpc<void>("poker_delete_story", { p_story: story }),
  moveStory: (story: string, position: number) => rpc<void>("poker_move_story", { p_story: story, p_position: position }),

  setRole: (room: string, user: string, participation: Participation, isModerator: boolean) =>
    rpc<void>("poker_set_role", {
      p_room: room,
      p_user: user,
      p_participation: participation,
      p_is_moderator: isModerator,
    }),
  removeParticipant: (room: string, user: string) =>
    rpc<void>("poker_remove_participant", { p_room: room, p_user: user }),
};
