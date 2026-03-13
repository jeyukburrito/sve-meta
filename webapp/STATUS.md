# Webapp Build Status

Last updated: 2026-03-14

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
- [ ] `/matches/new`
- [ ] `/matches` (history + filters)
- [ ] `/settings` + `/settings/decks`

Phase 2 note:
- Route skeletons and placeholder UI for all MVP screens have been created under `webapp/app/`.
- Deck management is now connected to Supabase via Prisma on `/settings/decks`.
- `/matches/new` now reads the authenticated user's active deck list from the database.
- Match create/update mutations are not connected yet.

### Phase 3: Stats and Export
- [ ] Win-rate cards (overall, 7/30 days, first/second, BO1/BO3)
- [ ] Matchup and deck-level summary tables
- [ ] CSV export from filtered results

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

## Code Review
- 2026-03-13: Phase 0–1 검수 완료 → `REVIEW_2026-03-13.md` 참조. HIGH 1건(users INSERT RLS)은 반영 완료. MID 2건 중 폰트 로드는 현재 빌드 환경 제약으로 보류, 나머지 MID/LOW는 Phase 2에서 처리 예정.
- 2026-03-14: Phase 2 중간 검수 → `REVIEW_2026-03-14.md` 참조. HIGH 1건(`/matches/new` 폼 필드 name/value 누락). 덱 관리 CRUD, RLS 정합성은 양호.

## Blockers
