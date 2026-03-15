# Webapp 개발 로그

## 2026-03-15: UI/UX 개선 Phase 2 및 마이그레이션 적용

### 프로덕션 마이그레이션
| 마이그레이션 | 내용 | 상태 |
|-------------|------|------|
| `20260315180000_add_tournament_phase` | `TournamentPhase` 열거형 추가, `match_results.tournamentPhase` 컬럼 추가, 기존 shop/cs 데이터 `swiss` 백필, CHECK 제약 적용 | 적용 완료 |

- 오류 원인: `prisma.matchResult.findMany()` 호출 시 `match_results.tournamentPhase` 컬럼 미존재 (P2022)
- 조치: `npx prisma migrate deploy` 로 프로덕션 DB에 직접 적용

### tournament phase 기능
| 항목 | 내용 |
|------|------|
| 신규 필드 | `tournamentPhase: TournamentPhase?` — `swiss` / `elimination` |
| 적용 범위 | `eventCategory = shop / cs` 인 경기에만 필수, `friendly` 는 NULL |
| 백필 | 기존 shop/cs 경기 → `swiss` 자동 설정 |
| DB 제약 | `chk_tournament_phase_category` CHECK 제약으로 카테고리-단계 정합성 강제 |

### UI/UX 개선
| 항목 | 변경 내용 |
|------|----------|
| 다크모드 | 하드코딩된 `dark:` 클래스 제거 → Tailwind 시스템 테마 상속으로 통일 |
| 토스트 위치 | 하단 중앙 → 상단 중앙으로 이동 (하단 네비와 겹침 방지) |
| 토스트 버그 | 토스트 메시지가 페이지 전환 없이 중복 노출되던 문제 수정 |
| 승패 배지 | `text-xs` → `text-sm`, padding 확대로 가독성 개선 |
| EventCategorySelect | `/matches/new`, `/matches/[id]/edit` 에서 동일 컴포넌트 재사용으로 통일 |
| 삭제/수정 버튼 순서 | 삭제 버튼을 수정 버튼 우측으로 이동 (파괴적 액션 노출 최소화) |

### README 전면 개편
- 프로젝트 소개, 기술 스택, 로컬 셋업 절차, 환경변수 목록, 배포 가이드로 구조 재편
- 기존 내부 개발 메모 형식에서 외부 공개 가능한 문서 수준으로 격상

---

## 2026-03-15: 배포 안정화 및 백엔드 최적화

### 배포/운영 이슈 대응
| 이슈 | 원인 | 조치 |
|------|------|------|
| Google 로그인 시 `localhost` 리다이렉트 | Supabase / OAuth URL 설정이 로컬 기준 | 배포 URL 기준으로 Site URL / Redirect URL 재설정 |
| Vercel에서 Session mode 연결 수 초과 | `DATABASE_URL`이 session pooler 기준 | Vercel runtime을 transaction pooler(`:6543`, `pgbouncer=true`, `connection_limit=1`) 기준으로 안내 |
| `match_results.eventCategory` 누락 | 코드 배포 후 DB migration 미적용 | `20260315163000_add_event_category` migration production 반영 |
| Dashboard raw query `uuid = text` 오류 | `$queryRaw` 파라미터 타입 불일치 | `CAST(${userId} AS uuid)` 적용 |
| Vercel build 시 `tournamentPhase` 타입 누락 | install 단계 Prisma client stale 가능성 | `package.json`에 `postinstall: prisma generate` 추가 |

### 백엔드 최적화
| 파일 | 변경 내용 |
|------|----------|
| `lib/auth.ts` | 매 요청 `upsert` 제거, `createMany(skipDuplicates)`로 최소화 |
| `lib/matches.ts` | `/matches` 페이지네이션 (`MATCHES_PAGE_SIZE=30`), count 분리, filter option helper 추가 |
| `app/matches/page.tsx` | 목록 조회 30건 단위, 이전/다음 페이지 링크 추가 |
| `lib/dashboard.ts` | 메모리 집계 제거, DB raw query 기반 count / group-by 집계로 전환 |
| `app/dashboard/page.tsx` | 전체 경기 행 조회 제거, 집계 결과만 렌더링 |
| `app/settings/export/page.tsx` | 공통 filter option helper 사용 |

### 기능 변경
| 파일 | 변경 내용 |
|------|----------|
| `app/settings/export/page.tsx` | CSV 내보내기를 설정 메뉴로 이동 |
| `app/settings/profile/page.tsx` | 회원 탈퇴 버튼 및 경고 문구 추가 |
| `app/settings/profile/actions.ts` | `public.users` + `auth.users` 삭제 처리 |
| `lib/supabase/admin.ts` | service-role 기반 admin client 추가 |
| `app/matches/page.tsx` | 상대 덱 검색 필드 제거 |

### 대회/입력 플로우
| 항목 | 반영 내용 |
|------|----------|
| 대회 분류 | `friendly`, `shop`, `cs` |
| 토너먼트 단계 | `TournamentPhase = swiss | elimination` |
| 연속 입력 | 매장대회/CS 저장 후 다음 라운드 입력 링크 유지 |
| 표시 방식 | 기록 목록에서 tournament timeline UI를 사용하는 방향에 맞춰 백엔드 필드 제공 |

### 오늘 생성/반영된 주요 migration
- `20260315163000_add_event_category`
- `20260315180000_add_tournament_phase`

### 오늘 배포 관련 커밋
- `6d3321e` `feat(webapp): refine profile access and account deletion`
- `c124d61` `perf(webapp): reduce match and dashboard query load`
- `2e98cc5` `fix(webapp): cast dashboard user id in raw query`
- `93b9d3c` `build(webapp): generate prisma client on install`
- `1dc412d` `chore(webapp): remove opponent search from matches page`

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
