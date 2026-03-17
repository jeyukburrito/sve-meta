# T-001 Tag 연동

## Goal
Prisma 스키마에 이미 존재하는 `Tag`/`MatchResultTag` 모델을 실제 UI와 Server Action에 연결하여, 사용자가 태그를 관리하고 대전 기록에 태그를 붙일 수 있게 한다.

## 현재 상태
- `Tag` (id, userId, name, createdAt) 모델 존재
- `MatchResultTag` (matchResultId, tagId) M:N 조인 테이블 존재
- `matchResultSchema`에 `tagIds: z.array(z.string().uuid()).max(10).default([])` 정의됨
- `parseMatchForm()`에서 `tagIds: []` 하드코딩 → 실제 폼 데이터 미수집
- Tag 관리 페이지, 태그 선택 UI, 기록 목록 태그 표시 모두 미구현

## Scope

### 1. Tag CRUD (설정 페이지)
- `/settings/tags` 페이지 추가
- 태그 목록 표시 (이름 기준 오름차순)
- 태그 생성 (이름 입력, 중복 불가 — `@@unique([userId, name])`)
- 태그 삭제 (연결된 MatchResultTag cascade 삭제)
- `/settings` 메인 페이지에 태그 관리 링크 추가

### 2. 매치 폼에 태그 선택 UI
- `/matches/new`와 `/matches/[id]/edit` 폼에 태그 멀티셀렉트 추가
- 사용자의 활성 태그 목록을 체크박스 또는 토글칩으로 표시
- 선택된 tagIds를 hidden input 또는 FormData로 전송
- 최대 10개 제한 (기존 zod 스키마 준수)

### 3. Server Action 연동
- `parseMatchForm()`에서 `tagIds`를 FormData에서 실제로 파싱
- `createMatchResult()`: 매치 생성 후 `MatchResultTag` 레코드 생성
- `updateMatchResult()`: 기존 태그 전체 삭제 후 새 tagIds로 재생성 (delete-then-create)
- 태그는 반드시 `userId` 소유 확인 후 연결

### 4. 기록 목록에 태그 표시
- `/matches` 목록의 각 매치 카드에 연결된 태그 이름 표시 (작은 뱃지/칩 형태)
- `listMatchesForUser` 쿼리에 `tags` include 추가

## Out of Scope
- 태그 이름 수정 (rename) — 다음 티켓으로 분리
- 태그 색상/아이콘 — 다음 티켓으로 분리
- 태그 기준 필터링 (기록 목록) — 다음 티켓으로 분리
- 대시보드 태그별 통계 — 다음 티켓으로 분리

## Inputs
- `webapp/prisma/schema.prisma` — Tag, MatchResultTag 모델 정의
- `webapp/lib/validation/match.ts` — tagIds 스키마
- `webapp/app/matches/actions.ts` — createMatchResult, updateMatchResult
- `webapp/app/matches/new/page.tsx`, `webapp/app/matches/[id]/edit/page.tsx` — 폼 페이지
- `webapp/app/matches/page.tsx` — 기록 목록
- `webapp/lib/matches.ts` — listMatchesForUser 쿼리
- `webapp/app/settings/page.tsx` — 설정 메인

## Constraints
- 새 라이브러리 추가 금지 — 기존 스택(Next.js, Prisma, Tailwind, Zod)만 사용
- Server Component 기본, Client Component는 태그 선택 인터랙션에만 사용
- 기존 UI 스타일(rounded-2xl/3xl, border-line, bg-surface) 유지
- 모든 DB 쿼리에 `userId` 조건 포함
- FormData에서 tagIds 전달: `<input type="hidden" name="tagIds" value="{id}">` 복수 전송 또는 동등한 방식
- Prisma 마이그레이션 불필요 — 스키마 변경 없음

## Done Definition
- [ ] `/settings/tags`에서 태그 생성, 목록 확인, 삭제 가능
- [ ] `/settings` 페이지에 태그 관리 링크 존재
- [ ] `/matches/new`에서 태그 0~10개 선택 후 저장 시 `match_result_tags` 레코드 생성 확인
- [ ] `/matches/[id]/edit`에서 기존 태그가 선택된 상태로 표시되고, 변경 후 저장 시 반영
- [ ] `/matches` 목록에서 각 매치에 연결된 태그가 뱃지로 표시
- [ ] 다른 사용자의 태그를 매치에 연결할 수 없음 (소유권 검증)
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과

## Expected Output
- 수정/생성 파일 목록
- lint/build 결과
- 알려진 이슈 및 리스크
