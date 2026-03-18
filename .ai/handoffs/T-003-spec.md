# T-003 Spec — UI 일관성 개선

## 목적

현재 UI의 디자인 불일치, 접근성 결함, 시각적 계층구조 문제를 수정하여 일관성 있고 접근 가능한 UI를 구축한다.

---

## 1. Radius 통일

### 문제
버튼이 `rounded-2xl`(필터 버튼)과 `rounded-full`(일반 버튼)로 혼용됨. 같은 역할인데 기준 없이 다른 radius 적용.

### 수정 기준

| 요소 | 적용 radius |
|------|------------|
| 카드 컨테이너 (`article`) | `rounded-3xl` — 유지 |
| 모든 버튼 (필터, 일반, submit) | `rounded-2xl` — 통일 |
| 배지, 태그 | `rounded-full` — 유지 |
| select, input | `rounded-2xl` — 유지 |

**변경 대상 파일:**
- `components/period-filter.tsx` — "적용" 버튼 `rounded-full` → `rounded-2xl`
- 기타 `rounded-full`인 `<button>` 요소 전수 검색 후 `rounded-2xl`로 변경

---

## 2. 배지 Spacing 통일

### 문제
- 카테고리 배지: `py-0.5` (높이 ~20px)
- 승리/패배 배지: `py-1` (높이 ~24px)
- 같은 행에 혼재 시 높이 불일치

### 수정
모든 배지를 `py-1`로 통일.

**변경 대상:** 배지를 렌더링하는 모든 컴포넌트 (`tournament-timeline.tsx`, `match-result-input.tsx` 등)

---

## 3. 차트 색상 CSS 변수화

### 문제
도넛 차트 범례의 색상 인디케이터가 `style="background-color: #4f46e5"`로 하드코딩 — 다크모드에서 accent 색상 변경(`#818cf8`) 미반영.

### 수정
- `dashboard-charts.tsx`의 `COLORS` 배열 첫 번째 색을 `var(--color-accent)` 사용 또는
- 범례 인디케이터의 `style` 속성에서 hex 직접 사용 유지하되, accent 색상 위치를 `getComputedStyle`로 읽어 적용

**현실적 접근:**
`COLORS` 배열 자체는 그대로 유지하되, 인디케이터 `<span>`의 배경색에 한해 첫 번째 항목을 `bg-accent` Tailwind 클래스로 교체. 나머지는 hex 유지 (CSS 변수로 전환하려면 Tailwind JIT 설정 변경 필요 — 범위 초과).

**변경 대상:** `components/dashboard-charts.tsx`

---

## 4. Bottom Nav 터치 타겟 개선

### 문제
- 텍스트 레이블만 있어 탭 인식 속도 저하
- `py-3`만으로 44px 최소 터치 타겟 미달 가능성

### 수정
- `py-3` → `py-3.5` (높이 확보)
- 각 탭에 아이콘 추가 (SVG inline 또는 lucide-react)

**아이콘 매핑:**

| 탭 | 아이콘 |
|----|--------|
| 기록 추가 | `Plus` (원 안에 +) |
| 매치 목록 | `List` |
| 대시보드 | `BarChart2` |
| 설정 | `Settings` |

- `lucide-react`가 없으면 SVG inline으로 구현 (외부 패키지 추가 금지)
- 아이콘 크기: `size-5` (20px)
- 라벨 크기: `text-xs` (현재 `text-sm` → 축소)
- 레이아웃: `flex flex-col items-center gap-0.5`

**변경 대상:** `components/bottom-nav.tsx`

---

## 5. 필터 버튼 aria-pressed 추가

### 문제
활성 상태를 색상으로만 표현 — 스크린리더 인식 불가.

### 수정
`PeriodFilter`의 프리셋 버튼에 `aria-pressed={activePeriod === p.value}` 추가.
향후 생성되는 `CategoryFilter`에도 동일 패턴 적용 (T-002 구현 시 포함).

**변경 대상:** `components/period-filter.tsx`

---

## 6. 헤더 시맨틱 구조 수정

### 문제
```html
<p class="text-xs ... text-accent">TCG Match Tracker</p>  <!-- 브랜드명 -->
<h1 class="text-lg font-semibold">{title}</h1>             <!-- 페이지 타이틀 -->
```
`<p>` 브랜드명이 `<h1>` 위에 있어 스크린리더 계층 혼란.

### 수정
브랜드명을 `<p>` → `<span>`으로 변경하고 `<h1>` 안에 포함하거나, `aria-hidden="true"` 추가.

```html
<div>
  <span aria-hidden="true" class="text-xs font-semibold uppercase tracking-[0.2em] text-accent block">
    TCG Match Tracker
  </span>
  <h1 class="text-lg font-semibold">{title}</h1>
</div>
```

**변경 대상:** `components/app-shell.tsx`

---

## 7. 빈 상태 UI 개선 (대시보드)

### 문제
데이터 없을 때 "표시할 데이터가 없습니다." 텍스트만 표시 — 사용자 액션 유도 없음.

### 수정
빈 상태에 매치 기록 추가 링크 삽입:

```html
<p class="mt-4 text-sm text-muted">표시할 데이터가 없습니다.</p>
<a href="/matches/new" class="mt-3 inline-block text-sm text-accent underline underline-offset-2">
  첫 매치를 기록해보세요 →
</a>
```

**변경 대상:** `components/dashboard-charts.tsx` (DonutChart 내 빈 상태)

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `components/bottom-nav.tsx` | py 확대, 아이콘 추가, 라벨 text-xs |
| `components/period-filter.tsx` | 버튼 rounded-2xl 통일, aria-pressed 추가 |
| `components/app-shell.tsx` | 헤더 시맨틱 구조 수정 (p → span + aria-hidden) |
| `components/dashboard-charts.tsx` | 빈 상태 액션 링크 추가, 범례 첫 색상 bg-accent 적용 |
| 배지 포함 컴포넌트 (전수) | py-0.5 → py-1 통일 |
| 버튼 rounded-full 포함 파일 (전수) | rounded-full → rounded-2xl (button 한정) |

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 기능 동작 변경 없음 (스타일/시맨틱 수정만)

---

## 범위 외 (Out of Scope)

- 차트 자체에 aria-label 추가 (Recharts 내부 SVG 수정 필요 — 별도 티켓)
- 승/패 색상 외 추가 시각 표시 (패턴, 아이콘) — 별도 티켓
- 다크모드 chart 색상 대비 검증 — 별도 티켓
- 날짜 input native picker 스타일링
