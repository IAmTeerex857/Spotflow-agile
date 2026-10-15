"use client";

import { rpc } from "@/lib/supabase/client";
import type {
  ReactionEmoji,
  RetroBoardListItem,
  RetroBoardView,
  RetroJoinResult,
  RetroLane,
  RetroPhase,
} from "./types";

/** Typed wrappers over the retro_* database functions. */
export const retroApi = {
  createBoard: (title?: string) => rpc<string>("retro_create_board", { p_title: title ?? null }),
  listBoards: () => rpc<RetroBoardListItem[]>("retro_list_boards"),
  getBoard: (slug: string) => rpc<RetroBoardView>("retro_get_board", { p_slug: slug }),
  joinBoard: (slug: string, password?: string) =>
    rpc<RetroJoinResult>("retro_join_board", { p_slug: slug, p_password: password ?? null }),

  addCard: (board: string, lane: RetroLane, body: string) =>
    rpc<string>("retro_add_card", { p_board: board, p_lane: lane, p_body: body }),
  editCard: (card: string, body: string) => rpc<void>("retro_edit_card", { p_card: card, p_body: body }),
  deleteCard: (card: string) => rpc<void>("retro_delete_card", { p_card: card }),

  advance: (board: string, from: RetroPhase) => rpc<RetroPhase>("retro_advance", { p_board: board, p_from: from }),
  toggleVote: (card: string) => rpc<boolean>("retro_toggle_vote", { p_card: card }),
  groupCards: (card: string, target: string) => rpc<void>("retro_group_cards", { p_card: card, p_target: target }),
  ungroupCard: (card: string) => rpc<void>("retro_ungroup_card", { p_card: card }),
  react: (card: string, emoji: ReactionEmoji) => rpc<void>("retro_react", { p_card: card, p_emoji: emoji }),

  renameBoard: (board: string, title: string) => rpc<void>("retro_rename_board", { p_board: board, p_title: title }),
  setPassword: (board: string, password: string | null) =>
    rpc<void>("retro_set_password", { p_board: board, p_password: password }),
  deleteBoard: (board: string) => rpc<void>("retro_delete_board", { p_board: board }),
};
