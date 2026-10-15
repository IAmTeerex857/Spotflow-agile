"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!URL || !KEY) throw new ApiError("not_configured");
  client ??= createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

let session: Promise<string> | null = null;

/**
 * Every browser gets an anonymous Supabase session the first time it needs
 * one. Nobody sees a sign-in; the session just gives the server a stable
 * per-browser identity to check permissions against.
 */
export function ensureSession(): Promise<string> {
  session ??= (async () => {
    const sb = supabase();
    const { data } = await sb.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: created, error } = await sb.auth.signInAnonymously();
    if (error || !created.user) throw new ApiError("session_failed");
    return created.user.id;
  })().catch((e) => {
    session = null;
    throw e;
  });
  return session;
}

class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Calls a database function with the browser's session. */
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  await ensureSession();
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw new ApiError(error.message);
  return data as T;
}

const MESSAGES: Record<string, string> = {
  not_configured: "This app isn't connected to its database yet.",
  session_failed: "We couldn't start a session. Check your connection and try again.",
  not_authenticated: "Your session expired. Refresh the page to continue.",
  not_found: "That doesn't exist anymore.",
  not_member: "You're not part of this yet. Refresh the page to join.",
  forbidden: "Only the moderator can do that.",
  rate_limited: "Slow down a little. Try again in a few minutes.",
  phase_changed: "The board moved on. You're now seeing the latest step.",
  no_cards: "Add at least one card before moving on.",
  lane_closed: "That column is closed in this step.",
  voting_closed: "Voting is closed right now.",
  grouping_closed: "Cards can only be stacked during Group & vote.",
  reactions_closed: "Reactions are closed right now.",
  invalid_body: "Cards need some text (up to 500 characters).",
  invalid_title: "Titles need 1 to 80 characters.",
  invalid_password: "Passwords need 4 to 72 characters.",
  invalid_name: "Names need 1 to 40 characters.",
  name_required: "Tell us your name first.",
  invalid_cards: "A deck needs 2 to 40 different cards, each up to 6 characters.",
  invalid_card: "That card isn't in this room's deck.",
  not_a_player: "Only players can vote. Ask a moderator to switch your role.",
  no_story: "There's no story to vote on yet.",
  invalid_phase: "That step isn't available right now.",
  invalid_story: "That story is already closed.",
  last_moderator: "Every room needs at least one moderator.",
  invalid_role: "Pick Player or Observer, or keep Moderator on.",
  cannot_remove_owner: "The room owner can't be removed.",
  use_leave: "To remove yourself, leave the room from Your rooms.",
};

export function errorMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.code : error instanceof Error ? error.message : "";
  return MESSAGES[code] ?? "Something went wrong. Please try again.";
}
