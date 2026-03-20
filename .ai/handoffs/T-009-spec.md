# T-009 Spec — "Tactical Editorial" UI 전면 개편

## 목적

`stitch_input_match_result/` 폴더의 Stitch 디자인 산출물(4개 HTML 목업 + `DESIGN.md`)을 기반으로,
기존 webapp의 UI를 **Tactical Editorial 디자인 시스템**으로 전면 개편한다.

레퍼런스 파일:
- 디자인 시스템: `stitch_input_match_result/stitch_input_match_result/mana_grid/DESIGN.md`
- 대시보드: `stitch_input_match_result/stitch_input_match_result/pwa_4/code.html`
- 기록 목록: `stitch_input_match_result/stitch_input_match_result/pwa_3/code.html`
- 결과 입력: `stitch_input_match_result/stitch_input_match_result/pwa_2/code.html`
- 설정/프로필: `stitch_input_match_result/stitch_input_match_result/pwa_1/code.html`

---

## 1. 디자인 토큰 — `tailwind.config.ts` 확장

`DESIGN.md`에 정의된 Material You 색상 팔레트를 Tailwind 커스텀 컬러로 등록한다.

```ts
// tailwind.config.ts (extend.colors에 추가)
"surface-container-highest": "#e1e2e4",
"surface-container-high": "#e7e8ea",
"surface-container": "#edeef0",
"surface-container-low": "#f3f4f6",
"surface-container-lowest": "#ffffff",
"surface": "#f8f9fb",
"surface-dim": "#d9dadc",
"surface-bright": "#f8f9fb",
"on-surface": "#191c1e",
"on-surface-variant": "#474554",
"primary": "#513fc6",
"primary-container": "#6a5ae0",
"primary-fixed": "#e4dfff",
"primary-fixed-dim": "#c7bfff",
"on-primary": "#ffffff",
"on-primary-container": "#f5f1ff",
"on-primary-fixed": "#170065",
"on-primary-fixed-variant": "#412bb6",
"inverse-primary": "#c7bfff",
"secondary": "#006492",
"secondary-container": "#58bcfd",
"secondary-fixed": "#cae6ff",
"secondary-fixed-dim": "#8ccdff",
"on-secondary": "#ffffff",
"on-secondary-container": "#004a6d",
"on-secondary-fixed": "#001e2f",
"on-secondary-fixed-variant": "#004b6f",
"tertiary": "#844600",
"tertiary-container": "#a75b00",
"tertiary-fixed": "#ffdcc2",
"tertiary-fixed-dim": "#ffb77b",
"on-tertiary": "#ffffff",
"on-tertiary-container": "#fff0e6",
"on-tertiary-fixed": "#2e1500",
"on-tertiary-fixed-variant": "#6d3a00",
"error": "#ba1a1a",
"error-container": "#ffdad6",
"on-error": "#ffffff",
"on-error-container": "#93000a",
"outline": "#787585",
"outline-variant": "#c8c4d6",
"surface-variant": "#e1e2e4",
"inverse-surface": "#2e3132",
"inverse-on-surface": "#f0f1f3",
"surface-tint": "#5948ce",
"background": "#f8f9fb",
"on-background": "#191c1e",
```

`borderRadius` 확장:
```ts
borderRadius: {
  "DEFAULT": "0.25rem",
  "md": "0.75rem",
  "lg": "0.5rem",
  "xl": "1.5rem",   // 큰 컨테이너 카드
  "2xl": "1.5rem",
  "full": "9999px",
}
```

> **주의**: 기존 CSS 변수(`--color-*`) 방식과 충돌하지 않도록 병행 유지. 기존 변수 제거 금지.

---

## 2. 전역 레이아웃 (`app/layout.tsx`, `components/bottom-nav.tsx`)

### 2-1. TopAppBar

모든 페이지 상단에 적용되는 공통 헤더. `components/top-app-bar.tsx` 신규 생성.

```
스타일:
- 배경: bg-surface/70 + backdrop-blur-xl (glassmorphism)
- 그림자: shadow-[0_12px_32px_-4px_rgba(25,28,30,0.08)]
- position: sticky top-0 z-50
- 높이: py-4 (내부 패딩 포함 약 64px)
- 좌: 앱 아이콘(style 아이콘) + "TCG MATCH TRACKER" (font-black tracking-tighter text-indigo-700)
- 우: notifications 아이콘 버튼
```

### 2-2. BottomNav 개편 (`components/bottom-nav.tsx`)

현재 4탭 구조를 Stitch 목업 스타일로 교체.

| 탭 | 아이콘 | 레이블 | 라우트 |
|----|--------|--------|--------|
| Dashboard | dashboard | Dashboard | /dashboard |
| Records | history | Records | /records |
| Input | add_circle | Input | /match/new |
| Settings | settings | Settings | /profile |

**Active 상태**: `bg-indigo-100 text-indigo-700 rounded-2xl` pill 배경
**Inactive 상태**: `text-slate-500`
**전체 바 스타일**:
- `fixed bottom-0` + `bg-surface/80 backdrop-blur-lg`
- `shadow-[0_-8px_24px_-4px_rgba(25,28,30,0.06)]`
- `h-20` + `pb-safe`(safe-area-inset-bottom)
- 탭 라벨: `text-[10px] font-bold uppercase tracking-widest`

> `pwa_4/code.html`의 대안 구조(중앙 FAB 돌출): 옵션이나 **기본 4탭 동일선 구조**를 우선 적용. 중앙 FAB는 Out of Scope.

### 2-3. 페이지 body

- `bg-surface text-on-surface min-h-screen pb-24`
- 최대 너비: `max-w-md mx-auto` (페이지 레벨 `<main>` 에 적용)

---

## 3. 대시보드 페이지 (`app/dashboard/page.tsx`)

레퍼런스: `pwa_4/code.html`

### 3-1. 헤더 섹션

```
- 우상단: 7일 / 30일 / 전체 세그먼트 토글 (rounded-full pill 스타일)
- 좌하: "Overview" 라벨 (text-[10px] uppercase tracking-widest text-primary)
- 제목: "대시보드" (text-2xl font-bold)
```

### 3-2. Stats Hero Cards (2-column grid)

```
승률 카드:
  - bg-surface-container-lowest + rounded-xl shadow
  - 라벨: "승률 (Win Rate)" text-[10px] uppercase tracking-wider text-slate-400
  - 수치: text-3xl font-black text-primary (예: 68.2%)
  - 추세: trending_up 아이콘 + "+2.4% vs Last Week" (text-primary-fixed-dim)

총 전적 카드:
  - 동일 컨테이너
  - 수치: text-3xl font-black text-on-surface
  - 서브: "30W 14L" text-slate-400
```

실제 데이터: 기존 `lib/dashboard.ts` 집계값 사용. 추세 비교는 **Out of Scope** (고정 표시 생략 또는 현재 기간만 표시).

### 3-3. 도넛 차트 섹션

```
컨테이너: bg-surface-container-low p-6 rounded-2xl

사용 덱 분포:
  - CSS conic-gradient 도넛 (라이브러리 없음)
  - 범례: 덱명 + 매치 수
  - 데이터: 기간 내 내 덱별 매치 수 Top 3

상대 덱 분포:
  - 동일 구조
  - 데이터: 기간 내 상대 덱별 매치 수 Top 3
```

> 기존 Recharts 차트는 대시보드에서 제거하고 CSS 도넛으로 교체.

### 3-4. 상성 매트릭스

```
- 섹션 제목: "상성 매트릭스" + "View All" 링크
- 리스트 아이템: bg-surface-container-lowest rounded-xl p-4
  - 좌: 상대 덱명 + 승률
  - 우: XW / YL 배지 (승: bg-primary-fixed-dim/20 text-primary, 패: bg-error-container/40 text-error)
- 데이터: 상대 덱별 승패 집계, 매치 수 많은 순 Top 5
```

---

## 4. 기록 목록 페이지 (`app/records/page.tsx`)

레퍼런스: `pwa_3/code.html`

> **현재 라우트** `/records` 또는 기존 경로 확인 후 적용.

### 4-1. 필터 칩

```
- 가로 스크롤 (overflow-x-auto no-scrollbar)
- 칩 스타일: rounded-full text-xs font-bold
- Active 칩: bg-primary text-on-primary shadow-md
- Inactive 칩: bg-surface-container-high text-on-surface-variant
- 칩 목록: All Games(카드게임 필터) / All Decks(내 덱 필터) / All Formats(BO1·BO3)
```

### 4-2. 기록 카드

현재 매치 리스트 카드를 아래 구조로 교체:

```
컨테이너: bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(25,28,30,0.08)]

헤더 행:
  - 좌: 카테고리 배지(CS TOURNAMENT/STORE LEAGUE 등) + 날짜 상대값
  - 좌 하단: 내 덱명 (text-lg font-bold tracking-tight)
  - 우: 전체 승패 수치 (text-2xl font-black text-indigo-600)

세션 내 라운드 목록 (TournamentSession이 있는 경우):
  - 컨테이너: bg-surface-container-low p-4 rounded-lg space-y-3
  - 각 라운드: R{n} | 상대 덱명 | 승/패 배지
  - 승 배지: text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded
  - 패 배지: text-xs font-black text-error bg-error-container/20 rounded

단일 매치 (세션 없음):
  - 라운드 목록 없이 상대 덱 + 승패만 표시
```

> **구분자(divider) 사용 금지** — DESIGN.md No-Line 룰 준수.

---

## 5. 결과 입력 페이지 (`app/match/new/page.tsx` 또는 기존 경로)

레퍼런스: `pwa_2/code.html`

### 5-1. 페이지 제목

```
"New Record" 라벨 (text-[10px] uppercase tracking-widest text-primary)
"결과 입력" 제목 (text-2xl font-bold)
```

### 5-2. 토너먼트 카테고리 (Segmented Control)

```
컨테이너: flex p-1.5 bg-surface-container-low rounded-xl
버튼: flex-1 py-3 text-sm font-bold rounded-lg
Active: bg-surface-container-lowest shadow-sm text-primary
Inactive: text-outline
옵션: Friendly / Store / CS (기존 eventCategory 값 매핑)
```

### 5-3. 덱 선택 (커스텀 드롭다운)

```
- 내 덱 선택 + 상대 덱 선택 (grid grid-cols-2 gap-4)
- 스타일: bg-surface-container-high rounded-xl px-4 py-4 (Soft Box 스타일)
- 레이블: text-[11px] font-bold uppercase tracking-wider text-outline
- 선택값 + expand_more 아이콘

⚠️ 기존 <select> → 커스텀 바텀시트 or 커스텀 드롭다운으로 교체
  - DESIGN.md: "Don't use standard Select dropdowns"
  - 구현: 탭 클릭 시 옵션 목록이 풀스크린 시트로 올라오는 방식
  - 바텀시트 구현이 복잡하면 커스텀 드롭다운 오버레이(div 기반)로 대체
```

### 5-4. 승패 버튼

```
grid grid-cols-2 gap-4

승리 버튼:
  - h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary
  - emoji_events 아이콘 (FILL 1) + "승리" 텍스트
  - active:scale-95 transition-all

패배 버튼:
  - h-24 rounded-2xl bg-surface-container-lowest border-2 border-outline-variant/15 text-outline
  - sentiment_dissatisfied 아이콘 + "패배" 텍스트
```

### 5-5. Format / Turn Order 토글

```
Format (BO1/BO3) + Turn Order (1ST/2ND): grid grid-cols-2 gap-6
각각 rounded-full pill segmented control 스타일
Active: bg-surface-container-lowest shadow-sm text-on-surface
Inactive: text-outline
```

### 5-6. 저장 버튼 (Sticky)

```
fixed bottom-24 left-0 right-0 px-5 z-40
h-[56px] bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg
shadow-[0_12px_32px_-4px_rgba(81,63,198,0.3)] active:scale-[0.98]
```

---

## 6. 프로필/설정 페이지 (`app/profile/page.tsx`)

레퍼런스: `pwa_1/code.html`

### 6-1. 프로필 카드

```
bg-surface-container-lowest p-6 rounded-xl flex items-center gap-6 shadow-sm
- 아바타: w-20 h-20 rounded-full ring-4 ring-primary-fixed
- 이름: text-xl font-bold tracking-tight
- 이메일: text-on-surface-variant text-sm
- 역할 배지: bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase
```

### 6-2. Stats Bento Grid (2×2)

```
grid grid-cols-2 gap-4

각 셀: rounded-xl p-5 h-32 flex flex-col justify-between
- 아이콘 상단
- 수치: text-[2.75rem] font-bold leading-none tracking-tighter
- 라벨: text-[10px] font-bold uppercase tracking-wider text-on-surface-variant

셀 1 (Total Matches): bg-surface-container-low + leaderboard 아이콘 (text-indigo-600)
셀 2 (Win Rate): bg-primary-container text-on-primary-container + military_tech 아이콘
셀 3 (Decks): bg-surface-container-low + layers 아이콘
셀 4 (Last Play): bg-surface-container-low + calendar_today 아이콘 (마지막 매치 날짜)
```

### 6-3. 관리 링크 목록

```
bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm

각 항목: flex items-center justify-between p-5 hover:bg-surface-container-low
  - 좌: w-10 h-10 rounded-lg bg-indigo-50 아이콘 박스 + 메뉴명
  - 우: chevron_right

항목: Manage Decks → /decks | Manage Tags → /tags
(Manage Games는 기존 게임 관리 페이지가 없으면 생략)
```

### 6-4. 계정 정보 & Danger Zone

기존 구조 유지, 스타일만 교체:

```
계정 정보: bg-surface-container-lowest p-5 rounded-xl shadow-sm
  - Member Since + 가입일

Danger Zone: bg-error-container/20 p-4 rounded-xl
  - 섹션 라벨: text-error uppercase tracking-widest
  - 안내 문구
  - 탈퇴 버튼: w-full bg-error text-on-error py-4 rounded-xl font-bold shadow-lg shadow-error/20
```

---

## 7. 아이콘 시스템

Material Symbols Outlined 사용:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

`app/layout.tsx`의 `<head>`에 추가 (또는 `next/font`로 최적화).

```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

> 기존 Heroicons/Lucide 아이콘과 혼용 가능. 신규 컴포넌트는 Material Symbols 우선.

---

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `tailwind.config.ts` | 색상 토큰 + borderRadius 확장 |
| `app/layout.tsx` | Material Symbols 폰트 링크 추가 |
| `components/top-app-bar.tsx` | 신규 — 공통 TopAppBar 컴포넌트 |
| `components/bottom-nav.tsx` | 수정 — Tactical Editorial 스타일로 전면 교체 |
| `app/dashboard/page.tsx` | 수정 — Stats hero, CSS 도넛 차트, 상성 매트릭스 |
| `app/records/page.tsx` (또는 현재 기록 라우트) | 수정 — 필터 칩, 세션 기반 기록 카드 |
| `app/match/new/page.tsx` (또는 현재 입력 라우트) | 수정 — Segmented 카테고리, 커스텀 드롭다운, 승패 버튼, Sticky CTA |
| `app/profile/page.tsx` | 수정 — 프로필 카드, Bento grid, 관리 링크, Danger Zone |

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 기능 동작 유지 (스타일만 변경, 로직 수정 금지)
- DB 마이그레이션 없음
- 새 외부 라이브러리 추가 없음 (CSS 도넛, Material Symbols는 CDN/Google Fonts)
- 모바일 우선 (max-w-md, pb-safe 등 safe area 대응)

---

## 범위 외 (Out of Scope)

- 중앙 FAB 돌출형 BottomNav (단순 4탭 우선)
- 커스텀 바텀시트 애니메이션 (기본 드롭다운 오버레이 허용)
- 다크 모드 (현재 앱 미지원, 추후 티켓)
- 대시보드 추세 비교 (+2.4% 등) — 현재 기간 수치만 표시
- 아바타 편집 기능
- Lighthouse PWA 점수 최적화 (T-008에서 처리)
- 메모(Match Notes) 필드 신규 추가 (기존 DB 스키마 변경 없음)
