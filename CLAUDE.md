# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

---

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

---

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

---

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

---

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

---

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards

# 섀도우버스 이볼브 메타 분석 프로젝트

## 기본 지침

- **모든 답변은 한국어로 작성한다**
- 카드명·키워드 등 게임 고유 용어는 **일본어 원문 표기**를 기본으로 하고, 필요 시 한국어 병기
- 코드 작성 시 변수명/주석은 영어, 사용자 대면 출력은 한국어
- 불확실한 룰 판정은 **추측하지 말고** `docs/rules/` 원문을 확인한 후 답변

---

## 게임 룰 참조 체계

이 프로젝트는 Shadowverse EVOLVE 종합 룰 ver.1.24.1 (2026/01/29) 기반입니다.

### Layer 1: 코어 룰 요약 (항상 참조)

<rules>

## 게임 개요
- 2인 대전 카드게임
- **승리 조건**: 상대 리더 체력을 0 이하로 만듦 / 상대 덱 0장일 때 드로우 강제
- **패배 조건**: 자신의 리더 체력 0 이하 / 덱 0장에서 드로우 / 투항 선언
- **대원칙**: 카드 텍스트는 룰에 우선. 실행 불가능한 지시는 무시. 금지 효과는 항상 우선.

## 카드 종류
| 종류 | 영문 | 특수 종류 |
|------|------|----------|
| 리더 | Leader | - |
| 추종자 | Follower | EVOLVE, ADVANCE |
| 마법진 | Amulet | - |
| 주문 | Spell | - |

## 클래스
뉴트럴 / エルフ / ロイヤル / ウィッチ / ドラゴン / ナイトメア / ビショップ

## 콜라보 타이틀
プリンセスコネクト！Re:Dive, ウマ娘 プリティーダービー, アイドルマスター シンデレラガールズ, カードファイト!! ヴァンガード

## PP/EP/SEP
| 값 | 하한 | 상한 | 용도 |
|----|------|------|------|
| PP 최대값 | 0 | 10 | 턴 시작 시 PP를 이 값으로 설정 |
| PP | 0 | PP 최대값 | 카드 플레이·진화의 코스트 |
| EP | 0 | 없음 | 진화 코스트의 PP 1점을 EP 1점으로 대체 가능 |
| SEP | 0 | 없음 | 초진화에 소비 (초기값 1) |

초기값: 선공 EP 0 / 후공 EP 3 / SEP 각 1 / 리더 체력 각 20 / PP·PP최대값 각 0

## 영역(존)
| 영역 | 공개 | 상한 | 비고 |
|------|------|------|------|
| 리더 에리어 | ○ | - | 리더 배치 |
| 필드 | ○ | 5장 | 팔로워·아뮬렛 배치 |
| 덱 | × | - | 위에서 드로우 |
| 이볼브 덱 | ×(자신만) | - | 진화용 카드 |
| 핸드 | ×(자신만) | 7장 | 미사용 카드 |
| EX 에리어 | ○ | 5장 | 공개 상태 미사용 카드 |
| 묘지 | ○ | - | 사용 완료 카드 |
| 소멸 영역 | ○ | - | 소멸된 카드 |
| 해결 영역 | ○ | - | 양자 공유 임시 영역 |
| 진화 영역 | ○ | - | 이볼브 카드 |
| 출주 영역 | ○ | - | 우마무스메 전용 |
| 드라이브 영역 | ○ | - | 뱅가드 전용 |
| 트리거 영역 | ○ | - | 뱅가드 전용 |
| 장비 영역 | ○ | - | 프리코네 전용 |

## 턴 구조
```
스타트 페이즈: PP최대값+1 → PP회복 → 전체 스탠드 → 1장 드로우(선공1T제외) → 체크 타이밍
    ↓
메인 페이즈: 카드 플레이 / 기동 능력 / 공격 / 종료 선택 (반복, 각 행동 후 체크 타이밍)
    ↓
엔드 페이즈: 유발 → 체크 → 수호 액트 → 체크 → 퀵 기회 → 핸드 상한 → 효과 제거 → 턴 종료
```

## 공격 절차
1. 스탠드 상태 팔로워 선택 (턴 처음부터 연속 마스터 or 이번 턴 진화)
2. 목표 선택: 상대 액트 팔로워(항상) / 상대 리더(연속 마스터만) / 수호 액트 우선
3. 공격 팔로워 액트 → 「공격했다」 사건 → 체크 → 퀵 기회
4. 데미지 교환 (동시) → 체크 → 공격 종료

## 진화 시스템
- **통상 진화**: 기동 능력, 1턴 1회. 이볼브 덱에서 적정 카드 공개 + PP(EP 대체 가능)
- **초진화**: 경과 턴 선공7+/후공6+ 시 SEP 1점 추가 지불. 공격력+1/체력+1

## 능력 분류
| 종류 | 표기 | 설명 |
|------|------|------|
| 기동 능력 | ◆(코스트):(효과) | 능동 사용 |
| 자동 능력 | (조건)때, (효과) | 유발 조건으로 자동 (강제) |
| 영속 능력 | (위 이외) | 상시 효과 |
| 스펠 능력 | 스펠 텍스트 | 스펠 고유 |

효과: 단발 효과 / 계속 효과 / 치환 효과(「~하는 대신」)

## 체크 타이밍
1. 룰 처리 전부 동시 실행 (반복)
2. 턴P 대기 자동 능력 1개 → 1로 복귀
3. 비턴P 대기 자동 능력 1개 → 1로 복귀
4. 종료

## 주요 키워드 능력
| 키워드 | 종류 | 효과 |
|--------|------|------|
| 수호(守護) | 영속 | 필드 배치 시 액트 가능. 상대는 액트 수호 우선 공격. 엔드에 액트 가능 |
| 질주(疾走) | 영속 | 나온 턴부터 리더 포함 공격 가능 |
| 돌진(突進) | 영속 | 나온 턴부터 액트 팔로워만 공격 가능 |
| 필살(必殺) | 영속 | 교전 팔로워를 룰 처리에서 파괴 |
| 드레인 | 자동 | 공격 데미지 부여 시 리더 체력 동일 회복 |
| 오라 | 영속 | 상대 카드/능력으로 선택 불가 (공격 목표로는 가능) |
| 위압(威圧) | 영속 | 상대의 공격 목표 불가 |
| 퀵(Quick) | 영속 | 상대 턴 특정 타이밍에 플레이 가능 |
| 팡파레 | 자동 | 필드 외에서 필드에 나왔을 때 유발 |
| 라스트 워드 | 자동 | 필드에서 묘지에 놓였을 때 유발 |
| 진화 시 | 자동 | 진화했을 때 유발 |
| 공격 시 | 자동 | 공격했을 때 유발 |

## 클래스별 키워드
| 클래스 | 키워드 | 조건 |
|--------|--------|------|
| エルフ | 콤보 N | 이번 턴 N장 이상 플레이 완료 |
| ウィッチ | 스펠체인/SC N | 묘지 스펠 N장 이상 |
| ウィッチ | 스택 | 아뮬렛 카운터 관리. 0이면 묘지 |
| ウィッチ | 흙의 비술 N | 스택 카운터 N개 제거 |
| ドラゴン | 각성 | PP 최대값 7 이상 |
| ナイトメア | 네크로차지/NC N | 묘지 카드 N장 이상 |
| ナイトメア | 진홍 | 자기 턴 중 리더 체력 감소 이력 |

## 타이틀별 키워드
- **우마무스메**: 식사(이볼브 덱 당근→출주 영역), 식사 능력(진화 상당), 출주(돌진+사건), 출주 시
- **데레마스**: 마법의 아이템(EX에 토큰5개 배치), 레슨 N(마법의 아이템 N장 소멸)
- **뱅가드**: 트리거(크리/드로/스탠드/힐), 스타트 아뮬렛, 드라이브 체크, 빙의/라이드(진화 상당)
- **프리코네**: 유니온 버스트(타이틀 기준 전용), 이퀴프먼트/장비(토큰→관련부여)

## 덱 구축
- 리더 1장 / 메인 덱 40~50장 / 이볼브 덱 0~10장
- 동명 제한: 메인 3 + 이볼브 3 = 총 6장
- 클래스 기준: 리더와 동일 클래스 or 뉴트럴 / 타이틀 기준: 동일 타이틀

## 특정 표기 퀵 레퍼런스
파괴(필드→묘지) / 소멸(→소멸영역) / 찾다(덱→취득→셔플) / 드로우(덱위→핸드, 0장이면 패배) / 버리다(핸드→묘지) / 변신(소멸→토큰생성) / 데미지(체력 감소, 음수 가능) / 회복PP(가산, 최대값 불초과) / 빼앗다(마스터 변경) / 초이스(선택지에서 지정 수) / X(텍스트 내 결정 or 플레이 시 결정) / ~당(단위×수치, 나머지 버림) / 절반(홀수면 올림)

## 토큰 기본
카드가 아니지만 카드 취급. 팔로워/아뮬렛 토큰은 EX·필드·해결 영역만. 스펠 토큰은 EX·해결만. 이퀴프먼트 토큰은 이퀴프먼트 영역만. 존재 불가 영역 이동 시 즉시 소거.

</rules>

### Layer 2: 상세 룰 참조 가이드

상세 판정이 필요할 때 아래 파일을 참조합니다. `docs/rules/` 경로에 위치합니다.

| 질문 유형 | 참조 파일 |
|----------|----------|
| 승패 판정, 대원칙 확인 | `01_game_overview.md` |
| 카드 속성, 양면 카드 | `02_card_info.md` |
| 오너/마스터, PP/EP/SEP 상세 | `03_player_info.md` |
| 영역 이동, 배치 상태 규칙 | `04_zones.md` |
| 파괴/소멸/탐색/데미지 등 정의 | `05_special_notation.md` (24KB, 가장 빈번) |
| 덱 구축 조건, 게임 전 절차 | `06_game_setup.md` |
| 턴 구조, 각 페이즈 상세 | `07_game_flow.md` |
| 카드 플레이/공격 9단계 절차 | `08_main_phase.md` |
| 토큰/어드밴스 카드 처리 | `09_special_cards.md` |
| **능력/효과/체크 타이밍 (핵심)** | `10_play_resolve.md` (28KB, 최중요) |
| 자동 룰 처리 (파괴/패배 등) | `11_rule_processing.md` |
| 키워드 능력 전체 정의 | `12_keywords.md` |
| 클래스별 키워드 정의 | `13_class_keywords.md` |
| 타이틀별 키워드 정의 | `14_title_keywords.md` |
| 카운터, 무한루프 | `15_misc.md` |
| 토큰 전체 스탯/텍스트 | `appendix_a_tokens.md` (30KB) |
| 실드전, 크로스오버 | `appendix_b_formats.md` |
| 버전 변경점 | `appendix_c_updates.md` |

**원문 참조**: `docs/rules/svevolve_core_rules_ja.md` / `docs/rules/svevolve_core_rules_ko.md`
**PDF 원본**: `docs/ShadowverseEVOLVE_cr_1.24.1_260129.pdf`

---

## 프로젝트 개요

1. **메타 분석**: bushi-navi.com 대회 결과 수집 → 덱 구성·클래스 분포 분석 → 메타 파악
2. **카드 DB 수집**: shadowverse-evolve.com 공식 카드 리스트 → 전 세트 카드 정보 DB화

---

## 기술 스택

| 역할 | 도구 |
|------|------|
| 웹 스크래핑 (데이터 수집) | Python Playwright (`scripts/collect.py`) |
| 데이터 처리·분석 코드 작성 | Codex MCP |
| 메타 해석·리포트 생성 | Gemini MCP |
| 오케스트레이터 + 차트 생성 | Claude (본 에이전트) |

---

## 에이전트 역할 분담

### 🎭 Claude (오케스트레이터 + 차트 생성)
- 전체 파이프라인 조율, 각 MCP 작업 위임 및 결과 통합
- **데이터 기반 차트 직접 생성** (matplotlib/plotly — 인코딩 주의)
- 룰 판정 필요 시 Layer 1 즉시 참조 → 부족하면 Layer 2 파일 확인
- 오류 발생 시 재시도 로직 결정

### 🐍 Python Playwright (`scripts/collect.py`)
**담당: 웹 스크래핑 (데이터 수집)**
- bushi-navi.com API 인터셉트 → 대회 목록·순위·덱코드 추출
- decklog.bushiroad.com → 메인 덱 + 이볼브 덱 카드 코드 추출
- shadowverse-evolve.com → 카드 DB 수집

### ⚙️ Codex MCP
**담당: 코드 작성 및 데이터 처리**
- 수집 원시 데이터 정제·정규화 (normalize_cards.py 활용)
- 클래스별 집계, 덱 유사도 분석, 카드 채용률 통계
- 덱 클러스터링
- RAG 파이프라인 유지보수

---

## 프로젝트 디렉토리 구조

```
sve_meta/
├── CLAUDE.md                      # 본 파일
├── data/
│   ├── 개인전_v3.txt               # 누적 수집 데이터 (8컬럼 TSV, 현재 기준)
│   ├── 트리오_v2.txt               # 트리오 누적 수집 데이터 (8컬럼 TSV, 현재 기준)
│   ├── raw/                       # Playwright 수집 원시 JSON
│   ├── processed/                 # 정제된 TSV
│   ├── analysis/                  # 분석 결과 (CSV, 차트)
│   │   ├── deck_clusters.csv      # 덱 클러스터링 결과
│   │   └── card_stats_{class}_archetype{id}.csv
│   ├── carddb_json/               # 카드 DB (세트별 JSON, canonical 기준)
│   ├── carddb/                    # 카드 DB (세트별 CSV)
│   └── archetypes/                # 아키타입 YAML (덱 메타정보)
├── docs/
│   ├── rules/                     # Layer 2 상세 룰 (17파일)
│   └── ShadowverseEVOLVE_cr_1.24.1_260129.pdf
├── scripts/
│   ├── collect.py                 # 대회 데이터 수집 (Python Playwright)
│   ├── normalize_cards.py         # 카드 코드 정규화 (canonical 변환)
│   ├── analyzer.py                # 통계 분석
│   └── cluster.py                 # 덱 아키타입 군집 분석
├── rag/
│   ├── pipeline.py                # RAG 전체 파이프라인
│   ├── retriever.py               # CardRetriever (카드 DB 조회)
│   └── prompt_builder.py          # Gemini 프롬프트 생성
├── output/
│   └── YYYYMMDD/
│       ├── analysis_data.json
│       ├── enriched_data.json
│       └── gemini_prompt.txt
└── reports/
    ├── meta_report_YYYYMMDD.md
    └── charts/
```

---

## 데이터 수집 명세

### bushi-navi.com API

> Next.js SPA → Playwright `waitForResponse`로 인터셉트 필수 (직접 fetch는 CORS 차단)
> CloudFront WAF 보호 → Python requests 직접 호출 시 404 → Python Playwright 필수

| 엔드포인트 | 설명 |
|-----------|------|
| `GET api-user.bushi-navi.com/api/user/event/result/list?game_title_id[]=6&limit=10&offset=0` | 대회 목록 |
| `GET api-user.bushi-navi.com/api/user/event/result/detail/{tournament_code}` | 대회 상세 |

**대회 상세 API 응답 구조**
```json
{
  "success": {
    "event_detail": {
      "start_datetime": "2026-02-23T03:00:00+00:00",
      "joined_player_count": 33,
      "team_count": 1
    },
    "grouped_rankings": {
      "": {
        "{team_id}": {
          "rank": 1,
          "team_member": [{ "deck_recipe_id": "46856", "deck_param1": "クラス名" }]
        }
      }
    }
  }
}
```
- `grouped_rankings` → 최종 순위 Top 8 사용
- `primary_result` → 예선 스위스 결과 (미사용)
- **개인전/트리오 구분**: `event_detail.team_count` 기준 (1=개인전, 3=트리오)
  - `series_type`은 SVE 전체가 항상 3이므로 구분 불가 — **사용 금지**

### decklog.bushiroad.com 카드 추출

- URL: `https://decklog.bushiroad.com/view/{deck_recipe_id}`
- 페이지 로드 후 **2초** 대기 (CSR 앱 — 즉시 DOM 추출 불가)
- **카드 코드**: `.card-item img.card-view-item` 의 `title` 속성 → `" : "` 앞 부분
  - 예: `title="BP17-106 : デバイスチューナー"` → `code = "BP17-106"`
- **장수**: `.card-item span.num`
- 메인 덱 + 이볼브 덱 모두 수집 (h3 텍스트로 섹션 구분)
- 수집 후 `normalize_deck()` 호출 → canonical 코드로 변환

```js
const findSection = (label) => {
  const h3 = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes(label));
  if (!h3) return null;
  return Array.from(h3.nextElementSibling.querySelectorAll('.card-item')).map(item => ({
    code: item.querySelector('img.card-view-item').getAttribute('title').split(' : ')[0].trim(),
    count: parseInt(item.querySelector('span.num').textContent)
  }));
};
return { main: findSection('メインデッキ'), evolve: findSection('エボルブデッキ') };
```

### 수집 필드 및 TSV 형식 (v3 — 8컬럼)

| 필드 | 설명 | 예시 |
|------|------|------|
| `날짜` | 대회 날짜 | 2026-02-23 |
| `직업` | 사용 클래스 | ビショップ |
| `등수` | 최종 순위 | 1 |
| `참가자` | 참가자 수 | 33 |
| `덱코드` | decklog 코드 | 61PZ2 |
| `대회코드` | bushi-navi 대회 ID | 1450587 |
| `카드` | 메인 덱 `{canonical_code: 장수}` | `{'BP17-106': 3, ...}` |
| `이볼브` | 이볼브 덱 `{canonical_code: 장수}` | `{'BP17-E01': 1, ...}` |

```
날짜	직업	등수	참가자	덱코드	대회코드	카드	이볼브
2026-03-17	エルフ	1	14	ABCDE	1519521	{'BP01-015': 2, ...}	null
```

### 수집 규칙
- **개인전**: grouped_rankings 1~8위 수집 / 참가자 **9인 미만 대회 제외**
- **트리오**: 참가자 수 제한 없이 전부 수집
- 요청 딜레이: decklog 페이지마다 **1.5초** 대기
- 덱코드 없는 플레이어: `카드` 및 `이볼브` 필드 `null`

---

## 카드 코드 정규화 (`scripts/normalize_cards.py`)

decklog에서 수집한 카드 코드(PR-339, BP12-SL23 등)를 canonical 코드로 통일.

### 동일 카드 판별 기준
`class + cost + effect` 가 같으면 동일 카드 → card_code 오름차순 정렬 → **첫 번째 = canonical**

### canonical 우선순위
| 우선순위 | 패턴 | 예시 |
|:---:|---|---|
| 1 | BP 베이스 | `BP01-001` |
| 2 | EBD/ETD 베이스 | `EBD01-010` |
| 3 | CP/ECP 베이스 (콜라보) | `CP04-001` |
| 4 | SP 베이스 | `SP01-001` |
| 5 | SD 베이스 | `SD01-003` |
| 6 | BP 변형 (SL/P/U/SP) | `BP01-SL01` |
| 7 | CP/ECP 변형 | `CP02-P03` |
| 8 | PR (프로모) | `PR-339` |

**검증 케이스**
- `PR-339 → BP07-116` (BP 베이스 존재)
- `PR-447 → BP17-113` (BP 베이스 존재)
- `PR-435 → CP02-006` (BP 없는 콜라보 카드 → CP 베이스)

```bash
python3 scripts/normalize_cards.py --test          # self-test
python3 scripts/normalize_cards.py \               # 마이그레이션
  --input data/개인전_v2.txt --output data/개인전_v3.txt
```

---

## 카드 DB 수집 명세

### 대상 사이트
```
https://shadowverse-evolve.com/cardlist/cardsearch/?expansion={세트코드}&view=text
```

### 수집 방법 (Playwright)
1. 클래스 필터 버튼 순서대로 클릭 → `card_code → class` 매핑 생성 (클릭 후 **1500ms** 대기 필수)
2. 클래스 필터 내 `scrollIntoView` 루프로 lazy load 트리거 (window.scrollTo는 미작동)
3. DOM 추출 후 클래스 매핑 적용

### DOM 셀렉터
```
ul.cardlist-Result_List_Txt li → 카드 아이템
  p.number                    → 카드 코드 (BP01-001)
  p.ttl                       → 카드명
  .status .status-Item        → [0]카드 종류, [1]타입
  .status-Item-Cost           → 코스트
  .status-Item-Power          → 공격력
  .status-Item-Hp             → 체력
  .detail                     → 효과 텍스트 (img alt → 【키워드】 변환)
```

### 수집 대상·제외

| 대상 | 설명 |
|------|------|
| ✅ 수집 | BP/CP/ECP/SP/SD/EBD/ETD/PR 베이스 및 P/SL/U/SP 변형, 토큰(T) |
| ❌ 제외 | LD (리더 카드) — `code.includes('-LD')` 로 판별 |

> 레어도(LG/GR/SR/BR 등) 수집하지 않음

### 출력
- JSON: `data/carddb_json/{세트코드}.json`
- CSV: `data/carddb/{세트코드}.csv` (UTF-8-sig)
- 필드: `card_code, name, class, card_type, sub_type, cost, attack, hp, effect`

---

## 작업 파이프라인

```
[1] 대회 데이터 수집 (Python Playwright — scripts/collect.py)
    ├─ bushi-navi API 인터셉트 → 대회 목록 순회 (offset 증가)
    ├─ grouped_rankings → 순위/클래스/deck_recipe_id 추출
    ├─ decklog 방문 → 메인 + 이볼브 카드 코드 추출 (img[title])
    ├─ normalize_deck() → canonical 코드 변환
    └─ data/개인전_v3.txt / data/트리오_v2.txt 에 TSV 추가

[2] 통계 분석 (Codex MCP)
    ├─ 클래스별 우승·TOP8 집계
    ├─ 카드 채용률 Top N (canonical 코드 기준)
    ├─ 덱 클러스터링 → data/analysis/deck_clusters.csv
    └─ card_stats_{class}_archetype{id}.csv 생성

[3] RAG + 프롬프트 생성 (rag/pipeline.py)
    ├─ TSV + clusters → enriched_data.json
    ├─ CardRetriever: canonical 코드로 카드 DB 조회 → 효과 텍스트 삽입
    └─ prompt_builder.py → gemini_prompt.txt

[4] 메타 리포트 (Gemini MCP)
    └─ gemini_prompt.txt 전달 → 한국어 리포트 생성

[5] 결과 통합 (Claude → 사용자)
    └─ 리포트 + 차트 전달
```

---

## RAG 모듈 (`rag/`)

### 파일 구성
| 파일 | 역할 |
|------|------|
| `rag/pipeline.py` | 전체 파이프라인: TSV → enriched_data.json → gemini_prompt.txt |
| `rag/retriever.py` | CardRetriever: carddb_json → 카드명/코드 인덱스 |
| `rag/prompt_builder.py` | enriched_data → Gemini 프롬프트 문자열 |

### 실행
```bash
python3 rag/pipeline.py \
  --tsv data/개인전_v3.txt \
  --clusters data/analysis/deck_clusters.csv \
  --out output/$(date +%Y%m%d)
```

### 출력 (output/YYYYMMDD/)
| 파일 | 내용 |
|------|------|
| `analysis_data.json` | 클래스/아키타입 통계 |
| `enriched_data.json` | 카드 DB 효과 텍스트 포함 |
| `gemini_prompt.txt` | Gemini 전달용 최종 프롬프트 |

### 현재 RAG 한계 및 개선 방향
- 아키타입 대표 카드(TF-IDF 상위 5장)만 효과 삽입 → 채용률 상위 카드 전체로 확대 필요
- clusters 없으면 아키타입 enrichment 미동작 → 채용률 기반 fallback 구현 예정
- `effect[:200]` truncate → 전체 효과 삽입으로 개선 예정

---

## 오류 처리

| 상황 | 대응 |
|------|------|
| Playwright 스크래핑 실패 | 3회 재시도 후 부분 데이터로 진행 |
| 덱코드 페이지 없음 | 해당 레코드 `카드` 필드 null |
| normalize_cards 미등록 코드 | 원래 코드 그대로 유지 후 경고 출력 |
| Codex 코드 오류 | 오류 메시지 포함 재요청 |
| Gemini 응답 불완전 | enriched_data 재전달 후 재요청 |
| API rate limit | 요청 간 1~2초 딜레이 추가 |
| 룰 판정 불확실 | Layer 2 원문 확인 후 답변. 추측 금지 |

---

## 분석 목표 KPI

- [ ] 클래스별 1위 점유율 (상위 3개 클래스)
- [ ] 클래스별 Top 8 진출률
- [ ] 대회 규모(참가자 수)별 메타 차이
- [ ] 주간 메타 변화 추이

---

## 주의사항

- bushi-navi.com은 **Next.js SPA + CloudFront WAF** → Python Playwright 필수 (requests 직접 호출 불가)
- 스크래핑 시 **과도한 요청 금지** → decklog 페이지당 1.5초 딜레이 준수
- 카드 DB 클릭 후 **1500ms 이상** 대기 (부족 시 클래스 매핑 누락)
- 데이터는 **개인 분석 목적**으로만 사용
- `data/개인전_v3.txt` 가 현재 기준 데이터 파일 (8컬럼 TSV)
