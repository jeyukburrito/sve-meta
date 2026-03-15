# Webapp 개발 로그

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
