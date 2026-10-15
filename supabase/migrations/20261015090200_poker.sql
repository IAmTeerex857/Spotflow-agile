-- Poker: planning poker rooms.
--
-- No accounts: each browser has an anonymous session and a display name.
-- Anyone with a room link can join as a player. A room's history belongs to
-- the people who joined it ("Your rooms"). Vote values stay on the server
-- until the moderator flips the cards; before that, others only learn that
-- someone has voted.

create type public.poker_phase as enum ('voting', 'revealed', 'finished');
create type public.poker_participation as enum ('player', 'observer', 'none');
create type public.poker_story_status as enum ('active', 'completed', 'skipped');

create table public.poker_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  updated_at timestamptz not null default now()
);

create table public.poker_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique default public.random_slug(),
  name text not null check (char_length(name) between 1 and 80),
  owner_id uuid references auth.users (id) on delete set null,
  deck text not null check (deck in ('scrum', 'fibonacci', 'sequential', 'hours', 'tshirt', 'custom')),
  cards text[] not null check (cardinality(cards) between 2 and 40),
  settings jsonb not null,
  phase public.poker_phase not null default 'voting',
  current_story_id uuid,
  round_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create table public.poker_participants (
  room_id uuid not null references public.poker_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  participation public.poker_participation not null default 'player',
  is_moderator boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  -- "none" means moderator-only; everyone else plays or observes.
  check (is_moderator or participation <> 'none')
);
create index poker_participants_user_idx on public.poker_participants (user_id);

create table public.poker_stories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.poker_rooms (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  position double precision not null,
  status public.poker_story_status not null default 'active',
  estimate text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);
create index poker_stories_room_idx on public.poker_stories (room_id, position);

alter table public.poker_rooms
  add constraint poker_rooms_current_story_fk
  foreign key (current_story_id) references public.poker_stories (id) on delete set null;

create table public.poker_votes (
  story_id uuid not null references public.poker_stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value text not null,
  -- Time from the start of the round to this vote, for the history stats.
  seconds integer not null default 0,
  voted_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

-- One row per room; its version bumps after every change (see retro_signals).
create table public.poker_signals (
  room_id uuid primary key references public.poker_rooms (id) on delete cascade,
  version bigint not null default 0
);

alter table public.poker_profiles enable row level security;
alter table public.poker_rooms enable row level security;
alter table public.poker_participants enable row level security;
alter table public.poker_stories enable row level security;
alter table public.poker_votes enable row level security;
alter table public.poker_signals enable row level security;

-- ------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ------------------------------------------------------------------

create or replace function public.poker_is_participant(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.poker_participants
    where room_id = p_room and user_id = auth.uid()
  );
$$;

create or replace function public.poker_member(p_room uuid, p_user uuid)
returns public.poker_participants
language plpgsql
stable
set search_path = ''
as $$
declare
  v_row public.poker_participants;
begin
  select * into v_row from public.poker_participants where room_id = p_room and user_id = p_user;
  if not found then
    raise exception 'not_member';
  end if;
  return v_row;
end;
$$;

create or replace function public.poker_require_moderator(p_room uuid, p_user uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not (public.poker_member(p_room, p_user)).is_moderator then
    raise exception 'forbidden';
  end if;
end;
$$;

create or replace function public.poker_lock_room(p_room uuid)
returns public.poker_rooms
language plpgsql
set search_path = ''
as $$
declare
  v_room public.poker_rooms;
begin
  select * into v_room from public.poker_rooms where id = p_room for update;
  if not found then
    raise exception 'not_found';
  end if;
  return v_room;
end;
$$;

create or replace function public.poker_touch(p_room uuid)
returns void
language sql
set search_path = ''
as $$
  update public.poker_signals set version = version + 1 where room_id = p_room;
  update public.poker_rooms set last_used_at = now() where id = p_room;
$$;

create or replace function public.poker_require_name(p_user uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not exists (select 1 from public.poker_profiles where user_id = p_user) then
    raise exception 'name_required';
  end if;
end;
$$;

-- Known settings only, with defaults filled in and values type-checked.
create or replace function public.poker_clean_settings(p_settings jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_in jsonb := coalesce(p_settings, '{}'::jsonb);
  v_seconds integer;
  v_flag text;
  v_out jsonb := '{}'::jsonb;
  v_defaults constant jsonb := jsonb_build_object(
    'allow_stories', true,
    'confirm_skip', true,
    'observers_see_votes', true,
    'reveal_individual', true,
    'allow_vote_change', false,
    'countdown', false
  );
begin
  for v_flag in select jsonb_object_keys(v_defaults) loop
    v_out := v_out || jsonb_build_object(
      v_flag,
      case jsonb_typeof(v_in -> v_flag) when 'boolean' then v_in -> v_flag else v_defaults -> v_flag end
    );
  end loop;
  v_seconds := case when jsonb_typeof(v_in -> 'countdown_seconds') = 'number'
    then (v_in ->> 'countdown_seconds')::numeric::integer else 60 end;
  return v_out || jsonb_build_object('countdown_seconds', greatest(10, least(600, v_seconds)));
end;
$$;

create or replace function public.poker_clean_cards(p_cards text[])
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_cards text[];
begin
  select array_agg(c order by ord) into v_cards
  from (
    select btrim(c) as c, min(ord) as ord
    from unnest(p_cards) with ordinality as t (c, ord)
    where btrim(c) <> ''
    group by btrim(c)
  ) d;
  if v_cards is null or cardinality(v_cards) < 2 or cardinality(v_cards) > 40
    or exists (select 1 from unnest(v_cards) c where char_length(c) > 6) then
    raise exception 'invalid_cards';
  end if;
  return v_cards;
end;
$$;

-- Starts a fresh voting round on p_story (or nothing, when null).
create or replace function public.poker_start_round(p_room uuid, p_story uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.poker_rooms
  set current_story_id = p_story, phase = 'voting', round_started_at = now()
  where id = p_room;
  if p_story is not null then
    delete from public.poker_votes where story_id = p_story;
    update public.poker_stories set started_at = now() where id = p_story;
  end if;
end;
$$;

-- The next story to vote on. Rooms without a story list get numbered rounds.
create or replace function public.poker_next_story_id(p_room uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_room public.poker_rooms;
  v_story uuid;
  v_count integer;
begin
  select * into v_room from public.poker_rooms where id = p_room;
  select id into v_story from public.poker_stories
  where room_id = p_room and status = 'active' and id is distinct from v_room.current_story_id
  order by position, id
  limit 1;
  if v_story is null and not (v_room.settings ->> 'allow_stories')::boolean then
    select count(*) into v_count from public.poker_stories where room_id = p_room;
    insert into public.poker_stories (room_id, title, position)
    values (p_room, 'Round ' || (v_count + 1), v_count + 1)
    returning id into v_story;
  end if;
  return v_story;
end;
$$;

-- Closes the current story with a status, adding its voting time.
create or replace function public.poker_close_story(p_story uuid, p_status public.poker_story_status, p_estimate text)
returns void
language sql
set search_path = ''
as $$
  update public.poker_stories
  set status = p_status,
      estimate = p_estimate,
      completed_at = now(),
      duration_seconds = duration_seconds
        + greatest(0, extract(epoch from now() - coalesce(started_at, now()))::integer)
  where id = p_story;
$$;

-- ------------------------------------------------------------------
-- Client API: identity and rooms
-- ------------------------------------------------------------------

create or replace function public.poker_get_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select name from public.poker_profiles where user_id = auth.uid();
$$;

create or replace function public.poker_set_name(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_room uuid;
begin
  if char_length(v_name) = 0 or char_length(v_name) > 40 then
    raise exception 'invalid_name';
  end if;
  insert into public.poker_profiles (user_id, name) values (v_uid, v_name)
  on conflict (user_id) do update set name = excluded.name, updated_at = now();
  for v_room in select room_id from public.poker_participants where user_id = v_uid loop
    update public.poker_signals set version = version + 1 where room_id = v_room;
  end loop;
end;
$$;

create or replace function public.poker_create_room(
  p_name text,
  p_deck text,
  p_cards text[],
  p_settings jsonb,
  p_stories text[] default '{}'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_room public.poker_rooms;
begin
  perform public.poker_require_name(v_uid);
  if char_length(v_name) = 0 or char_length(v_name) > 80 then
    raise exception 'invalid_name';
  end if;
  if (select count(*) from public.poker_rooms where owner_id = v_uid and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate_limited';
  end if;

  insert into public.poker_rooms (name, owner_id, deck, cards, settings)
  values (v_name, v_uid, p_deck, public.poker_clean_cards(p_cards), public.poker_clean_settings(p_settings))
  returning * into v_room;

  insert into public.poker_participants (room_id, user_id, participation, is_moderator)
  values (v_room.id, v_uid, 'player', true);
  insert into public.poker_signals (room_id) values (v_room.id);

  insert into public.poker_stories (room_id, title, position)
  select v_room.id, left(btrim(t), 300), ord
  from unnest(coalesce(p_stories, '{}')) with ordinality as s (t, ord)
  where btrim(t) <> ''
  limit 500;

  perform public.poker_start_round(v_room.id, public.poker_next_story_id(v_room.id));
  return v_room.slug;
end;
$$;

create or replace function public.poker_update_room(p_room uuid, p_name text, p_deck text, p_cards text[], p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_name text := btrim(coalesce(p_name, ''));
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if char_length(v_name) = 0 or char_length(v_name) > 80 then
    raise exception 'invalid_name';
  end if;
  update public.poker_rooms
  set name = v_name,
      deck = p_deck,
      cards = public.poker_clean_cards(p_cards),
      settings = public.poker_clean_settings(p_settings)
  where id = p_room;
  if v_room.current_story_id is null then
    perform public.poker_start_round(p_room, public.poker_next_story_id(p_room));
  end if;
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_join_room(p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_name(v_uid);
  select * into v_room from public.poker_rooms where slug = p_slug;
  if not found then
    raise exception 'not_found';
  end if;
  if not exists (select 1 from public.poker_participants where room_id = v_room.id and user_id = v_uid) then
    insert into public.poker_participants (room_id, user_id, is_moderator)
    values (
      v_room.id, v_uid,
      -- A room left without a moderator hands the role to the next person in.
      not exists (select 1 from public.poker_participants where room_id = v_room.id and is_moderator)
    );
    perform public.poker_touch(v_room.id);
  end if;
  return v_room.id;
end;
$$;

create or replace function public.poker_leave_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_me public.poker_participants := public.poker_member(p_room, v_uid);
begin
  if v_me.is_moderator
    and not exists (select 1 from public.poker_participants where room_id = p_room and is_moderator and user_id <> v_uid)
    and exists (select 1 from public.poker_participants where room_id = p_room and user_id <> v_uid)
  then
    raise exception 'last_moderator';
  end if;
  delete from public.poker_participants where room_id = p_room and user_id = v_uid;
  perform public.poker_touch(p_room);
end;
$$;

-- Rooms the caller has joined, with the stats shown on "Your rooms".
create or replace function public.poker_my_rooms()
returns table (
  id uuid,
  slug text,
  name text,
  deck text,
  is_owner boolean,
  is_moderator boolean,
  created_at timestamptz,
  last_used_at timestamptz,
  story_count integer,
  completed_count integer,
  total_points numeric,
  total_seconds integer,
  avg_seconds integer,
  last_story text,
  fastest_name text,
  fastest_seconds integer,
  slowest_name text,
  slowest_seconds integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.slug,
    r.name,
    r.deck,
    r.owner_id is not distinct from auth.uid(),
    me.is_moderator,
    r.created_at,
    r.last_used_at,
    s.story_count,
    s.completed_count,
    s.total_points,
    s.total_seconds,
    case when s.completed_count > 0 then s.total_seconds / s.completed_count end,
    ls.title,
    fast.name,
    fast.secs,
    slow.name,
    slow.secs
  from public.poker_participants me
  join public.poker_rooms r on r.id = me.room_id
  cross join lateral (
    select
      count(*)::int as story_count,
      count(*) filter (where st.status <> 'active')::int as completed_count,
      coalesce(sum(case
        when st.estimate = '½' then 0.5
        when st.estimate ~ '^[0-9]+(\.[0-9]+)?$' then st.estimate::numeric
      end), 0) as total_points,
      coalesce(sum(st.duration_seconds) filter (where st.status <> 'active'), 0)::int as total_seconds
    from public.poker_stories st
    where st.room_id = r.id
  ) s
  left join lateral (
    select st.title from public.poker_stories st
    where st.room_id = r.id and st.status <> 'active'
    order by st.completed_at desc nulls last
    limit 1
  ) ls on true
  left join lateral (
    select p.name, avg(v.seconds)::int as secs
    from public.poker_votes v
    join public.poker_stories st on st.id = v.story_id and st.status = 'completed'
    join public.poker_profiles p on p.user_id = v.user_id
    where st.room_id = r.id
    group by p.user_id, p.name
    order by avg(v.seconds) asc
    limit 1
  ) fast on true
  left join lateral (
    select p.name, avg(v.seconds)::int as secs
    from public.poker_votes v
    join public.poker_stories st on st.id = v.story_id and st.status = 'completed'
    join public.poker_profiles p on p.user_id = v.user_id
    where st.room_id = r.id
    group by p.user_id, p.name
    order by avg(v.seconds) desc
    limit 1
  ) slow on true
  where me.user_id = auth.uid()
  order by r.last_used_at desc;
$$;

-- The room as the caller is allowed to see it.
create or replace function public.poker_get_room(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
  v_me public.poker_participants;
  v_revealed boolean;
  v_see_receipts boolean;
  v_see_values boolean;
  v_participants jsonb;
  v_stories jsonb;
  v_results jsonb;
begin
  select * into v_room from public.poker_rooms where slug = p_slug;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  select * into v_me from public.poker_participants where room_id = v_room.id and user_id = v_uid;
  if not found then
    return jsonb_build_object('status', 'join_required', 'room', jsonb_build_object('name', v_room.name));
  end if;

  v_revealed := v_room.phase in ('revealed', 'finished');
  -- Players and moderators always see who has voted; observers only if allowed.
  v_see_receipts := v_me.participation = 'player' or v_me.is_moderator
    or (v_room.settings ->> 'observers_see_votes')::boolean;
  v_see_values := v_revealed and (v_room.settings ->> 'reveal_individual')::boolean;

  select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', p.user_id,
      'name', coalesce(pr.name, 'Guest'),
      'participation', p.participation,
      'is_moderator', p.is_moderator,
      'is_owner', p.user_id is not distinct from v_room.owner_id,
      'is_me', p.user_id = v_uid,
      'voted', case when v_see_receipts or p.user_id = v_uid then v.user_id is not null end,
      'value', case when p.user_id = v_uid or v_see_values then v.value end,
      'seconds', case when v_see_receipts or p.user_id = v_uid then v.seconds end
    ) order by p.joined_at), '[]'::jsonb)
  into v_participants
  from public.poker_participants p
  left join public.poker_profiles pr on pr.user_id = p.user_id
  left join public.poker_votes v on v.story_id = v_room.current_story_id and v.user_id = p.user_id
  where p.room_id = v_room.id;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', st.id,
      'title', st.title,
      'position', st.position,
      'status', st.status,
      'estimate', st.estimate,
      'duration_seconds', st.duration_seconds
    ) order by st.position, st.id), '[]'::jsonb)
  into v_stories
  from public.poker_stories st
  where st.room_id = v_room.id;

  if v_revealed then
    select coalesce(jsonb_agg(jsonb_build_object('value', d.value, 'count', d.n) order by d.n desc, d.value), '[]'::jsonb)
    into v_results
    from (
      select v.value, count(*) as n
      from public.poker_votes v
      join public.poker_participants p on p.room_id = v_room.id and p.user_id = v.user_id and p.participation = 'player'
      where v.story_id = v_room.current_story_id
      group by v.value
    ) d;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'now', now(),
    'room', jsonb_build_object(
      'id', v_room.id,
      'slug', v_room.slug,
      'name', v_room.name,
      'deck', v_room.deck,
      'cards', to_jsonb(v_room.cards),
      'settings', v_room.settings,
      'phase', v_room.phase,
      'current_story_id', v_room.current_story_id,
      'round_started_at', v_room.round_started_at
    ),
    'me', jsonb_build_object(
      'user_id', v_uid,
      'participation', v_me.participation,
      'is_moderator', v_me.is_moderator,
      'is_owner', v_room.owner_id is not distinct from v_uid
    ),
    'participants', v_participants,
    'stories', v_stories,
    'results', v_results
  );
end;
$$;

create or replace function public.poker_clear_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  perform public.poker_require_moderator(p_room, v_uid);
  perform public.poker_lock_room(p_room);
  update public.poker_rooms set current_story_id = null where id = p_room;
  delete from public.poker_stories where room_id = p_room;
  perform public.poker_start_round(p_room, public.poker_next_story_id(p_room));
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_clone_room(p_room uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_src public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  select * into v_src from public.poker_rooms where id = p_room;
  return public.poker_create_room(left(v_src.name, 73) || ' (copy)', v_src.deck, v_src.cards, v_src.settings, '{}');
end;
$$;

create or replace function public.poker_delete_room(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  if not exists (select 1 from public.poker_rooms where id = p_room and owner_id = v_uid) then
    raise exception 'forbidden';
  end if;
  perform public.poker_touch(p_room);
  delete from public.poker_rooms where id = p_room;
end;
$$;

-- ------------------------------------------------------------------
-- Client API: voting
-- ------------------------------------------------------------------

-- A null value takes the vote back.
create or replace function public.poker_vote(p_room uuid, p_value text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_me public.poker_participants := public.poker_member(p_room, v_uid);
  v_room public.poker_rooms;
begin
  select * into v_room from public.poker_rooms where id = p_room;
  if v_me.participation <> 'player' then
    raise exception 'not_a_player';
  end if;
  if v_room.current_story_id is null then
    raise exception 'no_story';
  end if;
  if not (
    v_room.phase = 'voting'
    or (v_room.phase = 'revealed' and (v_room.settings ->> 'allow_vote_change')::boolean)
  ) then
    raise exception 'voting_closed';
  end if;

  if p_value is null then
    delete from public.poker_votes where story_id = v_room.current_story_id and user_id = v_uid;
  else
    if not (p_value = any (v_room.cards)) then
      raise exception 'invalid_card';
    end if;
    insert into public.poker_votes (story_id, user_id, value, seconds)
    values (
      v_room.current_story_id, v_uid, p_value,
      greatest(0, extract(epoch from now() - v_room.round_started_at)::integer)
    )
    on conflict (story_id, user_id) do update
      set value = excluded.value, seconds = excluded.seconds, voted_at = now();
  end if;
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_reveal(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if v_room.phase <> 'voting' or v_room.current_story_id is null then
    raise exception 'invalid_phase';
  end if;
  update public.poker_rooms set phase = 'revealed' where id = p_room;
  perform public.poker_touch(p_room);
end;
$$;

-- Locks in the estimate for the current story.
create or replace function public.poker_finish(p_room uuid, p_estimate text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if v_room.phase <> 'revealed' then
    raise exception 'invalid_phase';
  end if;
  if p_estimate is not null and not (p_estimate = any (v_room.cards)) then
    raise exception 'invalid_card';
  end if;
  perform public.poker_close_story(v_room.current_story_id, 'completed', p_estimate);
  update public.poker_rooms set phase = 'finished' where id = p_room;
  perform public.poker_touch(p_room);
end;
$$;

-- Clears the current story's votes and starts its round again.
create or replace function public.poker_clear_votes(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if v_room.current_story_id is null then
    raise exception 'no_story';
  end if;
  update public.poker_stories
  set status = 'active', estimate = null, completed_at = null
  where id = v_room.current_story_id;
  perform public.poker_start_round(p_room, v_room.current_story_id);
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_reset_timer(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  perform public.poker_require_moderator(p_room, v_uid);
  update public.poker_rooms set round_started_at = now() where id = p_room;
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_next_story(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if v_room.phase <> 'finished' then
    raise exception 'invalid_phase';
  end if;
  perform public.poker_start_round(p_room, public.poker_next_story_id(p_room));
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_skip_story(p_room uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if v_room.current_story_id is null then
    raise exception 'no_story';
  end if;
  delete from public.poker_votes where story_id = v_room.current_story_id;
  perform public.poker_close_story(v_room.current_story_id, 'skipped', null);
  perform public.poker_start_round(p_room, public.poker_next_story_id(p_room));
  perform public.poker_touch(p_room);
end;
$$;

-- ------------------------------------------------------------------
-- Client API: stories
-- ------------------------------------------------------------------

create or replace function public.poker_add_stories(p_room uuid, p_titles text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
  v_start double precision;
  v_added integer;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  select coalesce(max(position), 0) into v_start from public.poker_stories where room_id = p_room;

  insert into public.poker_stories (room_id, title, position)
  select p_room, left(btrim(t), 300), v_start + ord
  from unnest(coalesce(p_titles, '{}')) with ordinality as s (t, ord)
  where btrim(t) <> ''
  limit 500;
  get diagnostics v_added = row_count;

  if v_room.current_story_id is null then
    perform public.poker_start_round(p_room, public.poker_next_story_id(p_room));
  end if;
  perform public.poker_touch(p_room);
  return v_added;
end;
$$;

-- Makes an active story the one being voted on.
create or replace function public.poker_select_story(p_story uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_story public.poker_stories;
begin
  select * into v_story from public.poker_stories where id = p_story;
  if not found then
    raise exception 'not_found';
  end if;
  perform public.poker_require_moderator(v_story.room_id, v_uid);
  perform public.poker_lock_room(v_story.room_id);
  if v_story.status <> 'active' then
    raise exception 'invalid_story';
  end if;
  perform public.poker_start_round(v_story.room_id, p_story);
  perform public.poker_touch(v_story.room_id);
end;
$$;

-- Sends a finished or skipped story back to the queue for another vote.
create or replace function public.poker_retry_story(p_story uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_story public.poker_stories;
  v_room public.poker_rooms;
begin
  select * into v_story from public.poker_stories where id = p_story;
  if not found then
    raise exception 'not_found';
  end if;
  perform public.poker_require_moderator(v_story.room_id, v_uid);
  v_room := public.poker_lock_room(v_story.room_id);
  update public.poker_stories
  set status = 'active', estimate = null, completed_at = null
  where id = p_story;
  delete from public.poker_votes where story_id = p_story;
  if v_room.current_story_id is null or v_room.phase = 'finished' then
    perform public.poker_start_round(v_story.room_id, p_story);
  end if;
  perform public.poker_touch(v_story.room_id);
end;
$$;

create or replace function public.poker_delete_story(p_story uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_story public.poker_stories;
  v_room public.poker_rooms;
begin
  select * into v_story from public.poker_stories where id = p_story;
  if not found then
    raise exception 'not_found';
  end if;
  perform public.poker_require_moderator(v_story.room_id, v_uid);
  v_room := public.poker_lock_room(v_story.room_id);
  delete from public.poker_stories where id = p_story;
  if v_room.current_story_id = p_story then
    perform public.poker_start_round(v_story.room_id, public.poker_next_story_id(v_story.room_id));
  end if;
  perform public.poker_touch(v_story.room_id);
end;
$$;

-- Reorders by giving the story a new fractional position.
create or replace function public.poker_move_story(p_story uuid, p_position double precision)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room uuid;
begin
  select room_id into v_room from public.poker_stories where id = p_story;
  if v_room is null then
    raise exception 'not_found';
  end if;
  perform public.poker_require_moderator(v_room, v_uid);
  update public.poker_stories set position = p_position where id = p_story;
  perform public.poker_touch(v_room);
end;
$$;

-- ------------------------------------------------------------------
-- Client API: people
-- ------------------------------------------------------------------

create or replace function public.poker_set_role(
  p_room uuid,
  p_user uuid,
  p_participation public.poker_participation,
  p_is_moderator boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
begin
  perform public.poker_require_moderator(p_room, v_uid);
  perform public.poker_lock_room(p_room);
  perform public.poker_member(p_room, p_user);
  if not p_is_moderator and not exists (
    select 1 from public.poker_participants
    where room_id = p_room and is_moderator and user_id <> p_user
  ) then
    raise exception 'last_moderator';
  end if;
  if not p_is_moderator and p_participation = 'none' then
    raise exception 'invalid_role';
  end if;
  update public.poker_participants
  set participation = p_participation, is_moderator = p_is_moderator
  where room_id = p_room and user_id = p_user;
  perform public.poker_touch(p_room);
end;
$$;

create or replace function public.poker_remove_participant(p_room uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.require_user();
  v_room public.poker_rooms;
begin
  perform public.poker_require_moderator(p_room, v_uid);
  v_room := public.poker_lock_room(p_room);
  if p_user is not distinct from v_room.owner_id then
    raise exception 'cannot_remove_owner';
  end if;
  if p_user = v_uid then
    raise exception 'use_leave';
  end if;
  delete from public.poker_participants where room_id = p_room and user_id = p_user;
  if v_room.current_story_id is not null then
    delete from public.poker_votes where story_id = v_room.current_story_id and user_id = p_user;
  end if;
  perform public.poker_touch(p_room);
end;
$$;

-- ------------------------------------------------------------------
-- Privileges and Realtime
-- ------------------------------------------------------------------

revoke all on table
  public.poker_profiles, public.poker_rooms, public.poker_participants,
  public.poker_stories, public.poker_votes, public.poker_signals
from anon, authenticated;

grant select on table public.poker_signals to authenticated;
create policy "participants can watch their room" on public.poker_signals
  for select to authenticated
  using (public.poker_is_participant(room_id));

revoke execute on function
  public.poker_is_participant(uuid),
  public.poker_member(uuid, uuid),
  public.poker_require_moderator(uuid, uuid),
  public.poker_lock_room(uuid),
  public.poker_touch(uuid),
  public.poker_require_name(uuid),
  public.poker_clean_settings(jsonb),
  public.poker_clean_cards(text[]),
  public.poker_start_round(uuid, uuid),
  public.poker_next_story_id(uuid),
  public.poker_close_story(uuid, public.poker_story_status, text)
from public, anon, authenticated;
grant execute on function public.poker_is_participant(uuid) to authenticated;

revoke execute on function
  public.poker_get_name(),
  public.poker_set_name(text),
  public.poker_create_room(text, text, text[], jsonb, text[]),
  public.poker_update_room(uuid, text, text, text[], jsonb),
  public.poker_join_room(text),
  public.poker_leave_room(uuid),
  public.poker_my_rooms(),
  public.poker_get_room(text),
  public.poker_clear_room(uuid),
  public.poker_clone_room(uuid),
  public.poker_delete_room(uuid),
  public.poker_vote(uuid, text),
  public.poker_reveal(uuid),
  public.poker_finish(uuid, text),
  public.poker_clear_votes(uuid),
  public.poker_reset_timer(uuid),
  public.poker_next_story(uuid),
  public.poker_skip_story(uuid),
  public.poker_add_stories(uuid, text[]),
  public.poker_select_story(uuid),
  public.poker_retry_story(uuid),
  public.poker_delete_story(uuid),
  public.poker_move_story(uuid, double precision),
  public.poker_set_role(uuid, uuid, public.poker_participation, boolean),
  public.poker_remove_participant(uuid, uuid)
from public, anon;

grant execute on function
  public.poker_get_name(),
  public.poker_set_name(text),
  public.poker_create_room(text, text, text[], jsonb, text[]),
  public.poker_update_room(uuid, text, text, text[], jsonb),
  public.poker_join_room(text),
  public.poker_leave_room(uuid),
  public.poker_my_rooms(),
  public.poker_get_room(text),
  public.poker_clear_room(uuid),
  public.poker_clone_room(uuid),
  public.poker_delete_room(uuid),
  public.poker_vote(uuid, text),
  public.poker_reveal(uuid),
  public.poker_finish(uuid, text),
  public.poker_clear_votes(uuid),
  public.poker_reset_timer(uuid),
  public.poker_next_story(uuid),
  public.poker_skip_story(uuid),
  public.poker_add_stories(uuid, text[]),
  public.poker_select_story(uuid),
  public.poker_retry_story(uuid),
  public.poker_delete_story(uuid),
  public.poker_move_story(uuid, double precision),
  public.poker_set_role(uuid, uuid, public.poker_participation, boolean),
  public.poker_remove_participant(uuid, uuid)
to authenticated;

alter publication supabase_realtime add table public.poker_signals;
