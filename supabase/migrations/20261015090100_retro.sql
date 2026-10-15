-- Retro: anonymous sprint retrospectives.
--
-- Every board is listed publicly (title, phase, counts) so the team can find
-- past retros. Opening one makes you a member; a board password, when set, is
-- checked before membership is granted. During Brainstorm only the author can
-- read a card's text; everyone else gets a per-column count until the
-- moderator advances the board.

create type public.retro_phase as enum ('brainstorm', 'group_vote', 'action_items', 'done');
create type public.retro_lane as enum ('went_well', 'improve', 'questions', 'todo');

create table public.retro_boards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique default public.random_slug(),
  title text not null check (char_length(title) between 1 and 80),
  password_hash text,
  phase public.retro_phase not null default 'brainstorm',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.retro_members (
  board_id uuid not null references public.retro_boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'participant' check (role in ('moderator', 'participant')),
  -- Seed for the anonymous blob avatar shown in presence. Not tied to anything.
  avatar_seed text not null default public.random_slug(8),
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);
create index retro_members_user_idx on public.retro_members (user_id);

create table public.retro_groups (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.retro_boards (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index retro_groups_board_idx on public.retro_groups (board_id);

create table public.retro_cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.retro_boards (id) on delete cascade,
  -- Only ever used server-side to answer "is this mine?". Never returned.
  author_id uuid references auth.users (id) on delete set null,
  lane public.retro_lane not null,
  body text not null check (char_length(body) between 1 and 500),
  seq integer not null,
  group_id uuid references public.retro_groups (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (board_id, seq)
);
create index retro_cards_group_idx on public.retro_cards (group_id);

create table public.retro_votes (
  card_id uuid not null references public.retro_cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

create table public.retro_reactions (
  card_id uuid not null references public.retro_cards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '🎉', '❤️', '😄', '😩', '🚀')),
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

-- Failed password attempts, for throttling guesses.
create table public.retro_join_attempts (
  board_id uuid not null references public.retro_boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index retro_join_attempts_idx on public.retro_join_attempts (board_id, user_id, attempted_at);

-- One row per board. Its version bumps after every change; members subscribe
-- to it over Realtime and refetch their own filtered view of the board.
create table public.retro_signals (
  board_id uuid primary key references public.retro_boards (id) on delete cascade,
  version bigint not null default 0
);

alter table public.retro_boards enable row level security;
alter table public.retro_members enable row level security;
alter table public.retro_groups enable row level security;
alter table public.retro_cards enable row level security;
alter table public.retro_votes enable row level security;
alter table public.retro_reactions enable row level security;
alter table public.retro_join_attempts enable row level security;
alter table public.retro_signals enable row level security;

-- ------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ------------------------------------------------------------------

create or replace function public.retro_is_member(p_board uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.retro_members
    where board_id = p_board and user_id = auth.uid()
  );
$$;

create or replace function public.retro_role(p_board uuid, p_user uuid)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role from public.retro_members where board_id = p_board and user_id = p_user;
  if v_role is null then
    raise exception 'not_member';
  end if;
  return v_role;
end;
$$;

create or replace function public.retro_touch(p_board uuid)
returns void
language sql
set search_path = ''
as $$
  update public.retro_signals set version = version + 1 where board_id = p_board;
  update public.retro_boards set updated_at = now() where id = p_board;
$$;

-- Locks the board row so concurrent writers serialise, and returns it.
create or replace function public.retro_lock_board(p_board uuid)
returns public.retro_boards
language plpgsql
set search_path = ''
as $$
declare
  v_board public.retro_boards;
begin
  select * into v_board from public.retro_boards where id = p_board for update;
  if not found then
    raise exception 'not_found';
  end if;
  return v_board;
end;
$$;

-- A lane can be written to in exactly one phase.
create or replace function public.retro_lane_open(p_lane public.retro_lane, p_phase public.retro_phase)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_lane = 'todo' then p_phase = 'action_items'
    else p_phase = 'brainstorm'
  end;
$$;

-- Dissolves a group once it no longer holds two or more cards.
create or replace function public.retro_tidy_group(p_group uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_group is null then
    return;
  end if;
  if (select count(*) from public.retro_cards where group_id = p_group) < 2 then
    update public.retro_cards set group_id = null where group_id = p_group;
    delete from public.retro_groups where id = p_group;
  end if;
end;
$$;

-- ------------------------------------------------------------------
-- Client API
-- ------------------------------------------------------------------

create or replace function public.retro_create_board(p_title text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_board public.retro_boards;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
begin
  if (
    select count(*) from public.retro_members
    where user_id = v_uid and role = 'moderator' and joined_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'rate_limited';
  end if;

  insert into public.retro_boards (title)
  values (coalesce(left(v_title, 80), 'Retro ' || to_char(now(), 'DD Mon YYYY')))
  returning * into v_board;

  insert into public.retro_members (board_id, user_id, role) values (v_board.id, v_uid, 'moderator');
  insert into public.retro_signals (board_id) values (v_board.id);
  return v_board.slug;
end;
$$;

create or replace function public.retro_list_boards()
returns table (
  slug text,
  title text,
  phase public.retro_phase,
  created_at timestamptz,
  updated_at timestamptz,
  card_count integer,
  action_count integer,
  has_password boolean,
  is_member boolean,
  is_moderator boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    b.slug,
    b.title,
    b.phase,
    b.created_at,
    b.updated_at,
    (select count(*)::int from public.retro_cards c where c.board_id = b.id and c.lane <> 'todo'),
    (select count(*)::int from public.retro_cards c where c.board_id = b.id and c.lane = 'todo'),
    b.password_hash is not null,
    m.user_id is not null,
    coalesce(m.role = 'moderator', false)
  from public.retro_boards b
  left join public.retro_members m on m.board_id = b.id and m.user_id = auth.uid()
  where auth.uid() is not null
  order by b.updated_at desc
  limit 300;
$$;

create or replace function public.retro_join_board(p_slug text, p_password text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_board public.retro_boards;
begin
  select * into v_board from public.retro_boards where slug = p_slug;
  if not found then
    return 'not_found';
  end if;
  if exists (select 1 from public.retro_members where board_id = v_board.id and user_id = v_uid) then
    return 'ok';
  end if;

  if v_board.password_hash is not null then
    if p_password is null then
      return 'password_required';
    end if;
    if (
      select count(*) from public.retro_join_attempts
      where board_id = v_board.id and user_id = v_uid and attempted_at > now() - interval '10 minutes'
    ) >= 8 then
      return 'too_many_attempts';
    end if;
    if extensions.crypt(p_password, v_board.password_hash) <> v_board.password_hash then
      insert into public.retro_join_attempts (board_id, user_id) values (v_board.id, v_uid);
      return 'wrong_password';
    end if;
  end if;

  insert into public.retro_members (board_id, user_id) values (v_board.id, v_uid)
  on conflict do nothing;
  perform public.retro_touch(v_board.id);
  return 'ok';
end;
$$;

-- The board as the caller is allowed to see it.
create or replace function public.retro_get_board(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_board public.retro_boards;
  v_member public.retro_members;
  v_summary jsonb;
  v_cards jsonb;
  v_hidden jsonb;
begin
  select * into v_board from public.retro_boards where slug = p_slug;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_summary := jsonb_build_object(
    'id', v_board.id,
    'slug', v_board.slug,
    'title', v_board.title,
    'phase', v_board.phase,
    'has_password', v_board.password_hash is not null,
    'created_at', v_board.created_at
  );

  select * into v_member from public.retro_members where board_id = v_board.id and user_id = v_uid;
  if not found then
    return jsonb_build_object('status', 'join_required', 'board', v_summary);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'lane', c.lane,
      'body', c.body,
      'seq', c.seq,
      'group_id', c.group_id,
      'mine', c.author_id is not distinct from v_uid,
      'votes', (select count(*) from public.retro_votes v where v.card_id = c.id),
      'voted', exists (select 1 from public.retro_votes v where v.card_id = c.id and v.user_id = v_uid),
      'reactions', coalesce((
        select jsonb_object_agg(r.emoji, r.n)
        from (
          select emoji, count(*) as n from public.retro_reactions
          where card_id = c.id group by emoji
        ) r
      ), '{}'::jsonb),
      'my_reaction', (select emoji from public.retro_reactions r where r.card_id = c.id and r.user_id = v_uid)
    ) order by c.seq), '[]'::jsonb)
  into v_cards
  from public.retro_cards c
  where c.board_id = v_board.id
    and (v_board.phase <> 'brainstorm' or c.author_id is not distinct from v_uid);

  -- During Brainstorm, other people's cards are reported as counts only.
  if v_board.phase = 'brainstorm' then
    select coalesce(jsonb_object_agg(h.lane, h.n), '{}'::jsonb) into v_hidden
    from (
      select lane, count(*) as n from public.retro_cards
      where board_id = v_board.id and author_id is distinct from v_uid
      group by lane
    ) h;
  else
    v_hidden := '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'board', v_summary,
    'me', jsonb_build_object('role', v_member.role, 'avatar_seed', v_member.avatar_seed),
    'member_count', (select count(*) from public.retro_members where board_id = v_board.id),
    'cards', v_cards,
    'hidden', v_hidden
  );
end;
$$;

create or replace function public.retro_add_card(p_board uuid, p_lane public.retro_lane, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_board public.retro_boards;
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  perform public.retro_role(p_board, v_uid);
  v_board := public.retro_lock_board(p_board);
  if not public.retro_lane_open(p_lane, v_board.phase) then
    raise exception 'lane_closed';
  end if;
  if char_length(v_body) = 0 or char_length(v_body) > 500 then
    raise exception 'invalid_body';
  end if;

  insert into public.retro_cards (board_id, author_id, lane, body, seq)
  values (
    p_board, v_uid, p_lane, v_body,
    coalesce((select max(seq) from public.retro_cards where board_id = p_board), 0) + 1
  )
  returning id into v_id;

  perform public.retro_touch(p_board);
  return v_id;
end;
$$;

create or replace function public.retro_edit_card(p_card uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_card public.retro_cards;
  v_board public.retro_boards;
  v_body text := btrim(coalesce(p_body, ''));
begin
  select * into v_card from public.retro_cards where id = p_card;
  if not found or v_card.author_id is distinct from v_uid then
    raise exception 'forbidden';
  end if;
  v_board := public.retro_lock_board(v_card.board_id);
  if not public.retro_lane_open(v_card.lane, v_board.phase) then
    raise exception 'lane_closed';
  end if;
  if char_length(v_body) = 0 or char_length(v_body) > 500 then
    raise exception 'invalid_body';
  end if;
  update public.retro_cards set body = v_body where id = p_card;
  perform public.retro_touch(v_card.board_id);
end;
$$;

create or replace function public.retro_delete_card(p_card uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_card public.retro_cards;
  v_board public.retro_boards;
begin
  select * into v_card from public.retro_cards where id = p_card;
  if not found or v_card.author_id is distinct from v_uid then
    raise exception 'forbidden';
  end if;
  v_board := public.retro_lock_board(v_card.board_id);
  if not public.retro_lane_open(v_card.lane, v_board.phase) then
    raise exception 'lane_closed';
  end if;
  delete from public.retro_cards where id = p_card;
  perform public.retro_tidy_group(v_card.group_id);
  perform public.retro_touch(v_card.board_id);
end;
$$;

create or replace function public.retro_advance(p_board uuid, p_from public.retro_phase)
returns public.retro_phase
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_board public.retro_boards;
  v_next public.retro_phase;
begin
  if public.retro_role(p_board, v_uid) <> 'moderator' then
    raise exception 'forbidden';
  end if;
  v_board := public.retro_lock_board(p_board);
  -- Guards against double clicks and two tabs advancing at once.
  if v_board.phase <> p_from then
    raise exception 'phase_changed';
  end if;
  if p_from = 'brainstorm' and not exists (
    select 1 from public.retro_cards where board_id = p_board and lane <> 'todo'
  ) then
    raise exception 'no_cards';
  end if;

  v_next := case p_from
    when 'brainstorm' then 'group_vote'::public.retro_phase
    when 'group_vote' then 'action_items'::public.retro_phase
    when 'action_items' then 'done'::public.retro_phase
  end;
  if v_next is null then
    raise exception 'invalid_phase';
  end if;

  update public.retro_boards set phase = v_next where id = p_board;
  perform public.retro_touch(p_board);
  return v_next;
end;
$$;

-- One vote per topic per person, where a topic is a single card or a whole
-- group. Voting again on the same topic takes the vote back.
create or replace function public.retro_toggle_vote(p_card uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_card public.retro_cards;
  v_board public.retro_boards;
  v_topic uuid[];
begin
  select * into v_card from public.retro_cards where id = p_card;
  if not found then
    raise exception 'not_found';
  end if;
  perform public.retro_role(v_card.board_id, v_uid);
  v_board := public.retro_lock_board(v_card.board_id);
  -- Re-read under the lock: the card may have been regrouped meanwhile.
  select * into v_card from public.retro_cards where id = p_card;
  if v_board.phase <> 'group_vote' or v_card.lane = 'todo' then
    raise exception 'voting_closed';
  end if;

  if v_card.group_id is null then
    v_topic := array[v_card.id];
  else
    select array_agg(id) into v_topic from public.retro_cards where group_id = v_card.group_id;
  end if;

  delete from public.retro_votes where user_id = v_uid and card_id = any (v_topic);
  if found then
    perform public.retro_touch(v_card.board_id);
    return false;
  end if;

  insert into public.retro_votes (card_id, user_id) values (p_card, v_uid);
  perform public.retro_touch(v_card.board_id);
  return true;
end;
$$;

-- Stacks p_card onto p_target (moving it into the target's column).
create or replace function public.retro_group_cards(p_card uuid, p_target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_card public.retro_cards;
  v_target public.retro_cards;
  v_board public.retro_boards;
  v_group uuid;
begin
  if p_card = p_target then
    return;
  end if;
  select * into v_card from public.retro_cards where id = p_card;
  select * into v_target from public.retro_cards where id = p_target;
  if v_card.id is null or v_target.id is null or v_card.board_id <> v_target.board_id then
    raise exception 'not_found';
  end if;
  perform public.retro_role(v_card.board_id, v_uid);
  v_board := public.retro_lock_board(v_card.board_id);
  -- Re-read under the lock: either card may have been regrouped meanwhile.
  select * into v_card from public.retro_cards where id = p_card;
  select * into v_target from public.retro_cards where id = p_target;
  if v_board.phase <> 'group_vote' or v_card.lane = 'todo' or v_target.lane = 'todo' then
    raise exception 'grouping_closed';
  end if;

  v_group := v_target.group_id;
  if v_group is not null and v_group = v_card.group_id then
    return;
  end if;
  if v_group is null then
    insert into public.retro_groups (board_id) values (v_board.id) returning id into v_group;
    update public.retro_cards set group_id = v_group where id = v_target.id;
  end if;

  update public.retro_cards set group_id = v_group, lane = v_target.lane where id = v_card.id;
  perform public.retro_tidy_group(v_card.group_id);

  -- A merged topic keeps at most one vote per person (their earliest).
  delete from public.retro_votes v
  using (
    select card_id, user_id,
      row_number() over (partition by user_id order by created_at, card_id) as rn
    from public.retro_votes
    where card_id in (select id from public.retro_cards where group_id = v_group)
  ) d
  where v.card_id = d.card_id and v.user_id = d.user_id and d.rn > 1;

  perform public.retro_touch(v_board.id);
end;
$$;

create or replace function public.retro_ungroup_card(p_card uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_card public.retro_cards;
  v_board public.retro_boards;
begin
  select * into v_card from public.retro_cards where id = p_card;
  if not found then
    raise exception 'not_found';
  end if;
  perform public.retro_role(v_card.board_id, v_uid);
  v_board := public.retro_lock_board(v_card.board_id);
  if v_board.phase <> 'group_vote' then
    raise exception 'grouping_closed';
  end if;
  if v_card.group_id is null then
    return;
  end if;
  update public.retro_cards set group_id = null where id = p_card;
  perform public.retro_tidy_group(v_card.group_id);
  perform public.retro_touch(v_board.id);
end;
$$;

-- One reaction per person per card; picking the same emoji again removes it.
create or replace function public.retro_react(p_card uuid, p_emoji text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_card public.retro_cards;
  v_phase public.retro_phase;
begin
  select * into v_card from public.retro_cards where id = p_card;
  if not found then
    raise exception 'not_found';
  end if;
  perform public.retro_role(v_card.board_id, v_uid);
  select phase into v_phase from public.retro_boards where id = v_card.board_id;
  if v_phase not in ('group_vote', 'action_items') then
    raise exception 'reactions_closed';
  end if;

  delete from public.retro_reactions where card_id = p_card and user_id = v_uid and emoji = p_emoji;
  if not found then
    insert into public.retro_reactions (card_id, user_id, emoji) values (p_card, v_uid, p_emoji)
    on conflict (card_id, user_id) do update set emoji = excluded.emoji, created_at = now();
  end if;
  perform public.retro_touch(v_card.board_id);
end;
$$;

create or replace function public.retro_rename_board(p_board uuid, p_title text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_title text := btrim(coalesce(p_title, ''));
begin
  if public.retro_role(p_board, v_uid) <> 'moderator' then
    raise exception 'forbidden';
  end if;
  if char_length(v_title) = 0 or char_length(v_title) > 80 then
    raise exception 'invalid_title';
  end if;
  update public.retro_boards set title = v_title where id = p_board;
  perform public.retro_touch(p_board);
end;
$$;

-- A null or empty password removes protection. Existing members keep access.
create or replace function public.retro_set_password(p_board uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_password text := nullif(p_password, '');
begin
  if public.retro_role(p_board, v_uid) <> 'moderator' then
    raise exception 'forbidden';
  end if;
  if v_password is not null and (char_length(v_password) < 4 or char_length(v_password) > 72) then
    raise exception 'invalid_password';
  end if;
  update public.retro_boards
  set password_hash = case
    when v_password is null then null
    else extensions.crypt(v_password, extensions.gen_salt('bf', 10))
  end
  where id = p_board;
  perform public.retro_touch(p_board);
end;
$$;

create or replace function public.retro_delete_board(p_board uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  if public.retro_role(p_board, v_uid) <> 'moderator' then
    raise exception 'forbidden';
  end if;
  -- Bump first so open tabs refetch and find the board gone.
  perform public.retro_touch(p_board);
  delete from public.retro_boards where id = p_board;
end;
$$;

-- ------------------------------------------------------------------
-- Privileges and Realtime
-- ------------------------------------------------------------------

revoke all on table
  public.retro_boards, public.retro_members, public.retro_groups, public.retro_cards,
  public.retro_votes, public.retro_reactions, public.retro_join_attempts, public.retro_signals
from anon, authenticated;

grant select on table public.retro_signals to authenticated;
create policy "members can watch their board" on public.retro_signals
  for select to authenticated
  using (public.retro_is_member(board_id));

revoke execute on function
  public.retro_is_member(uuid),
  public.retro_role(uuid, uuid),
  public.retro_touch(uuid),
  public.retro_lock_board(uuid),
  public.retro_lane_open(public.retro_lane, public.retro_phase),
  public.retro_tidy_group(uuid)
from public, anon, authenticated;
-- The signals policy runs as the subscriber and needs the membership check.
grant execute on function public.retro_is_member(uuid) to authenticated;

revoke execute on function
  public.retro_create_board(text),
  public.retro_list_boards(),
  public.retro_join_board(text, text),
  public.retro_get_board(text),
  public.retro_add_card(uuid, public.retro_lane, text),
  public.retro_edit_card(uuid, text),
  public.retro_delete_card(uuid),
  public.retro_advance(uuid, public.retro_phase),
  public.retro_toggle_vote(uuid),
  public.retro_group_cards(uuid, uuid),
  public.retro_ungroup_card(uuid),
  public.retro_react(uuid, text),
  public.retro_rename_board(uuid, text),
  public.retro_set_password(uuid, text),
  public.retro_delete_board(uuid)
from public, anon;

grant execute on function
  public.retro_create_board(text),
  public.retro_list_boards(),
  public.retro_join_board(text, text),
  public.retro_get_board(text),
  public.retro_add_card(uuid, public.retro_lane, text),
  public.retro_edit_card(uuid, text),
  public.retro_delete_card(uuid),
  public.retro_advance(uuid, public.retro_phase),
  public.retro_toggle_vote(uuid),
  public.retro_group_cards(uuid, uuid),
  public.retro_ungroup_card(uuid),
  public.retro_react(uuid, text),
  public.retro_rename_board(uuid, text),
  public.retro_set_password(uuid, text),
  public.retro_delete_board(uuid)
to authenticated;

alter publication supabase_realtime add table public.retro_signals;
