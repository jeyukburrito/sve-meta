# T-004 Spec — 기록 페이지 버그 수정 및 UIUX 개선

## 목적

기록 페이지 및 전체 앱에서 발견된 버그를 수정하고, PM·UIUX·Claude 3자 75% 이상 합의 항목을 개선한다.

---

## 1. Bottom Nav 설정 아이콘 버그 수정

### 문제
`components/bottom-nav.tsx`의 `NavIcon` 컴포넌트에서 `/settings` 분기가 없어 home 아이콘이 fallback으로 표시됨.

### 수정
`NavIcon` 함수에 `/settings` 분기 추가:

```tsx
if (href === "/settings") {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={common} aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor" strokeWidth="2"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor" strokeWidth="2"
      />
    </svg>
  );
}
```

**변경 파일:** `components/bottom-nav.tsx`

---

## 2. 페이즈 레이블 텍스트 단순화

### 문제
`tournament-timeline.tsx` line 94: `"본선 (토너먼트)"` / `"예선 (스위스)"` — 괄호 설명 불필요.

### 수정
```tsx
// 변경 전
{isElim ? "본선 (토너먼트)" : "예선 (스위스)"}

// 변경 후
{isElim ? "본선" : "예선"}
```

**변경 파일:** `components/tournament-timeline.tsx`

---

## 3. 친선 매치 카드 "선후공 결정" 정보 제거

### 문제
`matches/page.tsx` 친선 매치 카드의 메타 정보 줄:
```
BO1 · 승 · 선공 · 선후공 결정 O
```
"선후공 결정 O/X"는 목록 스캔에서 필요 없는 정보. DB에는 유지, 표시만 제거.

### 수정
```tsx
// 변경 전
{item.match.matchFormat.toUpperCase()} · {item.match.isMatchWin ? "승" : "패"} ·{" "}
{item.match.playOrder === "first" ? "선공" : "후공"} · 선후공 결정{" "}
{item.match.didChoosePlayOrder ? "O" : "X"}

// 변경 후
{item.match.matchFormat.toUpperCase()} ·{" "}
{item.match.playOrder === "first" ? "선공" : "후공"}
```

**변경 파일:** `app/matches/page.tsx`

---

## 4. 대회 타임라인 라운드 수정/삭제 터치 타겟 개선

### 문제
`tournament-timeline.tsx`의 라운드 행 수정/삭제가 `text-xs hover:underline` 텍스트 링크 — 모바일 터치 타겟 44px 미달.

### 수정
텍스트 링크 → 아이콘 버튼으로 교체. 인라인 SVG 아이콘 사용.

```tsx
// 수정 아이콘 버튼 (연필)
<Link
  href={`/matches/${match.id}/edit`}
  className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-line"
  aria-label="수정"
>
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</Link>

// 삭제 아이콘 버튼 (휴지통)
<button
  type="submit"
  onClick={(e) => { if (!window.confirm("이 라운드 기록을 삭제하시겠습니까?")) e.preventDefault(); }}
  className="flex size-8 items-center justify-center rounded-full text-danger hover:bg-danger/10"
  aria-label="삭제"
>
  <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</button>
```

라운드 행 하단 액션 영역: `flex items-center gap-1 mt-2` (기존 `flex items-center gap-3 mt-2` 대체)

**변경 파일:** `components/tournament-timeline.tsx`

---

## 5. 필터 모바일 레이아웃 개선

### 문제
`matches/page.tsx` 필터 form이 모바일에서 `grid-cols-1` 기본값 → 4개 select가 세로로 쌓여 화면의 40~50%를 차지.

### 수정
```tsx
// 변경 전
<form className="grid gap-3 md:grid-cols-4">

// 변경 후
<form className="grid grid-cols-2 gap-3 md:grid-cols-4">
```

모바일에서 2×2 레이아웃으로 표시. select 높이 `py-3` → `py-2.5`로 줄여 높이 절약.

**변경 파일:** `app/matches/page.tsx`

---

## 6. 빈 상태 UI 개선 (기록 없음 + 필터 결과 없음)

### 6-1. 전체 기록 없을 때 (현재: 텍스트만)

```tsx
// 변경 전
<article className="rounded-3xl border border-dashed ...">
  아직 등록한 대전 기록이 없습니다.
</article>

// 변경 후
<article className="rounded-3xl border border-dashed ... text-center">
  <p className="text-sm text-muted">아직 등록한 대전 기록이 없습니다.</p>
  <Link
    href="/matches/new"
    className="mt-3 inline-block rounded-2xl border border-accent px-4 py-2 text-sm font-medium text-accent"
  >
    첫 매치 기록하기
  </Link>
</article>
```

### 6-2. 필터 적용 후 결과 없을 때

현재: 빈 상태 없이 목록이 그냥 비어 있음.

`displayItems.length === 0`이고 필터가 하나라도 적용된 경우 별도 빈 상태 표시:

```tsx
<article className="rounded-3xl border border-dashed ... text-center">
  <p className="text-sm text-muted">조건에 맞는 기록이 없습니다.</p>
  <Link href="/matches" className="mt-3 inline-block text-sm text-accent underline underline-offset-2">
    필터 초기화
  </Link>
</article>
```

필터 적용 여부 판단: `gameIdQuery || deckIdQuery || formatQuery || eventQuery` 중 하나라도 있으면 "필터 적용 상태".

**변경 파일:** `app/matches/page.tsx`

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `components/bottom-nav.tsx` | /settings gear 아이콘 분기 추가 |
| `components/tournament-timeline.tsx` | 괄호 텍스트 제거, 라운드 수정/삭제 아이콘 버튼화 |
| `app/matches/page.tsx` | 선후공 결정 제거, 필터 grid-cols-2, 빈 상태 CTA |

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- DB 마이그레이션 없음 (표시 로직 변경만)
- 기존 수정/삭제 기능 동작 변경 없음

---

## 범위 외 (Out of Scope) — 별도 티켓

- 대회 타임라인 기본 접힘 처리 (accordion)
- Load More 방식 페이지네이션
- 필터 바텀 시트 전환
- 삭제 `window.confirm` → 커스텀 확인 UI
- 카드 시각 계층 재설계 (accent bar 등)
