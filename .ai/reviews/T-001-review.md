# T-001 Review — Tag 연동

## Review Summary

Codex가 T-001 spec을 기반으로 태그 연동 기능을 구현함. 전체 Done Definition 8개 항목 모두 충족. lint/build 통과. 코드 품질 양호하며 기존 패턴과 일관성 유지.

## Pass

- [x] `/settings/tags`에서 태그 생성, 목록 확인, 삭제 가능
- [x] `/settings` 페이지에 태그 관리 링크 존재
- [x] `/matches/new`에서 태그 0~10개 선택 후 저장 시 `match_result_tags` 레코드 생성
- [x] `/matches/[id]/edit`에서 기존 태그가 선택된 상태로 표시되고, 변경 후 저장 시 반영
- [x] `/matches` 목록에서 각 매치에 연결된 태그가 뱃지로 표시 (일반 카드 + 토너먼트 타임라인)
- [x] 다른 사용자의 태그를 매치에 연결할 수 없음 (`ensureOwnedTags` + count 비교)
- [x] `npm run lint` 통과
- [x] `npm run build` 통과

### Constraints 준수

- [x] 새 라이브러리 추가 없음
- [x] Server Component 기본, Client Component는 `tag-selector.tsx`만 사용
- [x] 기존 UI 스타일(rounded-2xl/3xl, border-line, bg-surface) 유지
- [x] 모든 DB 쿼리에 `userId` 조건 포함
- [x] FormData에서 `tagIds` hidden checkbox 복수 전송 방식
- [x] Prisma 마이그레이션 불필요 (스키마 변경 없음)

## Issues

### Minor — `$transaction` 첫 도입 (리스크 낮음)

- **위치**: `webapp/app/matches/actions.ts:343`
- **내용**: `updateMatchResult`에서 `$transaction`을 처음 사용. Supabase pgbouncer(port 6543)와의 호환성 리스크가 이론적으로 존재하나, Supabase는 Prisma interactive transactions를 기본 지원하므로 실질적 문제 가능성 낮음.
- **조치**: 배포 후 모니터링. 문제 발생 시 순차 실행으로 대체 가능.

### Minor — 태그 0건 시 설정 링크 없음

- **위치**: `webapp/components/tag-selector.tsx:43`
- **내용**: 태그가 없을 때 "설정에서 태그를 먼저 추가해 주세요" 메시지에 `/settings/tags` 링크가 없음. 사용자가 수동으로 네비게이션해야 함.
- **조치**: 다음 개선 티켓으로 분리 가능. 기능에 영향 없음.

### Info — `revalidatePath` 범위 비대칭

- **위치**: `webapp/app/settings/tags/actions.ts`
- **내용**: `createTag`/`deleteTag`가 `/matches/[id]/edit` 경로를 revalidate하지 않음. `force-dynamic` 설정으로 실질적 영향 없음.

## Decision

**승인** — Done Definition 전항목 충족, lint/build 통과, 소유권 검증 정상, 기존 코드 패턴과 일관성 유지. Minor 이슈는 기능에 영향 없으며 별도 티켓으로 관리 가능.
