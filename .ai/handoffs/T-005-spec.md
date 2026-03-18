# T-005 Spec — 프로필 페이지 개선

## 목적

현재 프로필 페이지(아바타 + 이름 + 가입일 + 회원탈퇴)가 너무 허전하다는 피드백에 따라,
활동 통계·관리 링크·Danger Zone 분리로 정보 밀도와 UX를 개선한다.

---

## 레이아웃 구조 (변경 후)

```
[Hero 카드]
  아바타 (96px, accent ring) + 이름 + 이메일

[내 기록 섹션]
  2열 stat 그리드 (총 매치 / 승률 / 등록 덱 수 / 마지막 플레이)

[관리 섹션]
  덱 관리 N개 →
  게임 관리 →
  태그 관리 N개 →

[계정 정보 섹션]
  가입일

[위험 구역]
  회원 탈퇴 안내 + 버튼
```

---

## 1. Hero 카드 — 아바타 섹션 개선

### 변경 내용

**아바타**
- 크기: `size-20` (80px) → `size-24` (96px)
- 외곽 ring 추가: `ring-2 ring-accent ring-offset-2 ring-offset-surface`
- 기존 `bg-accent/10 text-accent` fallback 유지

```tsx
<div className="size-24 rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface overflow-hidden bg-accent/10 text-accent flex items-center justify-center">
```

**레이아웃 유지**: 중앙 정렬 (`flex flex-col items-center`), 이름·이메일 현행 유지

---

## 2. 통계 섹션 신규 추가

### 데이터 쿼리 (`app/settings/profile/page.tsx` 서버 컴포넌트)

기존 `prisma.user.findUnique` 와 함께 `Promise.all`로 병렬 실행:

```ts
const [profile, stats] = await Promise.all([
  prisma.user.findUnique({ where: { id: authUser.id } }),
  getProfileStats(authUser.id),
]);
```

`getProfileStats` 함수를 `app/settings/profile/page.tsx` 내 또는 별도 lib 함수로 구현:

```ts
async function getProfileStats(userId: string) {
  const [matchStats, deckCount, tagCount, gameCount] = await Promise.all([
    prisma.matchResult.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { isMatchWin: true },   // boolean → 1/0 합계 (Prisma에서 지원 안 되면 $queryRaw 사용)
      _max: { playedAt: true },
    }),
    prisma.deck.count({ where: { userId, isActive: true } }),
    prisma.tag.count({ where: { userId } }),
    prisma.game.count({ where: { userId } }),
  ]);

  const total = matchStats._count._all;
  const wins = // isMatchWin이 boolean이면 $queryRaw로 COUNT(CASE WHEN "isMatchWin" THEN 1 END) 사용
  const rate = total === 0 ? null : Math.round((wins / total) * 100);
  const lastPlayedAt = matchStats._max.playedAt;

  return { total, wins, rate, lastPlayedAt, deckCount, tagCount, gameCount };
}
```

> `isMatchWin`이 boolean이라 `_sum` 집계가 안 될 경우 `$queryRaw` 사용:
> ```sql
> SELECT
>   COUNT(*)::int AS total,
>   COUNT(*) FILTER (WHERE "isMatchWin") AS wins,
>   MAX("playedAt") AS "lastPlayedAt"
> FROM match_results WHERE "userId" = CAST(${userId} AS uuid)
> ```

### UI — 2열 stat 그리드

Hero 카드 하단 `border-t` 아래에 배치하는 대신 **별도 카드 섹션**으로 분리:

```tsx
<section className="mt-4">
  <h2 className="mb-3 px-1 text-sm font-semibold text-muted">내 기록</h2>
  <div className="grid grid-cols-2 gap-3">
    <StatCard label="총 매치" value={`${stats.total}전`} />
    <StatCard label="승률" value={stats.rate !== null ? `${stats.rate}%` : "-"} accent={stats.rate !== null && stats.rate >= 50} />
    <StatCard label="등록 덱" value={`${stats.deckCount}개`} />
    <StatCard label="마지막 플레이" value={stats.lastPlayedAt ? formatRelativeDate(stats.lastPlayedAt) : "-"} />
  </div>
</section>
```

`StatCard` 인라인 컴포넌트 (page.tsx 내부에 정의):

```tsx
function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-success" : "text-ink"}`}>{value}</p>
    </div>
  );
}
```

---

## 3. 관리 링크 섹션 신규 추가

stat 그리드 아래에 추가. iOS Settings 스타일 chevron 리스트.

```tsx
<section className="mt-4">
  <h2 className="mb-3 px-1 text-sm font-semibold text-muted">관리</h2>
  <article className="rounded-3xl border border-line bg-surface shadow-sm divide-y divide-line overflow-hidden">
    <SettingsLink href="/settings/decks" label="덱 관리" count={stats.deckCount} />
    <SettingsLink href="/settings/games" label="게임 관리" />
    <SettingsLink href="/settings/tags" label="태그 관리" count={stats.tagCount} />
  </article>
</section>
```

`SettingsLink` 인라인 컴포넌트:

```tsx
function SettingsLink({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2 text-muted">
        {count !== undefined && <span className="text-xs">{count}개</span>}
        {/* chevron-right SVG */}
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}
```

---

## 4. 계정 정보 섹션

기존 `dl` 구조를 Hero 카드에서 분리, 별도 섹션으로:

```tsx
<section className="mt-4">
  <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
    <dl className="space-y-0 divide-y divide-line">
      <div className="flex items-center justify-between py-2.5 text-sm">
        <dt className="text-muted">가입일</dt>
        <dd className="font-medium">{formatDate(profile?.createdAt ?? null)}</dd>
      </div>
    </dl>
  </article>
</section>
```

---

## 5. Danger Zone 분리

기존 Hero 카드 내부에서 완전 분리 → 별도 `<section>` + `border-danger/20` 카드:

```tsx
<section className="mt-4">
  <article className="rounded-3xl border border-danger/20 bg-surface p-5 shadow-sm">
    <form action={deleteAccount}>
      <p className="mb-4 text-sm text-muted">
        회원 탈퇴 시 계정, 카드게임, 덱, 경기 기록이 모두 삭제되며 복구할 수 없습니다.
      </p>
      <DeleteAccountButton />
    </form>
  </article>
</section>
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `app/settings/profile/page.tsx` | 전체 레이아웃 재구성, getProfileStats 추가, StatCard·SettingsLink 인라인 컴포넌트, Danger Zone 분리 |

기타 파일 변경 없음 (신규 컴포넌트 파일 불필요).

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 회원탈퇴 기능 동작 변경 없음
- DB 마이그레이션 없음

---

## 범위 외 (Out of Scope)

- 선공/후공 승률 분리 표시
- 연속 승리 스트릭
- 월별 활동 히트맵
- 게임별 탭 분리
