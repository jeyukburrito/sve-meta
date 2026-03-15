# Shadowverse EVOLVE 메타 분석

섀도우버스 이볼브 공식 대회 결과를 자동 수집·분석하여 주간 메타 리포트를 생성하는 AI 파이프라인과, 개인 전적을 기록하는 웹앱을 함께 관리하는 저장소입니다.

## 구조

```
sve_meta/
├── data/
│   ├── 개인전_v2.txt          # 개인전 누적 데이터 (475건, 7컬럼 TSV)
│   ├── 트리오.txt             # 트리오 누적 데이터 (71건)
│   ├── raw/                   # 수집 원시 JSON
│   ├── processed/             # 정제된 TSV
│   ├── analysis/              # 클러스터링·채용률 CSV
│   ├── carddb_json/           # 카드 DB (49세트, JSON)
│   └── carddb/                # 카드 DB (CSV)
├── scripts/
│   ├── normalize_cards.py     # 카드 코드 정규화 (canonical 변환)
│   ├── cluster.py             # 덱 아키타입 군집 분석
│   ├── card_stats.py          # 카드 채용률 통계
│   ├── analyzer.py            # 클래스별 집계
│   ├── weekly_stats.py        # 주간 통계 집계
│   ├── visualize_weekly.py    # 주간 차트 생성
│   ├── process_new_data.py    # 신규 데이터 처리
│   └── archive/               # 일회성 스크립트
├── rag/
│   ├── pipeline.py            # RAG 파이프라인 (TSV → enriched → prompt)
│   ├── retriever.py           # CardRetriever (카드 DB 조회)
│   └── prompt_builder.py      # Gemini 프롬프트 생성
├── webapp/                    # 개인 전적 관리 웹앱 (Next.js + Supabase)
├── reports/                   # 메타 리포트 + 차트
├── output/                    # RAG 파이프라인 출력
└── docs/                      # 룰북·프로젝트 문서
```

## 저장소 구성

이 저장소는 두 축으로 운영됩니다.

1. `scripts/`, `rag/`, `data/`, `reports/`
   - 공식 대회 데이터를 수집·정규화·분석하고 주간 메타 리포트를 만드는 파이프라인
2. `webapp/`
   - 개인 전적 기록, 덱 관리, 대시보드 통계, CSV 내보내기를 제공하는 Next.js 웹앱

즉, 상단 파이프라인은 "메타를 읽는 도구"이고, `webapp/`은 "내 플레이 데이터를 직접 쌓는 도구"입니다.

## 파이프라인

```
수집 (Playwright) → 정규화 → 클러스터링 (Codex) → RAG enrichment → 리포트 (Gemini)
```

1. **수집** — bushi-navi.com API 인터셉트로 대회 순위·덱코드 추출, decklog에서 카드 구성 수집
2. **정규화** — PR/SL 등 변형 코드를 canonical 코드로 통일
3. **분석** — 클래스별 집계, 덱 클러스터링, 카드 채용률 산출
4. **RAG** — 카드 DB 효과 텍스트를 통계에 결합하여 Gemini 프롬프트 생성
5. **리포트** — Gemini가 한국어 메타 리포트 작성

## 기술 스택

| 역할 | 도구 |
|------|------|
| 오케스트레이터 | Claude Code |
| 웹 스크래핑 | Playwright MCP |
| 코드 작성·데이터 처리 | Codex MCP |
| 메타 해석·리포트 | Gemini MCP |

## Webapp

`webapp/`은 Supabase 기반 로그인과 개인 데이터 분리를 전제로 한 카드게임 전적 관리 앱입니다. 현재는 Shadowverse EVOLVE를 포함해 사용자가 직접 카드게임 이름을 등록하고, 게임별로 덱과 경기 기록을 분류할 수 있습니다.

주요 기능:
- Google 로그인
- 카드게임 관리
- 내 덱 관리
- 경기 결과 입력/수정/삭제
- 기록 목록 필터
- 대시보드 통계 및 차트
- CSV 내보내기

주요 기술:
- `Next.js App Router`
- `TypeScript`
- `Tailwind CSS`
- `Supabase Auth / Postgres`
- `Prisma`
- `Recharts`
- `Vercel`

빠른 실행:

```bash
cd webapp
npm install
npm run dev
```

배포:
- `webapp/`을 Vercel의 Root Directory로 지정
- Supabase Auth callback URL을 배포 도메인 기준으로 설정
- 상세 내용은 [webapp/DEPLOYMENT.md](/home/oo/work/sve_meta/webapp/DEPLOYMENT.md) 참고

관련 문서:
- [webapp/AGENTS.md](/home/oo/work/sve_meta/webapp/AGENTS.md)
- [webapp/STATUS.md](/home/oo/work/sve_meta/webapp/STATUS.md)

## 데이터 소스

| 사이트 | 용도 |
|--------|------|
| bushi-navi.com | 대회 결과 (API 인터셉트) |
| decklog.bushiroad.com | 덱 카드 구성 |
| shadowverse-evolve.com | 카드 DB (49세트, 6,500장+) |

## 사용법

```bash
# 덱 클러스터링
python3 scripts/run_cluster.py

# 카드 채용률 분석
python3 scripts/card_stats.py

# RAG 파이프라인 실행
python3 rag/pipeline.py \
  --tsv data/개인전_v2.txt \
  --clusters data/analysis/deck_clusters.csv \
  --out output/$(date +%Y%m%d)
```

## 라이선스

개인 분석 목적으로만 사용. 수집 데이터의 저작권은 각 원본 사이트에 귀속.

`当サイトに使用しているカード画像は、Shadowverse EVOLVE公式サイト(https://shadowverse-evolve.com/)より、ガイドラインに従って転載しております。該当画像の再利用（転載・配布等）は禁止しております。© Cygames, Inc. ©bushiroad All Rights Reserved.`
