-- Shared helpers for both tools.
--
-- Access model: every browser signs in with Supabase Anonymous Auth, so each
-- request carries a real `auth.uid()` without anyone creating an account.
-- Tables are never read or written directly by clients. All access goes
-- through SECURITY DEFINER functions that check membership and phase, which is
-- how hidden retro cards and unrevealed poker votes stay off the wire.

create extension if not exists pgcrypto with schema extensions;

-- Short, URL-safe, unguessable identifier for boards and rooms.
create or replace function public.random_slug(len integer default 10)
returns text
language sql
volatile
set search_path = ''
as $$
  select substr(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/=', 'kqz'), 1, len);
$$;

-- The calling user, or an error when the request has no session.
create or replace function public.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  return v_uid;
end;
$$;

revoke execute on function public.random_slug(integer) from public, anon, authenticated;
revoke execute on function public.require_user() from public, anon, authenticated;
