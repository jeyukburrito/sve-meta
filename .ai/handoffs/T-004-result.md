# T-004 Result

## Summary
Implemented record-page bug fixes and UI/UX improvements from `T-004-spec.md` in the scoped frontend files.

## Files Changed
- `webapp/components/bottom-nav.tsx`
- `webapp/components/tournament-timeline.tsx`
- `webapp/app/matches/page.tsx`
- `.ai/handoffs/T-004-result.md`

## Implemented
- Bottom nav settings icon bug fix
  - Added explicit `/settings` icon branch in `NavIcon` (gear icon), so settings no longer falls back to the home icon.
- Tournament timeline phase label cleanup
  - Changed phase labels from verbose parenthetical text to plain labels: `본선` / `예선`.
- Tournament round action touch targets
  - Replaced text-only `수정/삭제` actions with icon buttons (`size-8`, `aria-label` applied).
  - Kept existing edit/delete behavior and delete confirmation flow intact.
  - Updated action layout spacing from wider text-link spacing to compact icon-button spacing.
- Match card summary cleanup
  - Removed `선후공 결정 O/X` text from normal match card summary.
  - Summary now shows format + play order only.
- Match filter mobile layout
  - Updated filter grid to `grid-cols-2 md:grid-cols-4`.
  - Reduced select vertical padding from `py-3` to `py-2.5` in filter controls.
- Empty state UX on `/matches`
  - Added CTA for no records state: link to `/matches/new`.
  - Added filtered-empty state: message + reset link to `/matches`.

## Test Results
- `npm.cmd run lint`: PASS
  - No ESLint warnings/errors.
- `npm.cmd run build`: FAIL
  - Error: `[Error: spawn EPERM]`
  - Environment permission issue; not a deterministic code-level build error from app output.

## Risks
- Build validation is incomplete due to environment-level `spawn EPERM`.
- This ticket intentionally does not change backend/data logic; only UI and interaction surface were updated.
