# Webapp 개발 로그

## 2026-03-15: GA4 Analytics 통합

### 신규 파일
| 파일 | 타입 | 역할 |
|------|------|------|
| `components/analytics.tsx` | client | GA4 스크립트 로드 + page_view 추적 + 플래시→이벤트 변환 |
| `types/gtag.d.ts` | type | window.gtag / window.dataLayer 타입 선언 |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `app/layout.tsx` | `<Suspense><Analytics /></Suspense>` 삽입 |
| `components/period-filter.tsx` | `window.gtag?.("event", "dashboard_filter")` 추가 |
| `components/auto-submit-select.tsx` | `window.gtag?.("event", "match_filter")` 추가 |
| `components/delete-match-button.tsx` | `window.gtag?.("event", "match_delete_confirm")` 추가 |
| `.env.example` | `NEXT_PUBLIC_GA_ID=""` 추가 |

### 이벤트 택소노미
| 이벤트명 | 트리거 | 방식 | 파라미터 |
|----------|--------|------|----------|
| `page_view` | 모든 페이지 전환 | Analytics usePathname | `page_path` |
| `match_create` | 경기 생성 | 플래시 `record_created` | — |
| `match_update` | 경기 수정 | 플래시 `record_updated` | — |
| `match_delete` | 경기 삭제 | 플래시 `record_deleted` | — |
| `match_delete_confirm` | 삭제 확인 클릭 | DeleteMatchButton onClick | — |
| `deck_create` | 덱 추가 | 플래시 (한국어) | — |
| `deck_toggle` | 덱 활성/비활성 | 플래시 (한국어) | — |
| `game_create` | 카드게임 추가 | 플래시 (한국어) | — |
| `game_update` | 카드게임 수정 | 플래시 (한국어) | — |
| `game_delete` | 카드게임 삭제 | 플래시 (한국어) | — |
| `dashboard_filter` | 기간 필터 변경 | PeriodFilter | `period` |
| `match_filter` | 기록 필터 변경 | AutoSubmitSelect | `filter_type` |

### 아키텍처 결정
- **플래시 메시지 패턴**: Server Action → `redirect(?message=key)` → 클라이언트 `Analytics`에서 `FLASH_EVENT_MAP`으로 이벤트명 매핑 → `replaceState`로 URL 정리
- **`send_page_view: false`**: gtag config에서 비활성화, useEffect로 수동 발화 (중복 방지)
- **`Suspense` 필수**: `useSearchParams()` 사용으로 Next.js 15 요구사항
- **`window.gtag?.()` 가드**: `NEXT_PUBLIC_GA_ID` 미설정 시 전체 비활성 (개발환경 안전)
- **활성화**: `.env.local`에 `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` 설정

### 플래시 키 매핑 (Analytics 내부)
```
matches: record_created → match_create, record_updated → match_update, record_deleted → match_delete
decks: "덱을 추가했습니다." → deck_create, "덱을 다시 활성화했습니다."/"덱을 비활성화했습니다." → deck_toggle
games: "카드게임 카테고리를 추가했습니다." → game_create, "카드게임 이름을 수정했습니다." → game_update, "카드게임 카테고리를 삭제했습니다." → game_delete
```

---

## 2026-03-15: UI/UX 개선 Phase 1

### 신규 컴포넌트 (7개)
| 파일 | 타입 | 역할 |
|------|------|------|
| `components/bottom-nav.tsx` | client | 하단 네비, usePathname 활성 표시 |
| `components/match-result-input.tsx` | client | 경기 형식 + 승패 결과 토글 |
| `components/submit-button.tsx` | client | useFormStatus 로딩 + 더블탭 방지 |
| `components/auto-submit-select.tsx` | client | select onChange 자동 form submit |
| `components/period-filter.tsx` | client | 대시보드 기간 프리셋 + 커스텀 날짜 |
| `components/color-picker.tsx` | client | 10색 프리셋 스와치 (덱 색상) |
| `lib/format-date.ts` | shared | 상대 날짜 (오늘/어제/N일 전) |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `app/layout.tsx` | next/font/google Noto_Sans_KR 로드 |
| `app/globals.css` | font-family 제거 |
| `app/page.tsx` | 랜딩 → redirect("/matches/new") |
| `components/app-shell.tsx` | 인라인 nav → BottomNav, 설정 링크 제거 |
| `app/matches/page.tsx` | AutoSubmitSelect 필터 + formatRelativeDate |
| `app/matches/new/page.tsx` | MatchResultInput + SubmitButton + GameDeckFields |
| `app/matches/[id]/edit/page.tsx` | MatchResultInput + SubmitButton + GameDeckFields |
| `app/settings/decks/page.tsx` | ColorPicker 교체 |
| `app/settings/games/page.tsx` | SubmitButton 교체 |
| `lib/dashboard.ts` | 전면 재작성 → filterByPeriod + buildDonutData |
| `components/dashboard-charts.tsx` | Bar/Line → 도넛 차트 2개 |
| `app/dashboard/page.tsx` | PeriodFilter + 도넛 차트만 |

### 하단 네비 활성 로직 (bottom-nav.tsx)
```
/matches/new  → 정확 매칭만
/matches      → 정확 매칭 OR startsWith("/matches/") 단, /matches/new 제외
/dashboard, /settings → 정확 매칭 OR 접두사 매칭
```

### 대시보드 기간 필터 URL 패턴
| 동작 | URL |
|------|-----|
| 7일 프리셋 | `/dashboard?period=7d` |
| 30일 프리셋 | `/dashboard?period=30d` |
| 전체 프리셋 | `/dashboard?period=all` |
| 커스텀 범위 | `/dashboard?period=custom&from=2026-01-01&to=2026-02-28` |
| 기본 (파라미터 없음) | period=all 취급 |

### 색상 프리셋 (color-picker.tsx)
초록 #0e6d53, 파랑 #3b6fa0, 빨강 #a33a2b, 보라 #6b5b95, 주황 #c07830,
분홍 #b5585a, 청록 #2e8b7a, 갈색 #7a6352, 남색 #2c3e6b, 회색 #737373

### 외부 변경 사항 (Codex CLI 반영)
- `components/game-deck-fields.tsx` — 게임 선택 → 덱 필터링 연동 select
- `MatchResultInput` — wins/losses 분리 입력 제거 → result(win/lose) 단일 hidden input
- `didChoosePlayOrder` 필드 — 선후공 결정여부 O/X select 추가
- Prisma schema 변경 반영됨

### 미사용 컴포넌트 (삭제 가능)
- `components/stat-card.tsx` — 대시보드에서 제거됨, 향후 복원 시 재사용 가능
