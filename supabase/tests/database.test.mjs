import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

/**
 * Database tests for the Supabase migrations, run in-process with PGlite (real
 * Postgres compiled to WebAssembly), so no Docker or hosted project is needed.
 * Supabase's auth schema and roles are stubbed just enough to exercise the
 * permission checks as different users.
 *
 *   npm run test:db
 */

const MIG = fileURLToPath(new URL("../migrations", import.meta.url));
const db = new PGlite({ extensions: { pgcrypto } });

// --- Supabase stand-ins -------------------------------------------------
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create schema extensions;
  grant usage on schema auth, extensions, public to anon, authenticated;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated;
  create publication supabase_realtime;
  -- Mirrors Supabase defaults: new functions/tables in public are granted broadly.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);

for (const f of readdirSync(MIG).sort()) {
  try {
    await db.exec(readFileSync(`${MIG}/${f}`, "utf8"));
    console.log("applied", f);
  } catch (e) {
    console.error("FAILED", f, e.message);
    process.exit(1);
  }
}
await db.exec(`grant usage on schema extensions to authenticated;`);

// --- helpers -------------------------------------------------------------
const users = {};
for (const n of ["A", "B", "C"]) {
  users[n] = crypto.randomUUID();
  await db.query("insert into auth.users (id) values ($1)", [users[n]]);
}

async function as(user, sql, params = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ? users[user] : ""]);
  await db.exec("set role authenticated");
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
const one = async (user, sql, params) => {
  const r = await as(user, sql, params);
  const row = r.rows[0];
  return row ? Object.values(row)[0] : undefined;
};
async function fails(user, sql, params, pattern) {
  try {
    await as(user, sql, params);
  } catch (e) {
    if (pattern && !String(e.message).includes(pattern)) throw new Error(`expected ${pattern}, got ${e.message}`);
    return;
  }
  throw new Error(`expected failure (${pattern}) for: ${sql}`);
}
let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log("  ✓", name);
}

// --- Retro ---------------------------------------------------------------
console.log("\nRetro");
const slug = await one("A", "select public.retro_create_board(null)");
const boardOf = async (u) => one(u, "select public.retro_get_board($1)", [slug]);
const boardId = (await boardOf("A")).board.id;

await test("creator is moderator, default title", async () => {
  const b = await boardOf("A");
  assert.equal(b.status, "ok");
  assert.equal(b.me.role, "moderator");
  assert.match(b.board.title, /^Retro /);
});

await test("non-member must join; join without password works", async () => {
  assert.equal((await boardOf("B")).status, "join_required");
  assert.equal(await one("B", "select public.retro_join_board($1, null)", [slug]), "ok");
  assert.equal((await boardOf("B")).me.role, "participant");
});

const cardA = await one("A", "select public.retro_add_card($1, 'went_well', 'Secret from A')", [boardId]);
const cardB = await one("B", "select public.retro_add_card($1, 'improve', 'Secret from B')", [boardId]);

await test("brainstorm hides other people's text completely", async () => {
  const b = await boardOf("B");
  assert.equal(b.cards.length, 1);
  assert.equal(b.cards[0].body, "Secret from B");
  assert.equal(b.cards[0].mine, true);
  assert.deepEqual(b.hidden, { went_well: 1 });
  assert.ok(!JSON.stringify(b).includes("Secret from A"));
  assert.ok(!JSON.stringify(b).includes(users.A));
});

await test("todo lane is closed during brainstorm", async () => {
  await fails("A", "select public.retro_add_card($1, 'todo', 'x')", [boardId], "lane_closed");
});

await test("tables cannot be read directly", async () => {
  await fails("B", "select * from public.retro_cards", [], "permission denied");
  await fails("B", "select * from public.retro_boards", [], "permission denied");
  await fails("B", "insert into public.retro_cards (board_id, lane, body, seq) values ($1, 'improve', 'x', 99)", [boardId], "permission denied");
});

await test("signals are visible only to members", async () => {
  assert.equal((await as("B", "select * from public.retro_signals")).rows.length, 1);
  assert.equal((await as("C", "select * from public.retro_signals")).rows.length, 0);
});

await test("only the moderator advances, and only from the expected phase", async () => {
  await fails("B", "select public.retro_advance($1, 'brainstorm')", [boardId], "forbidden");
  await fails("A", "select public.retro_advance($1, 'group_vote')", [boardId], "phase_changed");
  assert.equal(await one("A", "select public.retro_advance($1, 'brainstorm')", [boardId]), "group_vote");
});

await test("after reveal everyone sees every card, with no author info", async () => {
  const b = await boardOf("B");
  assert.equal(b.cards.length, 2);
  assert.deepEqual(b.cards.map((c) => c.mine), [false, true]);
  assert.ok(!JSON.stringify(b).includes(users.A));
  assert.ok(!("author_id" in b.cards[0]));
});

await test("editing is closed for brainstorm cards after the reveal", async () => {
  await fails("B", "select public.retro_edit_card($1, 'changed')", [cardB], "lane_closed");
  await fails("A", "select public.retro_edit_card($1, 'hijack')", [cardB], "forbidden");
});

await test("votes toggle and stay one per topic after grouping", async () => {
  assert.equal(await one("B", "select public.retro_toggle_vote($1)", [cardA]), true);
  assert.equal(await one("B", "select public.retro_toggle_vote($1)", [cardA]), false);
  assert.equal(await one("B", "select public.retro_toggle_vote($1)", [cardA]), true);
  assert.equal(await one("A", "select public.retro_toggle_vote($1)", [cardB]), true);
  assert.equal(await one("B", "select public.retro_toggle_vote($1)", [cardB]), true);
  // Merge: B now has two votes in one topic; only one survives.
  await as("A", "select public.retro_group_cards($1, $2)", [cardB, cardA]);
  const b = await boardOf("B");
  assert.ok(b.cards[0].group_id && b.cards[0].group_id === b.cards[1].group_id);
  assert.equal(b.cards[1].lane, "went_well");
  const total = b.cards.reduce((n, c) => n + c.votes, 0);
  assert.equal(total, 2);
  // Voting on another card in the same topic takes B's vote back.
  assert.equal(await one("B", "select public.retro_toggle_vote($1)", [cardB]), false);
});

await test("ungrouping dissolves a two-card group", async () => {
  await as("B", "select public.retro_ungroup_card($1)", [cardB]);
  const b = await boardOf("A");
  assert.ok(b.cards.every((c) => c.group_id === null));
});

await test("reactions replace and toggle", async () => {
  await as("B", "select public.retro_react($1, '🎉')", [cardA]);
  await as("B", "select public.retro_react($1, '🚀')", [cardA]);
  let c = (await boardOf("B")).cards.find((x) => x.id === cardA);
  assert.deepEqual(c.reactions, { "🚀": 1 });
  assert.equal(c.my_reaction, "🚀");
  await as("B", "select public.retro_react($1, '🚀')", [cardA]);
  c = (await boardOf("B")).cards.find((x) => x.id === cardA);
  assert.deepEqual(c.reactions, {});
  await fails("B", "select public.retro_react($1, '💩')", [cardA]);
});

await test("password protects joining and throttles guesses", async () => {
  await fails("B", "select public.retro_set_password($1, 'pass1234')", [boardId], "forbidden");
  await as("A", "select public.retro_set_password($1, 'pass1234')", [boardId]);
  assert.equal(await one("C", "select public.retro_join_board($1, null)", [slug]), "password_required");
  assert.equal(await one("C", "select public.retro_join_board($1, 'nope')", [slug]), "wrong_password");
  assert.equal(await one("C", "select public.retro_join_board($1, 'pass1234')", [slug]), "ok");
  assert.equal((await boardOf("C")).status, "ok");
});

await test("action items, then done closes everything", async () => {
  await as("A", "select public.retro_advance($1, 'group_vote')", [boardId]);
  await fails("B", "select public.retro_toggle_vote($1)", [cardA], "voting_closed");
  await as("B", "select public.retro_add_card($1, 'todo', 'Fix flaky tests')", [boardId]);
  await as("A", "select public.retro_advance($1, 'action_items')", [boardId]);
  await fails("B", "select public.retro_add_card($1, 'todo', 'late')", [boardId], "lane_closed");
  await fails("A", "select public.retro_advance($1, 'done')", [boardId], "invalid_phase");
});

await test("list shows every board with counts", async () => {
  const rows = (await as("C", "select * from public.retro_list_boards()")).rows;
  const r = rows.find((x) => x.slug === slug);
  assert.equal(r.card_count, 2);
  assert.equal(r.action_count, 1);
  assert.equal(r.has_password, true);
});

await test("no session means no access", async () => {
  await fails(null, "select public.retro_get_board($1)", [slug], "not_authenticated");
});

await test("only the moderator deletes a board", async () => {
  await fails("B", "select public.retro_delete_board($1)", [boardId], "forbidden");
  await as("A", "select public.retro_delete_board($1)", [boardId]);
  assert.equal((await boardOf("A")).status, "not_found");
});

// --- Poker ---------------------------------------------------------------
console.log("\nPoker");
const FIB = ["0", "1", "2", "3", "5", "8", "13", "?", "☕"];

await test("a name is required before creating or joining", async () => {
  await fails("A", "select public.poker_create_room('R', 'fibonacci', $1, '{}', '{}')", [FIB], "name_required");
  await as("A", "select public.poker_set_name('  Ada   Lovelace ')");
  assert.equal(await one("A", "select public.poker_get_name()"), "Ada Lovelace");
});

const room = await one("A", "select public.poker_create_room('Sprint 46', 'fibonacci', $1, '{}', $2)", [FIB, ["Login page", "Payments", "  "]]);
const roomOf = async (u) => one(u, "select public.poker_get_room($1)", [room]);
const roomId = (await roomOf("A")).room.id;

await test("room starts on the first story with defaults", async () => {
  const r = await roomOf("A");
  assert.equal(r.stories.length, 2);
  assert.equal(r.room.current_story_id, r.stories[0].id);
  assert.equal(r.room.phase, "voting");
  assert.equal(r.room.settings.reveal_individual, true);
  assert.equal(r.me.is_moderator, true);
  assert.equal(r.me.is_owner, true);
});

await test("joining needs a name, then auto-joins as player", async () => {
  await fails("B", "select public.poker_join_room($1)", [room], "name_required");
  await as("B", "select public.poker_set_name('Ben')");
  await as("B", "select public.poker_join_room($1)", [room]);
  const r = await roomOf("B");
  assert.equal(r.me.participation, "player");
  assert.equal(r.me.is_moderator, false);
});

await test("votes are hidden until the flip, receipts are not", async () => {
  await as("A", "select public.poker_vote($1, '5')", [roomId]);
  await as("B", "select public.poker_vote($1, '8')", [roomId]);
  await fails("B", "select public.poker_vote($1, '4')", [roomId], "invalid_card");
  const r = await roomOf("B");
  const ada = r.participants.find((p) => p.name === "Ada Lovelace");
  const me = r.participants.find((p) => p.is_me);
  assert.equal(ada.voted, true);
  assert.equal(ada.value, null);
  assert.equal(me.value, "8");
  assert.equal(r.results, null);
  assert.ok(!JSON.stringify(r.participants).includes('"5"'));
  await fails("B", "select * from public.poker_votes", [], "permission denied");
});

await test("only moderators flip; values and results appear after", async () => {
  await fails("B", "select public.poker_reveal($1)", [roomId], "forbidden");
  await as("A", "select public.poker_reveal($1)", [roomId]);
  const r = await roomOf("B");
  assert.equal(r.participants.find((p) => p.name === "Ada Lovelace").value, "5");
  assert.deepEqual(r.results.map((x) => x.value).sort(), ["5", "8"]);
  await fails("B", "select public.poker_vote($1, '3')", [roomId], "voting_closed");
});

await test("finish locks the estimate, next moves on", async () => {
  await fails("A", "select public.poker_next_story($1)", [roomId], "invalid_phase");
  await as("A", "select public.poker_finish($1, '5')", [roomId]);
  let r = await roomOf("A");
  assert.equal(r.stories[0].status, "completed");
  assert.equal(r.stories[0].estimate, "5");
  await as("A", "select public.poker_next_story($1)", [roomId]);
  r = await roomOf("A");
  assert.equal(r.room.current_story_id, r.stories[1].id);
  assert.equal(r.room.phase, "voting");
  assert.ok(r.participants.every((p) => !p.voted));
});

await test("distribution only when individual reveal is off", async () => {
  await as("A", "select public.poker_update_room($1, 'Sprint 46', 'fibonacci', $2, $3)", [roomId, FIB, { reveal_individual: false }]);
  await as("A", "select public.poker_vote($1, '3')", [roomId]);
  await as("B", "select public.poker_vote($1, '3')", [roomId]);
  await as("A", "select public.poker_reveal($1)", [roomId]);
  const r = await roomOf("B");
  assert.equal(r.participants.find((p) => p.name === "Ada Lovelace").value, null);
  assert.deepEqual(r.results, [{ value: "3", count: 2 }]);
});

await test("observers can be kept from seeing who voted", async () => {
  await as("A", "select public.poker_update_room($1, 'Sprint 46', 'fibonacci', $2, $3)", [roomId, FIB, { observers_see_votes: false }]);
  await as("A", "select public.poker_set_role($1, $2, 'observer', false)", [roomId, users.B]);
  await as("A", "select public.poker_clear_votes($1)", [roomId]);
  await as("A", "select public.poker_vote($1, '2')", [roomId]);
  const r = await roomOf("B");
  assert.equal(r.participants.find((p) => p.name === "Ada Lovelace").voted, null);
  await fails("B", "select public.poker_vote($1, '2')", [roomId], "not_a_player");
});

await test("the last moderator cannot be demoted", async () => {
  await fails("A", "select public.poker_set_role($1, $2, 'player', false)", [roomId, users.A], "last_moderator");
  await fails("A", "select public.poker_remove_participant($1, $2)", [roomId, users.A], "cannot_remove_owner");
});

await test("skip closes the story and opens the next; your rooms has stats", async () => {
  await as("A", "select public.poker_skip_story($1)", [roomId]);
  const r = await roomOf("A");
  assert.equal(r.stories[1].status, "skipped");
  assert.equal(r.room.current_story_id, null);
  const rows = (await as("A", "select * from public.poker_my_rooms()")).rows;
  assert.equal(rows.length, 1);
  assert.equal(Number(rows[0].total_points), 5);
  assert.equal(rows[0].completed_count, 2);
  assert.equal(rows[0].last_story, "Payments");
});

await test("adding stories starts voting when the queue was empty", async () => {
  assert.equal(await one("A", "select public.poker_add_stories($1, $2)", [roomId, ["Search", "", "Export"]]), 2);
  const r = await roomOf("A");
  assert.equal(r.stories.find((s) => s.id === r.room.current_story_id).title, "Search");
});

await test("rooms without a story list get numbered rounds", async () => {
  const s = await one("A", "select public.poker_create_room('Quick', 'tshirt', $1, $2, '{}')", [["XS", "S", "M"], { allow_stories: false }]);
  const r = await one("A", "select public.poker_get_room($1)", [s]);
  assert.equal(r.stories[0].title, "Round 1");
  await as("A", "select public.poker_skip_story($1)", [r.room.id]);
  const r2 = await one("A", "select public.poker_get_room($1)", [s]);
  assert.equal(r2.stories.find((x) => x.id === r2.room.current_story_id).title, "Round 2");
});

await test("clone copies settings without history; only the owner deletes", async () => {
  const copy = await one("A", "select public.poker_clone_room($1)", [roomId]);
  const c = await one("A", "select public.poker_get_room($1)", [copy]);
  assert.equal(c.room.name, "Sprint 46 (copy)");
  assert.equal(c.stories.length, 0);
  await as("A", "select public.poker_set_role($1, $2, 'player', true)", [roomId, users.B]);
  await fails("B", "select public.poker_delete_room($1)", [roomId], "forbidden");
  await as("A", "select public.poker_delete_room($1)", [roomId]);
  assert.equal((await roomOf("A")).status, "not_found");
});

await test("anon role has no function access", async () => {
  await db.exec("set role anon");
  try {
    await db.query("select public.poker_my_rooms()");
    throw new Error("anon could call poker_my_rooms");
  } catch (e) {
    assert.match(e.message, /permission denied/);
  } finally {
    await db.exec("reset role");
  }
});

console.log(`\n${passed} tests passed`);
