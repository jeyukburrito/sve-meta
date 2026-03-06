# 섀도우버스 이볼브 메타 분석 프로젝트 — 작업 포트폴리오

> 작성일: 2026-03-02
> Claude Code (claude-sonnet-4-6) + Playwright MCP + Codex MCP + Gemini MCP 협업

---

## 프로젝트 개요

섀도우버스 이볼브(Shadowverse EVOLVE) 공식 대회 결과를 자동 수집·분석하여
주간 메타 리포트를 생성하는 AI 파이프라인을 구축한 프로젝트.

- **데이터 소스**: bushi-navi.com (대회 결과), decklog.bushiroad.com (덱 구성), shadowverse-evolve.com (카드 DB)
- **분석 주기**: 주 1회 주간 리포트 생성
- **산출물**: 메타 리포트 3건, 시각화 차트 8종, 클러스터 분석, 카드 채용률 CSV

---

## 완료된 작업 목록

### 1. 데이터 수집 파이프라인 (Playwright MCP)

#### 1-1. 대회 결과 수집 (`개인전_v2.txt`, `트리오.txt`)
- bushi-navi.com의 Next.js SPA에서 `waitForResponse`로 API 인터셉트
- `/api/user/event/result/list` → 대회 목록 순회 (offset 기반 페이징)
- `/api/user/event/result/detail/{code}` → Top 8 순위·클래스·덱코드 추출
- 수집 규모: **개인전 370건**, **트리오 71건** (누적)
- 참가자 9인 미만 대회 자동 제외

#### 1-2. 덱 카드 구성 추출 (decklog.bushiroad.com)
- `.card-item img.card-view-item` 의 `title` 속성에서 카드 코드 파싱
- 메인 덱만 수집 (에볼브 덱 제외)
- 페이지당 1.5초 딜레이 준수
- 요청 실패 시 해당 레코드 `카드` 필드 `null` 처리

#### 1-3. 카드 DB 수집 (shadowverse-evolve.com)
- 전 세트(BP01~BP18, CP01~CP04, SP/SD/EBD/ETD/PR 등) 망라
- 클래스 필터 클릭 + 1500ms 대기 + `scrollIntoView` lazy load 트리거
- LD(리더) 카드만 제외, 토큰·P/SL/U/SP 변형 전부 수집
- **총 49개 세트, 6,549장** DB화
- 출력: `data/carddb_json/*.json`, `data/carddb/*.csv`

---

### 2. 카드 코드 정규화 (`scripts/normalize_cards.py`)

#### 구현 내용
- 동일 카드 판별 기준: `class + cost + effect` 동일 → 같은 카드
- canonical 우선순위 8단계 정의 (BP 베이스 → EBD/ETD → CP → SP → SD → BP 변형 → CP 변형 → PR)
- `build_canonical_map()` — 전체 카드 DB에서 `{code: canonical}` 매핑 생성
- `normalize_deck()` — 덱 카드 dict를 canonical 코드로 일괄 변환 + 합산
- `build_name_to_canonical_map()` — 구버전(카드명 형식) → v2 마이그레이션용

#### 검증 케이스
- `PR-339 → BP07-116` (BP 베이스 우선)
- `PR-447 → BP17-113` (BP 베이스 우선)
- `PR-435 → CP02-006` (BP 없는 콜라보 → CP 베이스)

#### 마이그레이션
- `개인전.txt` (카드명 형식, 구버전) → `개인전_v2.txt` (canonical 코드 형식) 변환 완료
- 개인전_v2.txt 기준 425개 고유 카드, carddb 히트율 100%

---

### 3. 통계 분석 (Codex MCP)

#### 구현 스크립트
| 파일 | 역할 |
|------|------|
| `scripts/analyzer.py` | 클래스별 우승·Top8 집계, 카드 채용률 |
| `scripts/cluster.py` | 덱 아키타입 군집 분석 (k-means / 계층 클러스터링) |
| `scripts/card_stats.py` | 클래스×아키타입별 카드 채용률 CSV 생성 |
| `scripts/analyze_individual_tsv.py` | TSV 직접 분석 스크립트 |
| `scripts/generate_weekly_charts_20260301.py` | 주간 차트 자동 생성 |

#### 산출 데이터
- `data/analysis/deck_clusters.csv` — 371건 덱 클러스터 레이블
- 클래스별 `card_stats_{class}.csv` — 전체 채용률
- 아키타입별 `card_stats_{class}_archetype{N}.csv` — 총 50+ 파일

#### 시각화 차트 (`reports/charts/`)
| 파일 | 내용 |
|------|------|
| `class_share_20260301.png` | 클래스별 Top8 점유율 (파이/바 차트) |
| `class_wins_20260301.png` | 클래스별 우승 횟수 |
| `class_trend_20260301.png` | 주간 클래스별 점유율 추이 |
| `class_top8_bar.png` | Top8 진출 횟수 비교 |
| `class_winrate_pie.png` | 클래스별 우승 비중 파이 차트 |
| `class_by_tournament_size.png` | 대회 규모별 클래스 분포 |
| `card_usage_top20_bar.png` | 전체 Top20 채용 카드 바 차트 |
| `archetype_heatmap.png` | 아키타입별 주요 카드 채용률 히트맵 |

---

### 4. RAG 모듈 (`rag/`)

#### 구현 파일
| 파일 | 역할 |
|------|------|
| `rag/retriever.py` | CardRetriever — `data/carddb_json/*.json` 로드 → 카드명·코드 인덱스 (2,698장) |
| `rag/prompt_builder.py` | enriched_data.json → Gemini 전달용 프롬프트 문자열 생성 |
| `rag/pipeline.py` | 전체 파이프라인: TSV + clusters → enriched_data.json → gemini_prompt.txt |

#### 출력 구조 (`output/YYYYMMDD/`)
- `analysis_data.json` — 클래스/아키타입 통계
- `enriched_data.json` — 카드 DB 효과 텍스트 포함 enriched 데이터
- `gemini_prompt.txt` — Gemini 전달용 최종 프롬프트

#### 프롬프트 설계 (Gemini 지시 포함)
- 아키타입 헤더 형식 강제: `### [クラス名] 한국어아키타입명 (대표카드1 / 대표카드2 / 대표카드3)`
- 한국어 아키타입 네이밍 규칙 명시 (영어·일본어 단독 사용 금지)
- 확정된 클래스별 아키타입 한국어 이름 예시 삽입

---

### 5. 메타 리포트 생성 (Gemini MCP)

#### 생성 완료 리포트
| 파일 | 기간 | 대회 수 | 집계 덱 |
|------|------|---------|---------|
| `reports/meta_report_20260223.md` | 2026-02-16 ~ 02-22 | — | — |
| `reports/meta_report_20260226.md` | 2026-02-23 ~ 02-26 | — | — |
| `reports/meta_report_20260301.md` | 2026-02-23 ~ 03-01 | 26건 | 144건 |

#### 리포트 구성 (최신 기준)
1. 이번 주 메타 개요 (한 줄 요약 + 핵심 지표)
2. 클래스별 성적표 (우승 횟수·비중, Top8 진출·점유율)
3. 아키타입 전체 리뷰 (티어 분류, 전략 개요, 주목 포인트)
4. 채용률 상위 카드 분석 (범용 채용권 카드)
5. 주간 메타 정리 (진단 + 다음 주 전망)

---

## 기술적 성과 및 해결한 문제

### Next.js SPA 인터셉트
- 직접 fetch 시 CORS 차단 → Playwright `waitForResponse` 패턴으로 해결
- 페이지 네비게이션과 API 응답을 `Promise.all`로 동시 대기

### lazy load 트리거
- `window.scrollTo` 미작동 문제 → `element.scrollIntoView({ behavior: 'instant', block: 'end' })` 로 해결

### LD 카드 코드 특수문자
- `BP02-LDⓈ01` 등 비ASCII 변형 존재 → 정규식 불가, `code.includes('-LD')` 문자열 검사로 해결

### Playwright 결과 파싱
- 결과 텍스트에 JSON 외 부가 텍스트 혼재 → `json.JSONDecoder().raw_decode()` 로 Extra data 오류 방지

### 카드명 형식 → 코드 형식 마이그레이션
- 구버전 데이터(카드명 기준)를 canonical 코드 기준으로 일괄 변환
- 카드명 인덱스(`build_name_to_canonical_map`) 구현으로 100% 매칭 달성

---

## 현재 데이터 현황

| 항목 | 수치 |
|------|------|
| 개인전 수집 건수 | 370건 (Top8 기준) |
| 트리오 수집 건수 | 71건 |
| 카드 DB 세트 수 | 49개 세트 |
| 카드 DB 총 카드 수 | 6,549장 |
| 덱 클러스터 레이블 | 371건 |
| 클래스별 아키타입 CSV | 50+ 파일 |
| 생성된 주간 리포트 | 3건 |
| 생성된 시각화 차트 | 8종 |

---

## 향후 개선 예정

- [ ] RAG enrichment: 채용률 상위 카드 전체에 효과 텍스트 삽입 (`effect[:200]` truncate 제거)
- [ ] clusters 없을 때 채용률 기반 fallback 아키타입 분류
- [ ] 트리오전 전용 메타 리포트 생성
- [ ] 대회 규모(참가자 수)별 메타 차이 분석 심화
- [ ] 주간 메타 변화 추이 자동화 (weekly diff)
