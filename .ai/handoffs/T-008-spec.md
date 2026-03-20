# T-008 Spec — PWA 적용

## 목적

현재 웹앱을 Progressive Web App으로 전환하여 모바일에서 홈 화면 설치 + 앱 같은 경험을 제공한다.
외부 라이브러리 없이 Next.js 내장 기능만 사용한다.

---

## 1. `public/manifest.json` 생성

```json
{
  "name": "TCG Match Tracker",
  "short_name": "TCG Tracker",
  "description": "개인용 TCG 대전 기록 및 통계",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#4f46e5",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## 2. 앱 아이콘 생성

`public/icons/` 디렉토리에 placeholder 아이콘 2개 생성:

- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Canvas API나 sharp 등 불필요 — **SVG 기반 단순 아이콘을 생성**한다.
배경색 `#4f46e5` (accent) 위에 흰색 텍스트 "TCG"를 배치하는 형태.

방법: `public/icons/` 에 SVG 파일(`icon.svg`)을 넣고, `manifest.json`에서 SVG도 참조한다.
PNG가 반드시 필요하므로, 간단한 Node.js 스크립트(`scripts/generate-icons.mjs`)로 SVG → PNG 변환하거나, 수동으로 생성한다.

**간소화 대안**: PNG 생성이 어려우면 favicon.ico + SVG 아이콘만 등록하고 PNG는 나중에 교체 가능하도록 TODO 주석을 남긴다.

실제 구현에서는 다음 중 택 1:
- (A) 1x1 컬러 PNG placeholder 생성 (단순 컬러 사각형) — 나중에 디자인 아이콘으로 교체
- (B) SVG 아이콘만 사용 (`"type": "image/svg+xml"`)

**(A)를 권장** — 호환성이 더 높음.

---

## 3. `app/layout.tsx` 메타데이터 확장

기존 `metadata` export에 PWA 관련 필드 추가:

```tsx
export const metadata: Metadata = {
  title: "TCG Match Tracker",
  description: "개인용 TCG 대전 기록 및 통계 웹앱",
  manifest: "/manifest.json",
  themeColor: "#4f46e5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TCG Tracker",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};
```

> Next.js 15에서 `viewport`는 별도 export로 분리되어 있을 수 있음. 빌드 시 경고가 나면 아래처럼 분리:
> ```tsx
> export const viewport: Viewport = {
>   width: "device-width",
>   initialScale: 1,
>   maximumScale: 1,
>   userScalable: false,
>   themeColor: "#4f46e5",
> };
> ```
> 이 경우 `metadata`에서 `themeColor`와 `viewport` 제거.

---

## 4. Service Worker 등록

외부 라이브러리(next-pwa, serwist) 없이 최소한의 Service Worker를 수동 등록한다.

### 4-1. `public/sw.js` 생성

```js
const CACHE_NAME = "tcg-tracker-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
```

기능: 네비게이션 요청 실패 시 오프라인 페이지 표시. 정적 자산 캐싱은 하지 않음 (Vercel CDN이 처리).

### 4-2. SW 등록 컴포넌트

`components/service-worker.tsx` 생성:

```tsx
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
```

### 4-3. `app/layout.tsx`에 추가

`<Analytics />` 옆에 `<ServiceWorkerRegistration />` 추가:

```tsx
<Suspense fallback={null}>
  <Analytics />
  <Toast />
  <ServiceWorkerRegistration />
</Suspense>
```

---

## 5. 오프라인 페이지

`app/offline/page.tsx` 생성:

```tsx
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-xl font-bold">오프라인</h1>
        <p className="mt-2 text-[var(--color-muted)]">
          인터넷 연결을 확인한 후 다시 시도해주세요.
        </p>
      </div>
    </div>
  );
}
```

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `public/manifest.json` | 신규 — PWA manifest |
| `public/icons/icon-192.png` | 신규 — placeholder 아이콘 |
| `public/icons/icon-512.png` | 신규 — placeholder 아이콘 |
| `public/sw.js` | 신규 — 최소 Service Worker |
| `components/service-worker.tsx` | 신규 — SW 등록 컴포넌트 |
| `app/layout.tsx` | 수정 — metadata 확장 + SW 컴포넌트 추가 |
| `app/offline/page.tsx` | 신규 — 오프라인 fallback 페이지 |

---

## 비기능 요건

- TypeScript 오류 0, ESLint 오류 0
- `npm run build` 통과
- 기존 모든 페이지 정상 동작
- DB 마이그레이션 없음
- 외부 라이브러리 추가 없음

---

## 범위 외 (Out of Scope)

- 정적 자산 프리캐싱 (Vercel CDN 활용)
- 푸시 알림 (FCM/APNs 연동)
- 백그라운드 동기화
- 아이콘 디자인 (placeholder만 생성, 추후 교체)
- apple-touch-icon 별도 생성
- Lighthouse PWA 점수 최적화 (별도 티켓)
