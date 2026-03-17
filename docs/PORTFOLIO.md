# 섀도우버스 이볼브 메타 분석 프로젝트 — 작업 포트폴리오

> 최종 갱신: 2026-03-16
> Claude Code (claude-opus-4-6 / claude-sonnet-4-6) + Playwright MCP + Codex MCP + Gemini MCP 협업

---

## 프로젝트 개요

섀도우버스 이볼브(Shadowverse EVOLVE) 공식 대회 결과를 자동 수집·분석하여 주간 메타 리포트를 생성하는 **AI 파이프라인**과, 개인 대전 기록을 추적·시각화하는 **웹 앱(TCG Match Tracker)**으로 구성된 프로젝트.

| 영역 | 설명 |
|------|------|
| 메타 분석 파이프라인 | bushi-navi.com 대회 수집 → 카드 정규화 → 클러스터링 → RAG → Gemini 리포트 |
| TCG Match Tracker | Next.js 15 + Supabase + Prisma 기반 대전 기록 관리 웹 앱 |
| 카드 DB | shadowverse-evolve.com 전 세트 카드 정보 DB화 (6,549장) |
| 게임 룰 체계 | 종합 룰 v1.24.1 한/일 번역 + 143개 청크 JSONL 색인 |

---

## Part 1. 메타 분석 파이프라인

### 1-1. 대회 데이터 수집 (Playwright MCP)

bushi-navi.com의 Next.js SPA에서 `waitForResponse`로 내부 API를 인터셉트하여 대회 결과를 자동 수집.

| 항목 | 내용 |
|------|------|
| 대회 목록 API | `api-user.bushi-navi.com/api/user/event/result/list` (offset 기반 페이징) |
| 대회 상세 API | `api-user.bushi-navi.com/api/user/event/result/detail/{code}` |
| 덱 카드 추출 | `decklog.bushiroad.com/view/{deck_code}` → `.card-item img[title]` 파싱 |
| 수집 규모 | **개인전 475건**, **트리오 71건** (누적, Top 8 기준) |
| 필터링 | 참가자 9인 미만 대회 자동 제외 |
| 딜레이 | decklog 페이지당 1.5초, API 요청 간 1~2초 |

**출력**: `data/개인전_v2.txt`, `data/트리오.txt` (7컬럼 TSV, canonical 카드 코드 형식)

### 1-2. 카드 DB 수집 (shadowverse-evolve.com)

공식 카드 리스트 페이지에서 전 세트 카드 정보를 DOM 파싱으로 수집.

| 항목 | 내용 |
|------|------|
| 수집 대상 | BP01~BP18, CP01~CP04, EBD/ETD/SP/SD/CSD/DSD/ECP/PCS/PR — **49개 세트** |
| 총 카드 수 | **6,549장** (P/SL/U/SP 변형 + 토큰 포함, LD 리더 카드만 제외) |
| 수집 기법 | 클래스 필터 클릭 → 1500ms 대기 → `scrollIntoView` lazy load 트리거 |
| LD 제외 | `code.includes('-LD')` 문자열 검사 (특수문자 변형 대응) |
| 라우트 차단 | `page.route('**/cardlist/?cardno=**', route => route.abort())` |

**출력**: `data/carddb_json/{세트코드}.json`, `data/carddb/{세트코드}.csv` (UTF-8-sig)

### 1-3. 카드 코드 정규화 (`scripts/normalize_cards.py`)

decklog에서 수집한 카드 코드(PR, SL, P 등 변형)를 canonical 코드로 통일하는 정규화 모듈.

**동일 카드 판별 기준**: `class + cost + effect` 동일 → 같은 카드 → card_code 오름차순 첫 번째가 canonical

| 우선순위 | 패턴 | 예시 |
|:---:|---|---|
| 1 | BP 베이스 | `BP01-001` |
| 2 | EBD/ETD 베이스 | `EBD01-010` |
| 3 | CP/ECP 베이스 | `CP04-001` |
| 4 | SP → SD → BP 변형 → CP 변형 | `SP01-001`, `BP01-SL01` |
| 5 | PR (프로모) | `PR-339` |

**주요 함수**:
- `build_canonical_map(carddb_dir)` → `{code: canonical_code}` 전체 맵
- `normalize_deck(card_codes, canonical_map)` → 덱 카드를 canonical 코드로 변환 + 합산
- `build_name_to_canonical_map()` → 구버전(카드명 기준) → v2 마이그레이션용

**검증 케이스**: `PR-339 → BP07-116`, `PR-447 → BP17-113`, `PR-435 → CP02-006`

### 1-4. 통계 분석 (Codex MCP)

| 스크립트 | 역할 |
|----------|------|
| `scripts/analyzer.py` | 클래스별 우승·Top8 집계, 카드 채용률 |
| `scripts/cluster.py` | 덱 아키타입 군집 분석 (k-means / 계층 클러스터링) |
| `scripts/card_stats.py` | 클래스×아키타입별 카드 채용률 CSV 생성 |
| `scripts/weekly_stats.py` | 주간 통계 자동 집계 |
| `scripts/visualize_weekly.py` | 주간 차트 자동 생성 |
| `scripts/process_new_data.py` | 신규 데이터 일괄 처리 파이프라인 |

**시각화 차트** (`reports/charts/`, 11종):

| 차트 | 내용 |
|------|------|
| `class_share_*.png` | 클래스별 Top8 점유율 |
| `class_wins_*.png` | 클래스별 우승 횟수 |
| `class_trend_*.png` | 주간 클래스별 점유율 추이 |
| `class_top8_bar.png` | Top8 진출 횟수 비교 |
| `class_winrate_pie.png` | 클래스별 우승 비중 파이 차트 |
| `class_by_tournament_size.png` | 대회 규모별 클래스 분포 |
| `class_avg_rank_*.png` | 클래스별 평균 순위 |
| `card_usage_top20_bar.png` | 전체 Top20 채용 카드 |
| `archetype_heatmap.png` | 아키타입별 주요 카드 채용률 히트맵 |

### 1-5. RAG 모듈 (`rag/`)

대회 통계와 카드 DB를 결합하여 Gemini에 전달할 enriched 프롬프트를 생성하는 파이프라인.

| 파일 | 역할 |
|------|------|
| `rag/retriever.py` | CardRetriever — carddb_json에서 카드명·코드 인덱스 구축 (2,698장) |
| `rag/prompt_builder.py` | enriched_data.json → Gemini 전달용 프롬프트 문자열 생성 |
| `rag/pipeline.py` | TSV + clusters → enriched_data.json → gemini_prompt.txt |

**출력** (`output/YYYYMMDD/`):
- `analysis_data.json` — 클래스/아키타입 통계
- `enriched_data.json` — 카드 DB 효과 텍스트 포함 enriched 데이터
- `gemini_prompt.txt` — Gemini 전달용 최종 프롬프트

### 1-6. 아키타입 YAML 스켈레톤 (`data/archetypes/`)

덱 클러스터링 결과를 기반으로 아키타입 정의 파일 43개 생성.

- 클래스별 아키타입 YAML 스켈레톤 (`_TEMPLATE.yaml` 포함)
- 클러스터 대표 카드 5개 힌트 주석 포함
- 한국어 아키타입 이름 28개 사전 적용

### 1-7. 룰 청크 색인 (`data/rules_chunks.jsonl`)

`docs/rules/*.md` (17개 룰 문서)를 JSONL 형식으로 청크화.

- 143개 청크, X.Y 서브섹션 단위 분할
- 필드: `id`, `source`, `file_section`, `subsection_id`, `subsection_title`, `text`, `keywords`
- 스크립트: `scripts/build_rules_chunks.py`

### 1-8. 메타 리포트 (Gemini MCP)

RAG enriched 데이터를 기반으로 Gemini가 한국어 메타 리포트를 생성.

| 리포트 | 기간 |
|--------|------|
| `reports/meta_report_20260223.md` | 2026-02-16 ~ 02-22 |
| `reports/meta_report_20260226.md` | 2026-02-23 ~ 02-26 |
| `reports/meta_report_20260301.md` | 2026-02-23 ~ 03-01 |
| `reports/meta_report_20260308.md` | 2026-03-02 ~ 03-08 |

**리포트 구성**: 메타 개요 → 클래스별 성적표 → 아키타입 전체 리뷰 (티어 분류) → 채용률 상위 카드 분석 → 주간 메타 정리 + 전망

---

## Part 2. TCG Match Tracker 웹 앱

### 2-1. 기술 스택

| 역할 | 도구 |
|------|------|
| 프레임워크 | Next.js 15 (App Router, Server Components, Server Actions) |
| 인증 | Supabase Auth (OAuth — Google 등) |
| ORM | Prisma 6 (PostgreSQL) |
| DB | Supabase PostgreSQL + Row Level Security |
| 스타일링 | Tailwind CSS 3 (CSS 변수 기반 다크 모드) |
| 차트 | Recharts 2 (도넛 차트) |
| 검증 | Zod 3 (서버 액션 입력 검증) |
| 배포 | Vercel (자동 배포, Git push 트리거) |
| 타입 | TypeScript 5 (strict mode) |

### 2-2. 데이터 모델 (Prisma Schema)

```
User ─┬─ Game ── Deck ─┬─ MatchResult
      │                 └─ TournamentSession ── MatchResult
      └─ Tag ── MatchResultTag ── MatchResult
```

| 모델 | 역할 |
|------|------|
| `User` | Supabase Auth UUID 연동. 이메일, 이름 |
| `Game` | 사용자 정의 카드게임 카테고리 (예: Shadowverse EVOLVE, 포켓몬) |
| `Deck` | 게임별 덱 관리. 색상, 메모, 활성/비활성 |
| `MatchResult` | 대전 기록. 날짜, 상대 덱, 승패, 선후공, 메모, BO1/BO3 |
| `TournamentSession` | 대회 세션 단위 관리. 시작/종료 상태, 덱·이벤트 고정 |
| `Tag` / `MatchResultTag` | 사용자 태그 (다대다) |

**Enum**: `PlayOrder`(first/second), `MatchFormat`(bo1/bo3), `EventCategory`(friendly/shop/cs), `TournamentPhase`(swiss/elimination)

**마이그레이션 이력** (7개):
1. `init` — 기본 스키마
2. `add_games_categories` — 다중 게임 지원
3. `simplify_match_input` (2건) — 입력 간소화
4. `add_event_category` — 친선전/매장대회/CS 분류
5. `add_tournament_phase` — 예선(Swiss)/본선(Elimination) 구분
6. `add_tournament_sessions` — 대회 세션 모델

### 2-3. 페이지 구성 (11개 라우트)

| 라우트 | 기능 |
|--------|------|
| `/` | 랜딩 (로그인 리다이렉트) |
| `/login` | Supabase OAuth 로그인 |
| `/dashboard` | 통계 대시보드 — 내 덱별/상대 덱별 도넛 차트, 기간 필터 |
| `/matches` | 기록 목록 — 필터(게임/덱/형식/분류), 페이지네이션, 대회 타임라인 |
| `/matches/new` | 결과 입력 — 대회 연속 입력 모드 (라운드 자동 증가) |
| `/matches/[id]/edit` | 기록 수정 |
| `/settings` | 설정 허브 — 게임, 덱, 내보내기, 로그아웃 링크 |
| `/settings/games` | 카드게임 CRUD |
| `/settings/decks` | 덱 CRUD (활성/비활성 토글, 색상 지정) |
| `/settings/export` | CSV 내보내기 (필터 적용) |
| `/settings/profile` | 프로필 편집, 계정 삭제 |

### 2-4. 주요 기능

#### 대전 기록 CRUD
- Server Action 기반 폼 제출 (`createMatchResult`, `updateMatchResult`, `deleteMatchResult`)
- Zod 스키마 검증 (`matchResultSchema`)
- BO1 → 승/패 토글 버튼, BO3 → 승/패 수 입력
- 선후공 / 선후공 결정여부 / 메모 필드

#### 대회 연속 입력 모드 (Tournament Flow)
- 매장대회/CS 선택 시 자동 활성화
- 라운드 저장 → URL params로 다음 라운드 자동 이동 (`round`, `phase`, `event`, `date`, `deckId`)
- TournamentBanner: 현재 라운드 표시 + "본선 진행" + "대회 종료" 버튼
- 예선(Swiss) → 본선(Elimination) 전환 시 라운드 1로 리셋
- TournamentSession 모델로 대회 단위 그룹핑 + 종료 상태 관리

#### 대회 타임라인 UI
- 같은 날짜+이벤트+덱 기록을 자동 그룹핑 (`groupMatchesForDisplay`)
- 세로 타임라인 + 라운드 카드 (승/패 도트, 상대 덱, 포맷, 메모)
- 예선/본선 구분 라벨 (R1, R2... / T1, T2...)
- 오늘 대회에만 "라운드 추가" 링크 표시

#### 대시보드
- Raw SQL 집계 (Prisma `$queryRaw`) — 내 덱별·상대 덱별 승률
- Recharts 도넛 차트 (승률 표시)
- 기간 필터: 전체 / 7일 / 30일 / 커스텀 (from~to)

#### 필터·정렬
- 기록 목록: 게임, 덱, 형식(BO1/BO3), 분류(친선/매장/CS) 필터
- `AutoSubmitSelect` — select 변경 시 자동 폼 제출
- 페이지네이션 (20건/페이지)

#### CSV 내보내기
- 게임·덱·날짜 범위 필터 적용
- `text/csv` Response 스트리밍

### 2-5. UI/UX

#### 테마 시스템
- CSS 변수 기반 라이트/다크 모드 (`--color-ink`, `--color-paper`, `--color-surface`, `--color-accent` 등)
- `ThemeProvider` + `ThemeToggle` 클라이언트 컴포넌트
- Tailwind 커스텀 컬러: `ink`, `paper`, `surface`, `accent`, `danger`, `success`, `line`, `muted`

#### 컴포넌트 (20개)
| 컴포넌트 | 타입 | 역할 |
|----------|------|------|
| `AppShell` | Server | 페이지 레이아웃 (헤더 + 본문 + 하단 네비) |
| `BottomNav` | Client | 하단 탭 네비게이션 (활성 표시) |
| `HeaderActions` | Server | 헤더 우측 아바타 + 테마 토글 |
| `ProfileAvatar` | Server | 사용자 아바타 표시 |
| `Toast` | Client | URL 기반 토스트 알림 (fadeInDown/fadeOutUp 애니메이션) |
| `SubmitButton` | Client | `useFormStatus()` 기반 로딩 상태 + 더블 탭 방지 |
| `AutoSubmitSelect` | Client | select 변경 시 자동 폼 제출 |
| `MatchResultInput` | Client | BO1 토글 / BO3 수 입력 동적 전환 |
| `GameDeckFields` | Client | 게임 선택 → 해당 게임 덱만 필터링 |
| `EventCategorySelect` | Client | 이벤트 분류 선택 (친선/매장/CS) |
| `TournamentBanner` | Server | 대회 모드 배너 (라운드 표시, 본선 전환, 종료) |
| `TournamentTimeline` | Client | 대회 라운드 타임라인 (수정/삭제 포함) |
| `DashboardCharts` | Client | Recharts 도넛 차트 (내 덱/상대 덱 승률) |
| `PeriodFilter` | Client | 대시보드 기간 필터 |
| `DeleteMatchButton` | Client | 삭제 확인 다이얼로그 |
| `DeleteAccountButton` | Client | 계정 삭제 확인 (이중 확인) |
| `ColorPicker` | Client | 덱 색상 선택 |
| `ThemeProvider` | Client | 다크 모드 context |
| `ThemeToggle` | Client | 라이트/다크 전환 버튼 |
| `Analytics` | Client | Google Analytics gtag |

#### 인증 (`lib/auth.ts`)
- Supabase Auth → Prisma User `upsert` (프로필 자동 동기화)
- `requireUser()` — `react.cache()` 래핑으로 동일 렌더 트리 내 중복 호출 제거
- Middleware에서 세션 갱신

### 2-6. 해결한 기술적 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| P2022 tournamentPhase 컬럼 누락 | 프로덕션 DB 마이그레이션 미적용 | `prisma migrate deploy` |
| P2024 Connection Pool Timeout | Prisma 싱글턴 미적용 + `createMany` 과다 호출 + `requireUser()` 중복 | 싱글턴 패턴 + `upsert` + `react.cache()` |
| 토스트 우측 슬라이딩 | CSS `translateY`가 Tailwind `-translate-x-1/2` 덮어쓰기 | keyframes에 `translateX(-50%)` 포함 |
| 대회 본선 전환 시 라운드 미리셋 | Next.js 클라이언트 캐시가 같은 경로 searchParams 변경 무시 | `window.location.href`로 전체 페이지 네비게이션 |
| 대회 라운드 순서 뒤섞임 | 같은 날 매치는 동일 `playedAt`, UUID는 랜덤 | `createdAt` 기반 정렬로 변경 |
| 라운드 카운트 오류 | `new Date("YYYY-MM-DD")` UTC/로컬 불일치 | 날짜 범위 쿼리 (`gte`/`lt`) |
| 다크 모드 색상 깨짐 | `bg-neutral-400`, `border-black/10` 등 하드코딩 | 시맨틱 토큰 (`disabled:opacity-50`, `border-line`) |
| 필터 select 정렬 비뚤어짐 | `<select>` intrinsic sizing이 그리드 셀 미충전 | `w-full` 추가 |

---

## 데이터 현황 요약

| 항목 | 수치 |
|------|------|
| 개인전 수집 건수 | 475건 (Top 8 기준) |
| 트리오 수집 건수 | 71건 |
| 카드 DB 세트 수 | 49개 세트 |
| 카드 DB 총 카드 수 | 6,549장 |
| 아키타입 YAML 정의 | 43개 파일 |
| 룰 청크 색인 | 143개 |
| 주간 메타 리포트 | 4건 |
| 시각화 차트 | 11종 |
| 웹 앱 페이지 | 11개 라우트 |
| 웹 앱 컴포넌트 | 20개 |
| DB 마이그레이션 | 7건 |

---

## 향후 개선 예정

### 메타 분석
- [ ] RAG enrichment: 채용률 상위 카드 전체에 효과 텍스트 삽입 (truncate 제거)
- [ ] clusters 없을 때 채용률 기반 fallback 아키타입 분류
- [ ] 트리오전 전용 메타 리포트 생성
- [ ] 대회 규모별 메타 차이 분석 심화
- [ ] 주간 메타 변화 추이 자동화

### 웹 앱
- [ ] 매치업 분석 (상대 덱별 승률 상세)
- [ ] 선후공 승률 통계
- [ ] 연승/연패 스트릭 표시
- [ ] 대회 결과 요약 (전적, 최종 순위 기록)
- [ ] PWA 지원 (오프라인, 홈 화면 추가)
