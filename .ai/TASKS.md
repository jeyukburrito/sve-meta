# TASKS.md — 티켓 목록 및 상태

## 상태 정의

| 상태 | 의미 |
|------|------|
| `draft` | spec 미승인 |
| `ready` | spec 승인, 구현 대기 |
| `in-progress` | Codex 구현 중 |
| `review` | Claude 리뷰 중 |
| `done` | 리뷰 통과 + 승인 완료 |
| `blocked` | 의사결정 또는 의존성 대기 |

## 티켓 목록

| ID | 제목 | 상태 | Spec | Result | Review | 비고 |
|----|------|------|------|--------|--------|------|
| T-001 | Tag 연동 | `done` | [spec](handoffs/T-001-spec.md) | [result](handoffs/T-001-result.md) | [review](reviews/T-001-review.md) | 설정 CRUD + 매치 폼 연동 + 목록 표시 |
| T-002 | 대시보드 개선 | `done` | [spec](handoffs/T-002-spec.md) | [result](handoffs/T-002-result.md) | [review](reviews/T-002-review.md) | 이벤트 카테고리 필터 + 상성 매트릭스 (모바일 우선) |
| T-003 | UI 일관성 개선 | `done` | [spec](handoffs/T-003-spec.md) | [result](handoffs/T-003-result.md) | [review](reviews/T-003-review.md) | Radius 통일, 배지 spacing, 접근성, 빈 상태, Bottom Nav 아이콘 |
| T-004 | 기록 페이지 버그·UIUX 개선 | `done` | [spec](handoffs/T-004-spec.md) | [result](handoffs/T-004-result.md) | [review](reviews/T-004-review.md) | 설정 아이콘 버그, 괄호 텍스트, 선후공 제거, 아이콘 버튼, 필터 2x2, 빈 상태 CTA |
| T-005 | 프로필 페이지 개선 | `done` | [spec](handoffs/T-005-spec.md) | [result](handoffs/T-005-result.md) | [review](reviews/T-005-review.md) | 아바타 확대, 통계 그리드, 관리 링크, Danger Zone 분리 |
| T-006 | 백엔드 안전성 개선 | `done` | [spec](handoffs/T-006-spec.md) | [result](handoffs/T-006-result.md) | [review](reviews/T-006-review.md) | 계정 삭제 순서, playedAt 검증, tournament end 결과 확인 |
| T-007 | 앱 성능 최적화 | `done` | [spec](handoffs/T-007-spec.md) | [result](handoffs/T-007-result.md) | [review](reviews/T-007-review.md) | force-dynamic 제거, Recharts dynamic import, next/image 적용 |
| T-008 | PWA 적용 | `ready` | [spec](handoffs/T-008-spec.md) | | | manifest, SW, 오프라인 페이지, 앱 아이콘 |
| T-009 | Tactical Editorial UI 전면 개편 | `ready` | [spec](handoffs/T-009-spec.md) | | | 디자인 토큰, TopAppBar, BottomNav, 대시보드·기록·입력·프로필 페이지 |
