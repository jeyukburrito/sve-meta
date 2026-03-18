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
