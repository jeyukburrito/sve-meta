# Claude Handoff: Webapp Build Context

## Purpose
This document is for Claude or any follow-up agent continuing the Shadowverse EVOLVE match tracker web app build.

## Current Decisions
- Product: personal Shadowverse EVOLVE match tracker web app
- MVP target: mobile-first PWA-capable web app
- Users: owner first, friends may be invited for QA later
- Match scope: result tracking only, not full decklist/card-level management
- Supported formats: `BO1`, `BO3`

## Required MVP Features
- Google login
- My deck management
- Match result create/edit/delete
- Match fields:
  - `played_at`
  - `my_deck`
  - `opponent_deck_name`
  - `play_order`
  - `match_format`
  - `wins`
  - `losses`
  - `event_type`
  - `memo`
  - tags
- Match history filters
- Dashboard statistics
- CSV export

## Confirmed Technical Stack
- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `Supabase Auth`
- `Supabase Postgres`
- `Prisma`
- `Recharts`
- `Vercel`

## Recommended Repository Structure
Add the app as:

```text
webapp/
  app/
  components/
  lib/
  prisma/
  public/
```

This repo currently focuses on data analysis pipelines under `scripts/`, `rag/`, and `data/`. The web app should remain isolated in `webapp/` to avoid mixing runtime concerns.

## Proposed Prisma Models
- `User`
- `Deck`
- `MatchResult`
- `Tag`
- `MatchResultTag`

`MatchResult` should store `wins` and `losses` separately. Do not store only a binary win/loss flag; aggregate stats and BO3 validation depend on the scoreline.

## Product Constraints
- Keep input fast on mobile.
- Opponent deck can be free text in MVP.
- Deck management is only for the owner’s decks.
- Stats should be computed server-side.
- All user data must be isolated with `user_id` and RLS.

## Non-Goals for MVP
- Card image integration
- Shadowverse EVOLVE card DB sync
- OCR
- Community sharing
- Match replay or bracket tooling
- Advanced report generation

## Immediate Next Task
Bootstrap `webapp/` and commit the initial stack setup:
1. create Next.js app
2. install Prisma, Supabase, Recharts
3. add initial Prisma schema
4. add environment example file
5. add auth and route protection skeleton
