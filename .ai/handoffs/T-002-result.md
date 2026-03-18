# T-002 Result

## Summary
Implemented dashboard category filtering and matchup matrix features from `T-002-spec.md`.

## Files Changed
- `webapp/app/dashboard/page.tsx`
- `webapp/lib/dashboard.ts`
- `webapp/components/category-filter.tsx`
- `webapp/components/matchup-matrix.tsx`

## Implemented
- Added `category` to dashboard filter options and SQL where builder.
- Preserved existing `period/from/to` URL behavior and added category-aware filtering.
- Added `getMatchupMatrix(userId, opts)` in `lib/dashboard.ts` with grouped SQL query and win-rate calculation.
- Added `CategoryFilter` component with 4 options (`all`, `friendly`, `shop`, `cs`) and URL synchronization.
- Added `MatchupMatrix` component with:
  - default list view (`myDeck` tabs + selected opponent list),
  - optional table view toggle,
  - sample-size handling (`<3` as low-confidence),
  - color bands by win-rate.
- Integrated both new components into dashboard page and loaded data in parallel via `Promise.all`.

## Test Results
- `npm.cmd run lint`: PASS
- `npm.cmd run build`: FAIL (`[Error: spawn EPERM]`)

## Risks
- Build is blocked by environment-level `spawn EPERM`, so production build validation is incomplete.
- Category input is guarded to known values (`friendly/shop/cs`) before SQL enum cast to avoid invalid-cast query errors.

## Notes
- No changes were made outside T-002 ownership files.
