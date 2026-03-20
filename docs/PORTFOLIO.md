# 섀도우버스 이볼브 메타 분석 프로젝트 — 작업 포트폴리오

> 최종 갱신: 2026-03-16
> Claude Code (claude-opus-4-6 / claude-sonnet-4-6) + Playwright MCP + Codex MCP + Gemini MCP 협업

---

## 프로젝트 개요

섀도우버스 이볼브(Shadowverse EVOLVE) 공식 대회 결과를 자동 수집·분석하여 주간 메타 리포트를 생성하는 **AI 파이프라인** 프로젝트.

| 영역 | 설명 |
|------|------|
| 메타 분석 파이프라인 | bushi-navi.com 대회 수집 → 카드 정규화 → 클러스터링 → RAG → Gemini 리포트 |
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

---

## 향후 개선 예정

### 메타 분석
- [ ] RAG enrichment: 채용률 상위 카드 전체에 효과 텍스트 삽입 (truncate 제거)
- [ ] clusters 없을 때 채용률 기반 fallback 아키타입 분류
- [ ] 트리오전 전용 메타 리포트 생성
- [ ] 대회 규모별 메타 차이 분석 심화
- [ ] 주간 메타 변화 추이 자동화
