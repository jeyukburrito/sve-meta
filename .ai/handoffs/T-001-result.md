# T-001 Result

## Summary
`T-001-spec.md` 기준으로 태그 연결 기능을 구현했습니다.

- `/settings/tags` 태그 관리 페이지 추가
- `/settings`에 태그 관리 진입 링크 추가
- `/matches/new`, `/matches/[id]/edit`에 태그 선택 UI 추가
- 매치 생성/수정 시 `match_result_tags` 연결 저장 및 교체 반영
- `/matches` 일반 카드와 토너먼트 타임라인에 태그 칩 표시 추가

## Files Changed
- `webapp/app/settings/tags/actions.ts`
- `webapp/app/settings/tags/page.tsx`
- `webapp/app/settings/page.tsx`
- `webapp/app/matches/actions.ts`
- `webapp/app/matches/new/page.tsx`
- `webapp/app/matches/[id]/edit/page.tsx`
- `webapp/app/matches/page.tsx`
- `webapp/components/tag-selector.tsx`
- `webapp/components/game-deck-fields.tsx`
- `webapp/components/tournament-timeline.tsx`
- `webapp/components/toast.tsx`
- `webapp/lib/matches.ts`
- `webapp/lib/group-matches.ts`
- `webapp/lib/validation/tag.ts`

## Implemented
- 태그 생성/삭제 Server Action 추가
- 사용자 소유 태그만 연결되도록 서버에서 검증 추가
- `parseMatchForm()`이 `FormData`의 다중 `tagIds`를 실제로 파싱하도록 수정
- 신규 매치 생성 시 선택된 태그를 `createMany`로 연결
- 매치 수정 시 기존 태그를 삭제 후 재생성하는 방식으로 동기화
- 태그 선택 UI는 최대 10개까지 선택 가능하도록 제한
- 매치 조회 쿼리에 태그 include 추가
- 매치 목록과 토너먼트 타임라인에서 태그 칩 표시
- 토스트 메시지에 태그 추가/삭제 성공 문구 반영

## Test Results
- `npm.cmd run lint`: FAIL
  - 원인: `node_modules`가 없어 `next` 실행 파일을 찾지 못함
- `npm.cmd run build`: FAIL
  - 원인: `node_modules`가 없어 `next` 실행 파일을 찾지 못함

## Known Issues
- 현재 작업 환경의 `webapp/` 아래에 `node_modules`가 없어 `lint/build`를 실행 검증할 수 없었습니다.
- 실제 동작 검증은 의존성 설치 후 다시 확인이 필요합니다.

## Risks
- 기존 프로젝트 파일들에 인코딩이 섞여 있어 일부 사용자 문구를 정상 문자열로 정리한 파일과 그렇지 않은 파일이 공존합니다.
- 태그 rename, 태그 필터링, 태그 통계는 spec대로 이번 범위에서 제외했습니다.

## Follow-up Notes
- 의존성 설치 후 `npm run lint`, `npm run build` 재실행 필요
- QA 시 확인 항목:
  - `/settings/tags`에서 태그 생성/삭제
  - `/matches/new`에서 0~10개 태그 선택 후 저장
  - `/matches/[id]/edit`에서 기존 태그 표시 및 변경 반영
  - `/matches` 목록과 토너먼트 타임라인에서 태그 표시
