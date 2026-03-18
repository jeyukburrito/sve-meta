# T-007 Spec — 앱 성능 최적화

## 목적

전 페이지 `force-dynamic` + Recharts 전역 로딩으로 인한 성능 저하를 해소한다.
Vercel 무료 플랜에서도 체감 속도를 크게 개선할 수 있는 코드 레벨 최적화.

---

## 1. `force-dynamic` 제거 — 인증 페이지 캐싱 활성화 (Critical)

### 현재 문제

12개 파일 전부 `export const dynamic = "force-dynamic"` 설정.
Vercel 정적 캐싱이 완전 비활성화되어 매 요청마다 서버 풀 실행.

### 변경 내용

`force-dynamic`을 **제거**한다. `requireUser()`가 쿠키를 읽으므로 Next.js가 자동으로 dynamic 렌더링을 적용한다 (별도 선언 불필요).

**삭제 대상 (전부 `export const dynamic = "force-dynamic";` 줄 삭제):**

| 파일 | 비고 |
|------|------|
| `app/dashboard/page.tsx` | searchParams 사용 → 자동 dynamic |
| `app/matches/page.tsx` | searchParams 사용 → 자동 dynamic |
| `app/matches/new/page.tsx` | 쿠키 → 자동 dynamic |
| `app/matches/[id]/edit/page.tsx` | params + 쿠키 → 자동 dynamic |
| `app/matches/export/route.ts` | 쿠키 → 자동 dynamic |
| `app/matches/tournaments/end/route.ts` | 쿠키 → 자동 dynamic |
| `app/settings/page.tsx` | 쿠키 → 자동 dynamic |
| `app/settings/decks/page.tsx` | 쿠키 → 자동 dynamic |
| `app/settings/games/page.tsx` | 쿠키 → 자동 dynamic |
| `app/settings/tags/page.tsx` | 쿠키 → 자동 dynamic |
| `app/settings/profile/page.tsx` | 쿠키 → 자동 dynamic |
| `app/settings/export/page.tsx` | 쿠키 → 자동 dynamic |

> Next.js 15에서 `cookies()`, `headers()`, `searchParams`를 사용하면 자동으로 dynamic 렌더링된다. 명시적 선언은 불필요.

---

## 2. Recharts dynamic import (Medium)

### 현재 문제

`dashboard-charts.tsx`가 Recharts를 static import → 대시보드 안 쓰는 페이지에서도 ~150KB 번들에 포함.

### 변경 내용

`app/dashboard/page.tsx`에서 `DashboardCharts`를 `next/dynamic`으로 lazy import:

```tsx
import dynamic from "next/dynamic";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard-charts").then(mod => ({ default: mod.DashboardCharts })),
  { ssr: false }
);
```

기존 static import 제거:
```tsx
// 삭제
import { DashboardCharts } from "@/components/dashboard-charts";
```

`components/dashboard-charts.tsx`는 변경 없음.

---

## 3. `next/image` 적용 — 아바타 이미지 (Low)

### 현재 문제

프로필 페이지에서 raw `<img>` 사용 → Vercel 이미지 최적화 미적용, CLS 발생 가능.

### 변경 내용

`app/settings/profile/page.tsx`에서 아바타 `<img>`를 `next/image`로 교체:

```tsx
import Image from "next/image";

// 기존: <img src={display.avatarUrl} alt="" className="..." width={96} height={96} />
// 변경:
<Image
  src={display.avatarUrl || ""}
  alt=""
  className="..."
  width={96}
  height={96}
  unoptimized
/>
```

- `unoptimized` — 외부 URL(Google avatar)이므로 Vercel 이미지 최적화 프록시 미사용. `remotePatterns` 설정 불필요.
- `next/image`의 lazy loading + width/height 명시로 CLS 방지.

---

## 4. next.config.ts — images.remotePatterns (Skip)

`unoptimized` 사용하므로 `remotePatterns` 설정 불필요. 변경 없음.

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `app/dashboard/page.tsx` | `force-dynamic` 삭제, DashboardCharts dynamic import |
| `app/matches/page.tsx` | `force-dynamic` 삭제 |
| `app/matches/new/page.tsx` | `force-dynamic` 삭제 |
| `app/matches/[id]/edit/page.tsx` | `force-dynamic` 삭제 |
| `app/matches/export/route.ts` | `force-dynamic` 삭제 |
| `app/matches/tournaments/end/route.ts` | `force-dynamic` 삭제 |
| `app/settings/page.tsx` | `force-dynamic` 삭제 |
| `app/settings/decks/page.tsx` | `force-dynamic` 삭제 |
| `app/settings/games/page.tsx` | `force-dynamic` 삭제 |
| `app/settings/tags/page.tsx` | `force-dynamic` 삭제 |
| `app/settings/profile/page.tsx` | `force-dynamic` 삭제, `<img>` → `next/image` |
| `app/settings/export/page.tsx` | `force-dynamic` 삭제 |

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 모든 페이지 정상 렌더링 (인증 페이지는 로그인 후 접근 가능)
- DB 마이그레이션 없음

---

## 범위 외 (Out of Scope)

- 미들웨어 ↔ 페이지 간 인증 중복 호출 제거 (구조 변경 큼, 별도 티켓)
- `revalidatePath` → `revalidateTag` 전환 (별도 티켓)
- 불필요한 `"use client"` 제거 (개별 컴포넌트 리팩터링, 별도 티켓)
- `listMatchFilterOptions` 최적화 (별도 티켓)
