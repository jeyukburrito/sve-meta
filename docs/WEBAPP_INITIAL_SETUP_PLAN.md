# Shadowverse EVOLVE Match Tracker Webapp: Initial Setup Plan

## Goal
Build a mobile-first personal web app for recording Shadowverse EVOLVE match results and viewing basic statistics. The first release is a private MVP with optional friend QA access.

## Confirmed Product Scope
- Single game support: Shadowverse EVOLVE only
- Primary use: personal tracking
- Secondary use: limited QA access for friends
- Core features: login, deck management, match entry, history, filters, dashboard stats, CSV export
- Explicitly out of scope for MVP: card DB sync, OCR, community features, decklist storage, real-time multiplayer

## Confirmed Stack
- Frontend/backend: `Next.js` App Router + `TypeScript`
- UI: `Tailwind CSS`
- Auth: `Supabase Auth`
- Database: `Supabase Postgres`
- ORM/migrations: `Prisma`
- Charts: `Recharts`
- Hosting: `Vercel`

## Delivery Phases
### Phase 0: Project Bootstrap
- Create `webapp/` as a separate app directory inside this repo.
- Initialize Next.js with TypeScript, ESLint, Tailwind, App Router.
- Add Prisma, Supabase client packages, Recharts, and form/validation utilities.
- Set up `.env.local.example` with `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Phase 1: Data and Auth Foundation
- Implement Prisma schema for `users`, `decks`, `match_results`, `tags`, `match_result_tags`.
- Configure Supabase Auth with Google login.
- Enable row-level security and ensure all records are scoped by `user_id`.
- Seed one local development user and sample decks.

### Phase 2: Core Screens
- `/login`
- `/dashboard`
- `/matches/new`
- `/matches`
- `/settings`
- Put deck management under `/settings/decks` for MVP simplicity.

### Phase 3: Stats and Export
- Add win-rate cards for overall, recent 7/30 days, first/second, BO1/BO3.
- Add matchup and deck-level summary tables.
- Add CSV export from filtered results.

### Phase 4: QA and Release
- Restrict access to approved accounts.
- Add a small seed dataset for testing.
- Prepare production env vars and deploy to Vercel.

## First Implementation Order
1. Scaffold app and tooling
2. Define Prisma schema and migrations
3. Set up Supabase Auth and protected routes
4. Build match entry form
5. Build history list with filters
6. Build dashboard stats
7. Add CSV export
8. QA pass on mobile

## Definition of Done for MVP
- User can sign in and only see their own data.
- User can create, edit, delete, and filter match results.
- Dashboard shows accurate aggregate stats.
- CSV export works from production data.
- App is usable on mobile without layout breakage.
