# SVE Meta

TCG(트레이딩 카드게임) 대전 기록을 관리하는 웹앱과, Shadowverse EVOLVE 공식 대회 메타를 자동 분석하는 파이프라인을 함께 관리하는 저장소입니다.

## TCG Match Tracker (webapp/)

카드게임 종류에 관계없이 사용할 수 있는 개인 전적 관리 웹앱입니다.

### 주요 기능

- **Google 로그인** — Supabase Auth 기반 인증
- **카드게임 / 덱 관리** — 사용자 정의 카드게임 등록, 게임별 덱 생성 및 색상 지정
- **경기 기록** — BO1/BO3, 선공/후공, 승패, 대회 분류(친선전/매장대회/CS)
- **대회 연속 입력** — 매장대회·CS 기록 시 예선(스위스) → 본선(토너먼트) 흐름을 자연스럽게 이어가며 입력
- **타임라인 뷰** — 같은 날 같은 덱으로 기록한 대회 경기가 라운드별 타임라인으로 그룹핑
- **대시보드** — 기간별 필터, 사용 덱 / 상대 덱 분포 도넛 차트
- **기록 필터 + 페이지네이션** — 카드게임, 덱, 형식, 대회 분류별 필터
- **CSV 내보내기** — 필터 조건에 맞는 기록을 CSV로 다운로드
- **다크 모드** — 라이트 / 다크 / 시스템 자동 전환

### 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router, Server Actions) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS 4 + CSS Variables (시맨틱 컬러 토큰) |
| 인증 | Supabase Auth (Google OAuth) |
| 데이터베이스 | Supabase PostgreSQL |
| ORM | Prisma |
| 차트 | Recharts |
| 배포 | Vercel |

### 실행

```bash
cd webapp
cp .env.local.example .env.local   # Supabase 키 설정
npm install
npx prisma migrate deploy
npm run dev
```

### 배포

1. Vercel에서 저장소 import → Root Directory를 `webapp`으로 설정
2. 환경 변수 5개 추가 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`)
3. Supabase Authentication → Redirect URLs에 `https://도메인/auth/callback` 추가

자세한 내용은 [webapp/DEPLOYMENT.md](webapp/DEPLOYMENT.md) 참조.

### 데이터 모델

```
User ─┬─ Game ── Deck ── MatchResult
      └─ Tag ────────── MatchResultTag
```

- `MatchResult`: 날짜, 내 덱, 상대 덱, 형식(BO1/BO3), 선공/후공, 승패, 대회 분류, 대회 단계(예선/본선), 메모
- `EventCategory`: friendly / shop / cs
- `TournamentPhase`: swiss / elimination (shop/cs에만 적용)

---

## 메타 분석 파이프라인

Shadowverse EVOLVE 공식 대회 결과를 자동 수집하고, AI가 한국어 메타 리포트를 작성하는 파이프라인입니다.

### 흐름

```
수집 (Playwright) → 정규화 → 클러스터링 (Codex) → RAG enrichment → 리포트 (Gemini)
```

1. **수집** — bushi-navi.com API 인터셉트 → 대회 순위·덱코드 추출 / decklog → 카드 구성 수집
2. **정규화** — PR/SL 등 변형 카드 코드를 canonical 코드로 통일 (`scripts/normalize_cards.py`)
3. **분석** — 클래스별 집계, 덱 클러스터링, 카드 채용률 산출
4. **RAG** — 카드 DB 효과 텍스트를 통계에 결합하여 Gemini 프롬프트 생성
5. **리포트** — Gemini가 한국어 메타 리포트 작성

### 에이전트 구성

| 역할 | 도구 |
|------|------|
| 오케스트레이터 | Claude Code |
| 웹 스크래핑 | Playwright MCP |
| 코드 작성·데이터 처리 | Codex MCP |
| 메타 해석·리포트 | Gemini MCP |

### 사용법

```bash
# 덱 클러스터링
python3 scripts/run_cluster.py

# 카드 채용률 분석
python3 scripts/card_stats.py

# RAG 파이프라인 → 리포트 생성
python3 rag/pipeline.py \
  --tsv data/개인전_v2.txt \
  --clusters data/analysis/deck_clusters.csv \
  --out output/$(date +%Y%m%d)
```

### 데이터

| 데이터 | 설명 |
|--------|------|
| `data/개인전_v2.txt` | 개인전 누적 데이터 (7컬럼 TSV, canonical 코드) |
| `data/트리오.txt` | 트리오 누적 데이터 |
| `data/carddb_json/` | 카드 DB 49세트, 6,500장+ (JSON) |
| `data/analysis/` | 클러스터링·채용률 결과 (CSV) |
| `reports/` | 생성된 메타 리포트 |

---

## 디렉토리 구조

```
sve_meta/
├── webapp/                 # TCG Match Tracker 웹앱
│   ├── app/                #   App Router 페이지
│   ├── components/         #   UI 컴포넌트
│   ├── lib/                #   서버 유틸·검증
│   ├── prisma/             #   스키마·마이그레이션
│   └── supabase/           #   RLS 정책
├── scripts/                # 데이터 처리·분석 스크립트
├── rag/                    # RAG 파이프라인 (retriever, prompt builder)
├── data/                   # 수집 데이터·카드 DB
├── reports/                # 메타 리포트
├── output/                 # RAG 파이프라인 출력
└── docs/                   # 룰북·프로젝트 문서
```

## 라이선스

개인 분석 목적으로만 사용. 수집 데이터의 저작권은 각 원본 사이트에 귀속.

`当サイトに使用しているカード画像は、Shadowverse EVOLVE公式サイト(https://shadowverse-evolve.com/) より、ガイドラインに従って転載しております。該当画像の再利用（転載・配布等）は禁止しております。© Cygames, Inc. ©bushiroad All Rights Reserved.`
