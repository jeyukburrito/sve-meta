# T-007 Result

## Summary
Applied the performance cleanup from `T-007-spec.md` in `webapp/`.

## Files Changed
- `webapp/app/dashboard/page.tsx`
- `webapp/app/matches/page.tsx`
- `webapp/app/matches/new/page.tsx`
- `webapp/app/matches/[id]/edit/page.tsx`
- `webapp/app/matches/export/route.ts`
- `webapp/app/matches/tournaments/end/route.ts`
- `webapp/app/settings/page.tsx`
- `webapp/app/settings/decks/page.tsx`
- `webapp/app/settings/games/page.tsx`
- `webapp/app/settings/tags/page.tsx`
- `webapp/app/settings/profile/page.tsx`
- `webapp/app/settings/export/page.tsx`

## Implemented
- Removed `export const dynamic = "force-dynamic";` from the 12 spec-listed files.
- Changed `webapp/app/dashboard/page.tsx` to load `DashboardCharts` via `next/dynamic`.
- Replaced the profile avatar raw `<img>` in `webapp/app/settings/profile/page.tsx` with `next/image` and `unoptimized`.

## Validation
- `npm.cmd run build`: PASS

## Notes
- `DashboardCharts` was moved to `next/dynamic`, but not with `{ ssr: false }`.
- In this codebase, `app/dashboard/page.tsx` is a Server Component, and the `ssr: false` form is rejected there by Next.js. The buildable form was used instead.

## Risks
- `/dashboard` remains a large route because the chart code is still part of the route payload shape. This ticket removes the forced dynamic rendering and lazy-loads through `next/dynamic`, but does not restructure the dashboard into a client-only wrapper.

## Remaining Work
- None for this ticket.
