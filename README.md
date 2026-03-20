# SVE Meta

Shadowverse EVOLVE 공식 대회 결과를 수집하고, 정규화·클러스터링·RAG enrichment를 거쳐 한국어 메타 리포트를 생성하는 데이터 파이프라인 저장소입니다.

## 메타 분석 파이프라인

```
수집 (Python Playwright) → 정규화 → 클러스터링 (Codex) → RAG enrichment → 리포트 (Gemini)
```

1. **수집** — bushi-navi.com API 인터셉트 → 대회 순위·덱코드 추출 / decklog → 메인+이볼브 카드 구성 수집 (`scripts/collect.py`)
2. **정규화** — PR/SL 등 변형 카드 코드를 canonical 코드로 통일 (`scripts/normalize_cards.py`)
3. **분석** — 클래스별 집계, 덱 클러스터링, 카드 채용률 산출
4. **RAG** — 카드 DB 효과 텍스트를 통계에 결합하여 Gemini 프롬프트 생성
5. **리포트** — Gemini가 한국어 메타 리포트 작성

### 에이전트 구성

| 역할 | 도구 |
|------|------|
| 오케스트레이터 + 차트 생성 | Claude Code |
| 웹 스크래핑 (데이터 수집) | Python Playwright (`scripts/collect.py`) |
| 코드 작성·데이터 처리 | Codex MCP |
| 메타 해석·리포트 | Gemini MCP |

### 사용법

```bash
# 대회 데이터 수집
python3 scripts/collect.py

# 덱 클러스터링
python3 scripts/cluster.py

# 카드 채용률 분석
python3 scripts/analyzer.py

# RAG 파이프라인 → 리포트 생성
python3 rag/pipeline.py \
  --tsv data/개인전_v3.txt \
  --clusters data/analysis/deck_clusters.csv \
  --out output/$(date +%Y%m%d)
```

### 데이터

| 데이터 | 설명 |
|--------|------|
| `data/개인전_v3.txt` | 개인전 누적 데이터 (8컬럼 TSV, canonical 코드, 이볼브 덱 포함) |
| `data/트리오_v2.txt` | 트리오 누적 데이터 (8컬럼 TSV) |
| `data/carddb_json/` | 카드 DB 49세트, 6,500장+ (JSON) |
| `data/analysis/` | 클러스터링·채용률 결과 (CSV) |
| `reports/` | 생성된 메타 리포트 |

---

## 디렉토리 구조

```
sve_meta/
├── scripts/                # 데이터 수집·처리·분석 스크립트
├── rag/                    # RAG 파이프라인 (retriever, prompt builder)
├── data/                   # 수집 데이터·카드 DB
├── reports/                # 메타 리포트
├── output/                 # RAG 파이프라인 출력
└── docs/                   # 룰북·프로젝트 문서
```

## 라이선스

개인 분석 목적으로만 사용. 수집 데이터의 저작권은 각 원본 사이트에 귀속.

`当サイトに使用しているカード画像は、Shadowverse EVOLVE公式サイト(https://shadowverse-evolve.com/) より、ガイドラインに従って転載しております。該当画像の再利用（転載・配布等）は禁止しております。© Cygames, Inc. ©bushiroad All Rights Reserved.`
