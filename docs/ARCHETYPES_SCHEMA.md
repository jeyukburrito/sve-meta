# archetypes.yaml Schema

아래 스키마는 **실전 로그/대회 통계가 없어도** 사람이 직접 유지할 수 있는 수준의 구조를 목표로 한다.

```yaml
version: 1

role_vocab:
  - interaction
  - removal
  - tempo_disruptor
  - engine
  - payoff
  - finisher
  - stabilizer
  - extender
  - tutor
  - graveyard_enabler
  - graveyard_payoff_support
  - evo_target
  - defensive_trick
  - reach

archetypes:
  - id: string
    display_name: string
    class: string
    status: experimental | stable
    one_liner: string

    gameplan:
      early: string
      mid: string
      late: string

    win_conditions:
      - string

    lose_conditions:
      - string

    mulligan:
      keep:
        - string
      conditional_keep:
        - card_name: string
          when: string
      toss:
        - string

    core_cards:
      - card_name: string
        quantity_note: string
        local_roles:
          - string
        why_it_matters: string
        usage_notes:
          - string
        combo_with:
          - string
        anti_synergy_with:
          - string
        conditions:
          - string
        replacement_if_missing:
          - string

    synergy_packages:
      - package_name: string
        summary: string
        cards:
          - string
        sequence_example:
          - string
        payoff: string

    play_patterns:
      - name: string
        when_to_use: string
        how_it_works: string
        risk: string

    weaknesses:
      - string

    common_mistakes:
      - string

    matchup_notes:
      - versus: string
        plan: string
        key_cards:
          - string

    retrieval_hints:
      keywords:
        - string
      tags:
        - string

    confidence:
      level: low | medium | high
      note: string
```

---

## 설계 의도

### role_vocab
전 카드 글로벌 태깅이 아니라, **아키타입 내부 local role**에 쓰기 위한 최소 어휘다.

### gameplan
초/중/후반 운영의 큰 흐름을 자연어로 남긴다.

### core_cards
핵심 카드와 그 이유를 적는다. 카드 원문 전체를 중복 저장하지 않고, **왜 중요한지**만 적는다.

### synergy_packages
카드 조합을 묶어서 설명한다. 메타 해석의 핵심 단위다.

### play_patterns
실제 플레이 감각을 자연어로 넣는 영역이다.

### confidence
통계가 아닌 운영 가설일 수 있으므로 확신도를 함께 남긴다.

---

## 작성 원칙

1. 카드 텍스트 원문은 `cards.json`에 두고, 여기선 문맥만 적는다.
2. 카드 단독 평가보다 덱 안 역할을 적는다.
3. 확신이 낮으면 `confidence`에 표시한다.
4. 통계가 없는 상태에서는 "자주 쓰인다" 같은 단정 표현을 피한다.
