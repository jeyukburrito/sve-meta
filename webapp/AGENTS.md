# Webapp: Shadowverse EVOLVE Match Tracker

## Overview
Mobile-first PWA for personal Shadowverse EVOLVE match result tracking.
This is a sub-project inside the `sve_meta` repository. Keep all webapp code under `webapp/`.

## Tech Stack
- **Framework**: Next.js App Router + TypeScript
- **UI**: Tailwind CSS
- **Auth**: Supabase Auth (Google login)
- **Database**: Supabase Postgres
- **ORM**: Prisma
- **Charts**: Recharts
- **Hosting**: Vercel

## Project Structure
```
webapp/
  app/           # Next.js App Router pages
  components/    # Reusable UI components
  lib/           # Utilities, Supabase client, Prisma client
  prisma/        # Prisma schema and migrations
  public/        # Static assets
```

## Prisma Models
- `User` — synced from Supabase Auth
- `Deck` — user's own decks
- `MatchResult` — match records with `wins` and `losses` (not binary flag)
- `Tag` — user-defined tags
- `MatchResultTag` — M:N join table

## MVP Features
- Google login
- Deck CRUD (owner only)
- Match result CRUD with fields: `played_at`, `my_deck`, `opponent_deck_name`, `play_order`, `match_format` (BO1/BO3), `wins`, `losses`, `event_type`, `memo`, tags
- Match history with filters
- Dashboard statistics (server-side computed)
- CSV export

## MVP Screens
- `/login`
- `/dashboard`
- `/matches/new`
- `/matches` (history + filters)
- `/settings` (deck management under `/settings/decks`)

## Coding Conventions
- Variables and code comments in English
- User-facing text in Korean
- Game terms (card names, keywords) in Japanese original
- Use server components by default; client components only when needed
- All data must be scoped by `user_id` with RLS

## Non-Goals (MVP)
- Card image integration
- Card DB sync
- OCR, community sharing, replays, brackets
- Advanced report generation

## Coordination with Claude Code
The `.ai/` directory is the only collaboration document set for this project.

- `.ai/PROJECT_RULES.md`: role boundaries and operating rules
- `.ai/TASKS.md`: ticket index and status
- `.ai/handoffs/`: spec and result documents
- `.ai/reviews/`: review documents
- `.ai/release/`: release checklist and deploy notes

Do not use `STATUS.md`, ad-hoc notes, or chat-only instructions as collaboration sources of truth.

## Reference Documents
- `docs/CLAUDE_WEBAPP_HANDOFF.md` — product decisions and constraints
- `docs/WEBAPP_INITIAL_SETUP_PLAN.md` — phased delivery plan
