# Code Review: Phase 2–3 기능 구현 (2026-03-14)

Reviewer: Claude Code
Scope: Phase 2 Core Screens CRUD + Phase 3 Dashboard 통계/차트 + Game 모델 일반화

---

## 1. 구조 변경 요약

### 신규 모델: `Game`
- 다중 카드게임 지원을 위한 상위 카테고리 모델
- `Deck`에 `gameId` FK 추가 → unique 제약이 `[userId, gameId, name]`으로 확장
- 마이그레이션에서 기존 덱에 "Shadowverse EVOLVE" 게임 자동 생성 + 백필 처리 — 잘 됨

### 페이지 구조 (현재)
```
/                           ← 랜딩 (공개)
/login                      ← Google 로그인 (공개)
/auth/callback              ← OAuth 콜백 (공개)
/dashboard                  ← 통계 대시보드 (인증)
/matches                    ← 기록 목록 + 필터 (인증)
/matches/new                ← 결과 입력 (인증)
/matches/[id]/edit          ← 결과 수정 (인증)
/settings                   ← 설정 허브 (인증)
/settings/games             ← 카드게임 관리 (인증)
/settings/decks             ← 덱 관리 (인증)
```

### 데이터 흐름
```
Game → Deck → MatchResult → MatchResultTag → Tag
                                    ↓
                            Dashboard 집계 (서버사이드)
```

---

## 2. 이전 검수 항목 반영 현황

| # | 항목 | 상태 |
|---|------|------|
| 2026-03-14 HIGH | `/matches/new` name/value 누락 | **반영 완료** — 모든 필드에 name + option value 정확 |
| 2026-03-13 #2 | 폰트 미로드 | 미반영 (보류) |
| 2026-03-13 #5 | AppShell 인증 상태 | 미반영 |
| isMatchWin 자동 계산 | 서버 액션에서 처리 | **반영 완료** — `isMatchWin: wins > losses` |
| Deck soft delete | 비활성화 패턴 | **반영 완료** — 삭제 대신 `isActive` 토글 |

---

## 3. 수정 필요 사항

### 3.1 [HIGH] 삭제 확인 없음

- **파일**: `app/matches/page.tsx:193-201`
- **문제**: 삭제 버튼이 `<form action={deleteMatchResult}>`으로 바로 제출. 확인 대화상자 없이 즉시 삭제됨. 모바일에서 잘못 탭하면 복구 불가.
- **해결**: 클라이언트 컴포넌트로 `confirm()` 또는 모달 추가.

```tsx
// 간단한 방법: 인라인 onSubmit
<form action={deleteMatchResult} onSubmit={(e) => {
  if (!confirm("이 기록을 삭제하시겠습니까?")) e.preventDefault();
}}>
```

> 이 패턴은 form을 클라이언트 컴포넌트로 분리하거나, 삭제 버튼만 별도 클라이언트 컴포넌트로 추출해야 함.

### 3.2 [MID] `updateMatchResult`의 TOCTOU 취약점

- **파일**: `app/matches/actions.ts:116-132`
- **문제**: 소유권 확인(`findFirst`)과 수정(`update`)이 분리되어 있음. `update({ where: { id: matchId } })`에 `userId` 조건이 없음. RLS가 방어해주긴 하지만, Prisma는 service_role 연결 시 RLS를 우회할 수 있음.
- **현재 코드**:

```ts
// 1단계: 소유권 확인
const existingMatch = await prisma.matchResult.findFirst({
  where: { id: matchId, userId: user.id },
});
// 2단계: 수정 (userId 미포함)
await prisma.matchResult.update({
  where: { id: matchId },
  data: { ... },
});
```

- **해결**: `deleteMatchResult`처럼 `updateMany` 패턴 사용:

```ts
await prisma.matchResult.updateMany({
  where: { id: matchId, userId: user.id },
  data: { ... },
});
```

> 단, `updateMany`는 relation을 반환하지 않으므로 반환값이 필요 없으면 이 패턴이 더 안전.

### 3.3 [MID] AppShell 헤더 "Shadowverse EVOLVE" 하드코딩

- **파일**: `components/app-shell.tsx:18-19`
- **문제**: 다중 카드게임 지원이 추가됐지만 헤더에 "Shadowverse EVOLVE" 고정. 다른 카드게임 사용자에게 혼란.
- **해결**: "Match Tracker" 또는 앱 이름으로 변경. 또는 prop으로 받아서 동적 표시.

### 3.4 [MID] Game 수정/삭제 미구현

- **파일**: `app/settings/games/actions.ts`
- **문제**: `createGame`만 존재. 오타로 등록한 게임 이름을 수정하거나 삭제할 수 없음.
- **해결**: `updateGame` (이름 변경), `deleteGame` (덱 0개일 때만) 추가. 또는 최소한 이름 수정 기능.

### 3.5 [LOW] `/matches/new`의 successMessage 도달 불가

- **파일**: `app/matches/new/page.tsx:17,49-53`
- **문제**: 성공 시 `redirect("/matches?message=record_created")`로 이동하므로 `/matches/new`의 `successMessage` 분기는 도달 불가 (dead code).
- **해결**: successMessage 관련 코드 제거하거나, 성공 후 `/matches/new?message=...`로 리다이렉트하여 연속 입력 지원.

### 3.6 [LOW] build.log 추적 중

- **파일**: `webapp/build.log`
- **문제**: 빌드 로그 파일이 git 추적 대상. `.gitignore`에 추가 필요.

### 3.7 [LOW] 대시보드 전체 데이터 로드

- **파일**: `app/dashboard/page.tsx:12-31`
- **문제**: `prisma.matchResult.findMany({ where: { userId } })` — limit/pagination 없음. 개인용 MVP에서는 수백~수천건까지 문제없지만, 장기적으로 응답 시간 저하 가능.
- **해결 (나중)**: 30일치만 로드하거나, 집계를 DB 쿼리로 이동.

---

## 4. UI 피드백

### 잘 된 부분
- **일관된 디자인 시스템**: `rounded-3xl` 카드, `accent/danger` 색상, `border-line` 구분선이 전체적으로 통일
- **모바일 퍼스트**: 하단 고정 네비게이션, 반응형 그리드 (`md:grid-cols-2`, `xl:grid-cols-4`)
- **빈 상태 처리**: 덱 0개, 기록 0개일 때 안내 메시지 + 비활성 버튼 처리 일관적
- **플래시 메시지**: URL 파라미터 기반 성공/에러 표시 — 서버 컴포넌트에서 합리적인 패턴
- **필터 UI**: 상대 덱 검색 + 카드게임/내 덱/형식 필터 드롭다운 조합 적절
- **차트**: Recharts 컬러가 디자인 토큰(accent, danger, ink, line)과 통일

### 개선 권장
- **삭제 버튼 위치**: 수정/삭제가 나란히 배치. 삭제 접근성을 낮추는 게 안전 (예: 수정 페이지 하단에 배치)
- **날짜 기본값**: `/matches/new` 날짜 필드에 오늘 날짜 기본값 없음. 모바일에서 매번 날짜 선택은 번거로움
- **승/패 입력**: BO1 선택 시 승/패가 자동으로 1:0 또는 0:1이 되면 입력이 빨라짐. 현재는 수동 입력 후 서버 밸리데이션
- **카드게임 → 덱 → 입력 온보딩**: 처음 사용 시 카드게임 → 덱 → 기록 순서를 안내하는 흐름이 없음. 빈 상태 메시지로 부분 해결되어 있지만, 설정 → 카드게임 → 덱 3단계가 직관적이지 않을 수 있음

---

## 5. 기능 구현 품질

### Match CRUD
| 항목 | 평가 |
|------|------|
| Create | `parseMatchForm` 공용 함수로 create/update 코드 중복 제거. 좋음 |
| Read | 필터 4종 조합 (상대덱, 게임, 내덱, 형식). Prisma where 조건 동적 조합 깔끔 |
| Update | 기존 값 `defaultValue`로 프리필. 좋음. TOCTOU 수정 권장 (3.2) |
| Delete | `deleteMany({ where: { id, userId } })` 패턴으로 소유권 보장. 좋음 |
| isMatchWin | `wins > losses` 자동 계산. 올바름 |
| Deck 소유권 | `ensureOwnedActiveDeck` 헬퍼로 비활성 덱 참조 방지. 좋음 |

### Dashboard 통계
| 항목 | 평가 |
|------|------|
| 서버사이드 계산 | `buildDashboardMetrics` — pure function, 테스트 용이. 좋음 |
| StatCard 4종 | 전체/7일/선공/BO3 승률. 핵심 KPI 커버 |
| 요약 테이블 3종 | 상대 덱, 카드게임별, 내 덱별. 구성 적절 |
| 차트 3종 | 선공/후공 바, BO1/BO3 바, 30일 라인. Recharts 활용 적절 |
| 트렌드 30일 | 날짜별 승/패/매치수. 빈 날짜도 0으로 채움. 좋음 |

### 마이그레이션
| 항목 | 평가 |
|------|------|
| 백필 로직 | 기존 유저에 기본 게임 생성 + 덱 backfill. NOT NULL 전환 순서 올바름 |
| 인덱스 교체 | 기존 인덱스 DROP 후 새 복합 인덱스 생성. 깔끔 |
| RLS 업데이트 | `drop policy if exists` + 재생성. 멱등성 확보 |

---

## 6. 남은 작업 체크리스트

### Phase 2 잔여
- [ ] AppShell 인증 상태 반영 (로그인/로그아웃 분기)
- [ ] Tag wiring (아직 미연결)
- [ ] 삭제 확인 대화상자

### Phase 3 잔여
- [ ] CSV 내보내기

### Phase 4
- [ ] 승인된 계정 제한
- [ ] 시드 테스트 데이터셋
- [ ] 프로덕션 환경변수 + Vercel 배포

### 추가 권장
- [ ] Game 수정/삭제 기능
- [ ] `/matches/new` 날짜 기본값 (오늘)
- [ ] BO1 선택 시 승/패 자동 설정 (클라이언트)
- [ ] 폰트 로드 (`next/font/google`)
- [ ] `build.log` gitignore 추가
