# RAG 개선 플랜

> 목표: 카드 텍스트 조회를 넘어, **룰 해석 + 아키타입 문맥 + 플레이 감각**까지 설명할 수 있는 에이전트 구축
>
> 전략: 파인튜닝 없이 **RAG 3계층 구조** (카드/룰/아키타입) + 예시 계층으로 해결

---

## 현재 상태

| 계층 | 파일 | 상태 |
|------|------|------|
| 카드 DB | `data/carddb_json/*.json` | ✅ 완료 (49세트) |
| 룰 원문 | `docs/rules/*.md` | ✅ 완료 (MD 형식) |
| 룰 청크 | `data/rules_chunks.jsonl` | ❌ 미구현 |
| 아키타입 스키마 | `docs/ARCHETYPES_SCHEMA.md` | ✅ 완료 |
| 아키타입 실제 파일 | `data/archetypes/*.yaml` | ❌ 미작성 |
| 예시 QA | `data/examples/*.md` | ❌ 미작성 |
| Query Router | `rag/` | ❌ 미구현 (단일 파이프라인만 존재) |

---

## Phase 1: 룰 청크화 — `rules_chunks.jsonl` 생성

**목표**: `docs/rules/*.md` → 검색 가능한 청크 단위로 변환

**입력**: `docs/rules/*.md` (17개 파일)

**출력**: `data/rules_chunks.jsonl`

### 청크 단위 설계

```jsonl
{
  "id": "r_10_002",
  "source": "docs/rules/10_play_resolve.md",
  "section": "능력/효과/체크 타이밍",
  "subsection": "자동 능력 처리 순서",
  "text": "...(원문 단락)...",
  "keywords": ["자동 능력", "체크 타이밍", "대기"],
  "related_rules": ["r_11_001"]
}
```

### 청크 분할 기준
- 제목 레벨(`##`, `###`) 기준으로 분할
- 최대 500자 / 단락 의미 단위 우선
- 테이블은 단일 청크로 유지

### 구현 위치
`scripts/build_rules_chunks.py`

### 검색 방식
초기: 키워드 매칭 (BM25) → 이후: 벡터 검색으로 교체 가능

---

## Phase 2: 아키타입 YAML 작성

**목표**: 각 아키타입에 대한 전략적 설명 문서 작성
**스키마**: `docs/ARCHETYPES_SCHEMA.md` 참조
**저장 위치**: `data/archetypes/{class}_{archetype_id}.yaml`

### 우선 작성 대상 (현재 메타 기준)

현재 `data/analysis/deck_clusters.csv` 기준 주요 아키타입:

| 클래스 | 아키타입 | 파일명 |
|--------|---------|--------|
| エルフ | 콤보 엘프 | `elf_combo.yaml` |
| エルフ | 도쿄 엘프 | `elf_tokyo.yaml` |
| ロイヤル | 도쿄 로얄 | `royal_tokyo.yaml` |
| ロイヤル | 약탈 로얄 | `royal_plunder.yaml` |
| ドラゴン | 7코스트 드래곤 | `dragon_7cost.yaml` |
| ドラゴン | 램프 드래곤 | `dragon_ramp.yaml` |
| ナイトメア | 묘지 나이트메어 | `nightmare_graveyard.yaml` |
| ビショップ | 기계 비숍 | `bishop_machine.yaml` |

### 작성 원칙 (GPT 논의 기반)
- 카드 원문은 적지 않는다 → `cards.json`에서 조회
- "왜 이 카드가 이 덱의 핵심인가"를 1~2문장으로 적는다
- 전 카드 글로벌 역할 태깅 대신, **아키타입 내부 로컬 태깅**만 한다
- 통계가 없으면 `confidence: low`로 표시한다

### YAML 예시 (일부)

```yaml
id: elf_combo
display_name: 콤보 엘프
class: エルフ
status: stable
one_liner: >
  저코스트 카드를 연속 플레이해 콤보 조건을 빠르게 충족하고,
  콤보 페이오프로 필드를 장악하거나 직접 데미지로 마무리한다.

gameplan:
  early: 1~2코스트 카드로 콤보 카운트를 쌓으며 손패를 얇게 유지
  mid: 콤보 N 조건을 충족하는 턴에 복수 효과를 동시 기폭
  late: 진화 타이밍을 아껴두었다가 콤보 페이오프와 연계해 마무리

core_cards:
  - card_name: (대표 카드명)
    local_roles: [engine, extender]
    why_it_matters: >
      1코스트로 2장 플레이 효과를 주어 같은 턴 콤보 카운트를 +2 올린다.
      콤보 페이오프와 같은 턴에 낼 수 있어 핵심 브릿지 역할을 한다.
```

---

## Phase 3: 예시 QA 작성 — `data/examples/`

**목표**: 에이전트의 답변 톤과 판단 프레임을 학습시킬 예시 20~50개

**형식**: `data/examples/{클래스}_{주제}.md`

### 예시 유형

| 유형 | 예시 질문 |
|------|---------|
| 카드 역할 설명 | "왜 A카드는 콤보 엘프에서 3장 고정인가?" |
| 시너지 설명 | "A카드와 B카드 조합이 왜 강한가?" |
| 비채용 카드 설명 | "텍스트상 좋아 보이는데 왜 잘 안 쓰는가?" |
| 매치업 | "나이트메어 상대로 이 덱의 플랜은?" |
| 운영 판단 | "이 덱은 왜 초반 필드보다 손패 자원을 우선하는가?" |

### 답변 형식 원칙
1. **카드 사실** → 카드 텍스트/스탯 근거
2. **룰 해석** → 룰북 근거 (필요 시)
3. **아키타입 문맥** → 덱 안에서의 역할
4. **불확실성 표시** → 통계 없으면 "운영 가설"로 표기

---

## Phase 4: RAG 파이프라인 개선 — `rag/` 수정

### 현재 파이프라인 한계
- `rag/retriever.py`: 카드 DB 조회만 지원
- `rag/pipeline.py`: 클러스터링 통계 기반 단일 경로
- 룰 청크 검색 없음
- 아키타입 YAML 조회 없음
- 질문 유형 라우팅 없음

### 목표 구조

```
rag/
├── retriever.py          # (기존) 카드 DB 조회
├── rule_retriever.py     # (신규) rules_chunks.jsonl BM25 검색
├── archetype_retriever.py # (신규) archetypes/*.yaml 조회
├── router.py             # (신규) 질문 유형 분류 → 조회 경로 결정
├── prompt_builder.py     # (기존 + 개선) 3계층 결과 통합 → 프롬프트
└── pipeline.py           # (개선) 메타 리포트용 배치 파이프라인 유지
```

### `router.py` 분류 기준

```python
# 질문 유형 분류 (키워드 기반 → 추후 LLM 분류로 교체 가능)
CARD_LOOKUP_KEYWORDS = ["찾아줘", "코스트", "효과", "스탯", "뭐 하는"]
RULE_KEYWORDS = ["룰", "타이밍", "판정", "처리", "언제", "어떻게 되나"]
META_KEYWORDS = ["왜", "시너지", "조합", "채용", "덱", "아키타입", "강한가", "약한가"]
```

### `prompt_builder.py` 개선 방향

현재: 클러스터링 통계 + TF-IDF 상위 5장 효과만 삽입
목표:
- 채용률 상위 카드 **전체** 효과 텍스트 삽입 (`effect[:200]` 제거)
- 해당 클래스 아키타입 YAML의 `one_liner` + `gameplan` 삽입
- 관련 룰 청크 삽입 (메타 키워드 기반 검색)

---

## Phase 5: 장기 개선 (선택)

우선순위 낮음 — 핵심 3계층 완성 후 검토

| 항목 | 내용 |
|------|------|
| 벡터 검색 | BM25 → embedding 기반 유사도 검색으로 교체 |
| rules_chunks 자동 업데이트 | 룰북 버전 변경 시 자동 재청크화 |
| 아키타입 자동 갱신 | 대회 데이터 기반 핵심 카드 변화 감지 |
| 트리오 전용 리포트 | `data/트리오.txt` 기반 별도 파이프라인 |

---

## 작업 순서 요약

```
[1] scripts/build_rules_chunks.py 작성 → data/rules_chunks.jsonl 생성
[2] data/archetypes/*.yaml 작성 (주요 8개 아키타입)
[3] data/examples/*.md 작성 (20개 이상)
[4] rag/rule_retriever.py 구현
[5] rag/archetype_retriever.py 구현
[6] rag/router.py 구현
[7] rag/prompt_builder.py 개선 (effect truncate 제거, 아키타입/룰 삽입)
[8] 통합 테스트
```
