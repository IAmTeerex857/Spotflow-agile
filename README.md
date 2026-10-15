# Spotflow Agile Tools

One Next.js app with three surfaces:

- **`/`**: the hub. A landing page that links to both tools.
- **`/poker`**: planning poker. People type a name once, then join rooms by link.
- **`/retro`**: anonymous sprint retros. No names at all; a board can have a password.

Nobody signs up for anything. Every browser gets an invisible anonymous Supabase session,
which gives the database a stable identity to check permissions against.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev                  # http://localhost:3000
```

Without the two Supabase variables the landing pages still work, and the app screens show a
"Not connected yet" message.

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run lint` / `typecheck` | ESLint and TypeScript |
| `npm run test:db` | Runs the migrations and 31 permission tests in PGlite (no Docker) |

## Supabase setup

1. Create a project and turn on **Authentication > Sign In / Providers > Allow anonymous sign-ins**.
2. Apply the migrations in `supabase/migrations` (`npx supabase link` then `npx supabase db push`).
3. Put the project URL and publishable key in `.env.local` (and in Vercel for production).

### How data is protected

- Clients never read or write tables directly. Every table has row level security on and no
  table grants; all access goes through `SECURITY DEFINER` functions (`retro_*`, `poker_*`).
- **Retro**: during Brainstorm the server returns only your own cards plus a count of everyone
  else's per column. Card authors are stored only to answer "is this mine?" and are never returned.
- **Poker**: vote values stay on the server until the moderator flips the cards. Before that,
  people only learn who has voted (observers can be excluded by a room setting).
- **Live updates**: each board and room has a one-row "signal" table. Its version bumps on
  every change, members subscribe to it over Realtime, and refetch their own filtered view.
- Moderator-only actions, phase changes, password checks and rate limits are enforced in SQL.
  `supabase/tests/database.test.mjs` checks these as several different users.

## Code map

```
app/
  page.tsx                  hub landing
  retro/page.tsx            Retro landing
  retro/boards/             Past retros (every board, searchable)
  retro/[slug]/             a retro board (Brainstorm > Group & vote > Action items > Done)
  poker/page.tsx            Poker landing
  poker/(app)/rooms/        Your rooms (rooms this browser has joined)
  poker/(app)/room/[slug]/  a poker room
components/
  ui/                       Button (amicro-style motion), Dialog, Menu, Popover, Select,
                            Checkbox, Avatar (blobatar), Loader (generative-loaders), Toast
  hero/  iso/               the animated isometric hero scenes and their drawing kit
  retro/  poker/  hub/      surface-specific components
lib/
  supabase/                 client, anonymous session, RPC helper, Realtime hook
  retro/  poker/            typed API wrappers, hooks, domain types
supabase/
  migrations/               schema, permissions and every database function
  tests/                    PGlite database tests
```

## Design

Each surface has its own palette and fonts, defined as CSS variables in `app/globals.css`
(`data-surface` on the page wrapper, `data-theme` on `<html>` for light and dark). Libraries:

- **motion** for all animation, including the amicro-style button interactions
- **radix-ui** for accessible dialogs, menus, popovers, selects and checkboxes
- **@dnd-kit** for stacking retro cards and reordering poker stories
- **blobatar** for avatars, **liquid-gooey** for the retro reaction picker,
  **border-beam** for "ready" glows, **metal-fx** for the hub's main button,
  **generative-loaders** for loading and reveal animations
