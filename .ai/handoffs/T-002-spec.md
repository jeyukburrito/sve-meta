# T-002 Spec — 대시보드 이벤트 카테고리 필터 + 상성 매트릭스

## 목적

대시보드에 두 가지 기능을 추가한다.
1. **이벤트 카테고리 필터** — 친선/샵 대회/CS 별로 데이터 분리 조회
2. **상성 매트릭스** — 내 덱 vs 상대 덱 승률 히트맵 테이블

---

## 1. 이벤트 카테고리 필터

### 1-1. UI (PeriodFilter 아래, 별도 컴포넌트)

새 파일: `components/category-filter.tsx` (클라이언트 컴포넌트)

- 버튼 4개: **전체** | **친선** | **샵 대회** | **CS**
- URL 파라미터: `category`
  - 전체 → `category` 파라미터 없음 (또는 `all`)
  - 친선 → `category=friendly`
  - 샵 대회 → `category=shop`
  - CS → `category=cs`
- 활성 버튼: `border-accent bg-accent text-white` (PeriodFilter와 동일 스타일)
- 비활성 버튼: `border-line bg-surface text-ink`
- `router.push` 시 기존 `period`/`from`/`to` 파라미터 유지

### 1-2. 데이터 레이어 (`lib/dashboard.ts`)

`FilterOptions` 타입에 `category?: string` 추가:

```ts
export type FilterOptions = {
  period: string;
  from?: string;
  to?: string;
  category?: string; // "friendly" | "shop" | "cs" | undefined(전체)
};
```

`buildWhereSql`에 조건 추가:

```ts
if (category && category !== "all") {
  clauses.push(Prisma.sql`m."eventCategory" = ${category}::"EventCategory"`);
}
```

### 1-3. 페이지 (`app/dashboard/page.tsx`)

- `searchParams`에서 `category` 읽기
- `getDashboardData`와 `getMatchupMatrix` 모두에 `category` 전달
- `CategoryFilter` 컴포넌트 렌더링 (PeriodFilter 바로 아래)

---

## 2. 상성 매트릭스

### 2-1. 데이터 (`lib/dashboard.ts`)

새 함수 `getMatchupMatrix` 추가:

```ts
export type MatchupCell = {
  myDeck: string;
  opponentDeck: string;
  wins: number;
  total: number;
  rate: number; // 0~100 정수
};

export async function getMatchupMatrix(
  userId: string,
  opts: FilterOptions,
): Promise<MatchupCell[]>
```

SQL:

```sql
SELECT
  d."name" AS "myDeck",
  m."opponentDeckName" AS "opponentDeck",
  COUNT(*)::bigint AS total,
  SUM(CASE WHEN m."isMatchWin" THEN 1 ELSE 0 END)::bigint AS wins
FROM "match_results" m
INNER JOIN "decks" d ON d."id" = m."myDeckId"
{whereSql}
GROUP BY d."name", m."opponentDeckName"
ORDER BY d."name" ASC, m."opponentDeckName" ASC
```

- `bigint` → `number` 변환 (`bigintToNumber` 기존 헬퍼 사용)
- `rate = total === 0 ? 0 : Math.round((wins / total) * 100)`

### 2-2. UI (`components/matchup-matrix.tsx`)

새 파일: `components/matchup-matrix.tsx` (클라이언트 컴포넌트)

#### 모바일 우선 설계 방침

모바일에서 전체 매트릭스 테이블은 가로 스크롤이 깊어지고 행·열을 동시에 추적해야 해 사용성이 낮다.
**기본 뷰: 내 덱 탭 + 상대 덱 카드 목록**으로 구현하고, "전체 보기" 토글로 테이블 뷰를 선택적으로 제공한다.

---

#### 기본 뷰: 내 덱 탭 + 상대 덱 카드 목록

**내 덱 탭**
- `myDeck` 종류만큼 탭 버튼 렌더링
- 탭 스타일: 기존 PeriodFilter 버튼과 동일 (`rounded-2xl`, 활성=`bg-accent text-white`)
- 내 덱이 4개 초과이면 `overflow-x-auto` 가로 스크롤로 표시

**상대 덱 카드 목록**
- 선택된 내 덱 기준으로 상대 덱별 행 렌더링
- 상대 덱 없으면 "기록 없음" 메시지
- 각 행 레이아웃:

```
[상대 덱명] [승률 배지] [n승/n전 muted]
```

- 행 스타일: `flex items-center justify-between py-2 border-b border-line last:border-0`
- 승률 배지 색상:

| 승률 | 클래스 |
|------|--------|
| 70% 이상 | `bg-success/10 text-success` |
| 50~69% | `bg-accent/10 text-accent` |
| 30~49% | `bg-danger/10 text-danger` |
| 30% 미만 | `bg-danger/20 text-danger` |
| 3전 미만 (샘플 부족) | `bg-line text-muted` + `{total}전` 텍스트만 |

---

#### 전체 테이블 뷰 (토글)

- 카드 우측 상단에 `"전체 보기"` / `"목록 보기"` 토글 버튼 (`text-xs text-accent`)
- 클라이언트 `useState`로 `isTableView` 관리 (URL 파라미터 불필요)
- 테이블 뷰:
  - 행 = 내 덱, 열 = 상대 덱
  - `overflow-x-auto` 래퍼 + 첫 열 `sticky left-0 bg-surface`
  - 셀: `min-w-[64px] px-2 py-1.5 text-center text-xs`
  - 셀 배경 색상: 위 목록 뷰와 동일 기준
  - 3전 미만: `—` (회색)
  - 헤더 셀: `bg-paper text-muted text-xs font-medium`

---

#### 공통

- 컴포넌트 상단 타이틀: `"상성 매트릭스"` (`h2 text-lg font-semibold`)
- 전체 데이터 없을 시: `"표시할 데이터가 없습니다."` 텍스트
- 래핑 컨테이너: `rounded-3xl border border-line bg-surface p-5 shadow-sm` (기존 카드 패턴)

### 2-3. 페이지 통합

`app/dashboard/page.tsx`:
- `getDashboardData`와 `getMatchupMatrix`를 `Promise.all`로 병렬 실행
- `DashboardCharts` 아래에 `MatchupMatrix` 컴포넌트 렌더링
- `MatchupMatrix`는 `matchupCells` prop 하나만 받음

---

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `lib/dashboard.ts` | `FilterOptions`에 `category` 추가, `buildWhereSql` 조건 추가, `getMatchupMatrix` 신규 함수 |
| `app/dashboard/page.tsx` | `category` 파라미터 읽기, `CategoryFilter` + `MatchupMatrix` 렌더링, `getMatchupMatrix` 호출 |
| `components/category-filter.tsx` | 신규 — 이벤트 카테고리 버튼 필터 |
| `components/matchup-matrix.tsx` | 신규 — 상성 매트릭스 테이블 |

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 `PeriodFilter` 동작 변경 없음
- 기존 `DashboardCharts` 변경 없음 (category 필터는 데이터 레이어에서만 처리)

---

## 범위 외 (Out of Scope)

- 상성 매트릭스 내 정렬 기능
- 매트릭스 셀 클릭 → 해당 매치 목록 drill-down
- 모바일 전용 대체 뷰 (가로 스크롤로 대응)
