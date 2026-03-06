# Agent Architecture Guide

## 목표
카드 DB 조회, 룰 해석, 아키타입 설명을 분리해서 처리하는 하이브리드 구조를 설계한다.

---

## 1. 전체 구조

```text
User Query
  -> Query Router
      -> Card Retrieval (`cards.json` / SQLite)
      -> Rule Retrieval (`rules_chunks.jsonl` / BM25 or vector)
      -> Archetype Retrieval (`archetypes.yaml`)
      -> Example Retrieval (`examples/*.md`)
  -> LLM Synthesis
  -> Answer with evidence + uncertainty
```

---

## 2. Query Router 규칙

### A. 조회형
예:
- 나이트메어 1코 스펠 보여줘
- Quick 카드만 찾아줘
- 특정 카드명 검색

처리:
- `cards.json` 우선
- 필요 시 카드 raw_text 그대로 전달

### B. 룰 해석형
예:
- 이 카드는 언제 선택하나요?
- 소멸은 묘지로 가나요?
- Quick로 언제 낼 수 있나요?

처리:
- `rules_chunks.jsonl` 우선
- 카드 텍스트와 함께 합성

### C. 메타/시너지형
예:
- 왜 이 카드가 이 덱에서 좋아?
- 이 카드 조합은 왜 강해?
- 텍스트상 시너지와 실전 시너지 차이는?

처리:
- `archetypes.yaml` 우선
- `cards.json` 보조
- 룰이 연관되면 `rules_chunks.jsonl`도 같이 사용
- 설명 스타일은 `examples/*.md` 참고

---

## 3. 에이전트 답변 규칙

1. 카드 사실과 아키타입 해석을 분리해서 말할 것
2. 룰 관련 내용은 가능하면 룰 chunk를 근거로 말할 것
3. 통계가 없으면 메타를 단정하지 말 것
4. 실전성이 불확실하면 운영 가설이라고 표시할 것
5. 카드 단독 평가는 지양하고 아키타입 문맥에서 설명할 것

---

## 4. 실패 패턴

### 실패 패턴 1: 카드 텍스트만 보고 메타 단정
잘못된 예:
- "이 카드는 무조건 3장 채용됩니다."

문제:
- 실전 데이터/아키타입 문맥 없음

### 실패 패턴 2: 룰 없이 직감으로 처리
잘못된 예:
- "소멸도 묘지 취급일 가능성이 높습니다."

문제:
- 룰북에 명시된 영역 개념을 무시함

### 실패 패턴 3: 카드 역할을 고정 1개로만 봄
잘못된 예:
- "이 카드는 removal 카드입니다."

문제:
- 실제로는 덱/시점에 따라 interaction, tempo disruptor, payoff support가 동시에 가능

---

## 5. 현실적 구축 우선순위

필수:
- cards
- rules
- archetypes
- examples

선택:
- vector DB
- deck statistics
- tournament results
- replay parser

---

## 6. Minimal Prompt Policy

에이전트 system prompt 요약:

- 당신은 Shadowverse EVOLVE 분석 에이전트다.
- 카드 사실은 cards 데이터에서, 룰 해석은 rules 데이터에서, 덱 문맥은 archetypes 데이터에서 찾는다.
- 카드 단독으로 메타를 단정하지 않는다.
- 근거가 부족하면 추측이라고 밝힌다.
- 답변은 사실 / 룰 / 아키타입 해석 / 불확실성 순으로 정리한다.
