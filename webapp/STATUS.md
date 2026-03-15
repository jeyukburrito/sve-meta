# Webapp Build Status

Last updated: 2026-03-15

## Current Phase: Phase 2 — Core Screens and CRUD

### Phase 0: Project Bootstrap
- [x] Initialize manual Next.js scaffold with TypeScript, ESLint, Tailwind, App Router
- [x] Install Prisma, Supabase client packages, Recharts
- [x] Set up `.env.local.example`
- [x] Create initial Prisma schema (User, Deck, MatchResult, Tag, MatchResultTag)

### Phase 1: Data and Auth Foundation
- [x] Configure Supabase Auth skeleton with Google login
- [x] Apply RLS SQL — all records scoped by `user_id`
- [x] Add local seed script for development user and sample decks

### Phase 2: Core Screens
- [ ] `/login`
- [ ] `/dashboard`
- [x] `/matches/new`
- [x] `/matches` (history + filters)
- [x] `/matches/[id]/edit`
- [x] `/settings` + `/settings/decks`
- [x] `/settings/games`

Phase 2 note:
- Route skeletons and placeholder UI for all MVP screens have been created under `webapp/app/`.
- Deck management is now connected to Supabase via Prisma on `/settings/decks`.
- Card game category management is now connected on `/settings/games`.
- `/matches/new` now reads the authenticated user's active deck list from the database.
- Decks are now categorized by user-defined card game names.
- Match creation and history listing are now connected to Supabase.
- Match update/delete are now connected to Supabase with owner checks.
- Tag wiring is not connected yet.

### Phase 3: Stats and Export
- [x] Win-rate cards (overall, 7/30 days, first/second, BO1/BO3)
- [x] Matchup and deck-level summary tables
- [x] First-pass dashboard charts (play order, BO format, 30-day trend)
- [x] CSV export from filtered results

### Phase 4: QA and Release
- [ ] Restrict access to approved accounts
- [ ] Seed test dataset
- [ ] Production env vars + Vercel deploy

## Decisions Log
| Date | Decision | By |
|------|----------|----|
| 2026-03-13 | Tech stack confirmed (Next.js, Supabase, Prisma, Recharts) | Codex CLI |
| 2026-03-13 | Created AGENTS.md and STATUS.md for cross-tool coordination | Claude Code |
| 2026-03-13 | Bootstrapped `webapp/` manually to avoid blocking on package install approval | Codex CLI |
| 2026-03-13 | Added placeholder App Router pages for the MVP route map | Codex CLI |
| 2026-03-13 | Installed webapp dependencies locally | Codex CLI |
| 2026-03-13 | Added Supabase SSR auth skeleton, protected routes, and initial RLS SQL | Codex CLI |
| 2026-03-13 | Added local Prisma seed script for sample user and deck data | Codex CLI |
| 2026-03-13 | Added step-by-step Supabase setup and QA guide for dashboard configuration | Codex CLI |
| 2026-03-14 | Connected Supabase project, confirmed Prisma sync, applied RLS, and verified seed data (`users=1`, `decks=3`) | Codex CLI |
| 2026-03-14 | Connected deck management page to Supabase and aligned `/matches/new` with `Deck` FK selection | Codex CLI |
| 2026-03-14 | Added authenticated match create flow and real history list with basic filters | Codex CLI |
| 2026-03-14 | Added authenticated match edit/delete flow and edit route | Codex CLI |
| 2026-03-14 | Replaced dashboard placeholders with real server-side aggregate metrics and summary tables | Codex CLI |
| 2026-03-14 | Added first-pass Recharts visualizations to the dashboard | Codex CLI |
| 2026-03-14 | Generalized the app for multiple card games with user-defined game categories and deck grouping | Codex CLI |
| 2026-03-14 | Applied follow-up review fixes: delete confirmation, safer match update, generic shell branding, game rename/delete | Codex CLI |
| 2026-03-15 | Simplified match entry to date/game/deck/opponent/format/result/play order/play-order choice and removed event type | Codex CLI |
| 2026-03-15 | Added CSV export route with shared match filters and a minimal Vercel deployment guide | Codex CLI |

## Code Review
- 2026-03-13: Phase 0–1 검수 완료 → `REVIEW_2026-03-13.md` 참조. HIGH 1건(users INSERT RLS)은 반영 완료.
- 2026-03-14 (1차): Phase 2 중간 검수 → `REVIEW_2026-03-14.md` 참조. HIGH 1건(name/value 누락)은 반영 완료.
- 2026-03-14 (2차): Phase 2–3 종합 검수 → `REVIEW_2026-03-14_phase2.md` 참조. HIGH 1건과 주요 MID 항목(delete 확인, updateMany 전환, 헤더 일반화, Game 수정/삭제)은 반영 완료.

## Blockers
