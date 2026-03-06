"""
PromptBuilder: 분석 결과(enriched_data.json)를 Gemini 메타 리포트 프롬프트로 변환한다.
"""
from __future__ import annotations

import json
from pathlib import Path


def _pct(v: float) -> str:
    return f"{v * 100:.1f}%"


def _format_card(card: dict) -> str:
    code = card.get("code", "?")
    if card.get("missing"):
        return f"- {code} (DB 미등록)"

    cost = card.get("cost", "-")
    card_type = card.get("card_type", "-")
    atk = str(card.get("attack", "-")).strip()
    hp = str(card.get("hp", "-")).strip()
    stats = f" {atk}/{hp}" if atk not in ("", "-") and hp not in ("", "-") else ""
    effect = (card.get("effect") or "").strip().replace("\n", " ")
    return (
        f"- [{cost}pp {card_type}{stats}] {code} {card.get('name', '?')}\n"
        f"  효과: {effect}"
    )


def _card_section(title: str, cards: list[dict]) -> list[str]:
    lines = [f"**{title}:**"]
    if not cards:
        lines.append("- 해당 없음")
        return lines
    for card in cards:
        lines.append(_format_card(card))
        lines.append("")
    if lines[-1] == "":
        lines.pop()
    return lines


def build_report_prompt(enriched: dict) -> str:
    """
    enriched_data.json 구조를 받아 Gemini 프롬프트 문자열을 반환한다.
    """
    meta = enriched.get("meta", {})
    date_range = meta.get("date_range", "불명")
    total_decks = meta.get("total_decks", 0)
    total_tournaments = meta.get("total_tournaments", 0)

    class_stats: dict[str, dict] = enriched.get("class_stats", {})
    archetypes: list[dict] = enriched.get("archetypes", [])
    top_cards: list[dict] = enriched.get("top_cards_overall", [])
    trend_diff: dict = enriched.get("trend_diff", {})

    lines: list[str] = [
        "당신은 섀도우버스 이볼브(Shadowverse Evolve) 메타 애널리스트입니다.",
        "아래 데이터를 바탕으로 '이볼브 통계국' 스타일의 한국어 주간 메타 리포트를 작성하세요.",
        "카드명·키워드는 일본어 원문 표기를 유지하고, 카드 효과 텍스트를 직접 참고하여 분석하세요.",
        "",
        "## 분석 기간",
        f"- 기간: {date_range}",
        f"- 집계 대회 수: {total_tournaments}건",
        f"- 집계 덱 수: {total_decks}건 (TOP8 기준)",
        "",
        "## 클래스별 성적",
    ]

    sorted_classes = sorted(
        class_stats.items(),
        key=lambda x: x[1].get("win_count", 0),
        reverse=True,
    )
    for cls, st in sorted_classes:
        lines.append(
            f"- **{cls}**: 우승 {st.get('win_count', 0)}회 ({_pct(st.get('win_rate', 0.0))}) "
            f"/ TOP8 진출 {st.get('top8_count', 0)}회 ({_pct(st.get('top8_rate', 0.0))})"
        )
    lines.append("")

    lines.append("## 아키타입별 카드 구성")
    for arch in archetypes:
        arch_name = arch.get("archetype_name", "(미분류)")
        cls = arch.get("class", "")
        deck_n = arch.get("deck_count", 0)
        win_n = arch.get("win_count", 0)
        top8_r = arch.get("top8_rate", 0.0)
        fixed_cards = arch.get("fixed_cards_enriched", [])
        high_cards = arch.get("high_adoption_enriched", [])

        lines += [
            f"### {cls} - {arch_name} (TOP8 {deck_n}건 / 우승 {win_n}회 / TOP8 쉐어 {_pct(top8_r)})",
        ]
        if arch.get("fallback_used"):
            lines.append("- 클러스터 매칭이 없어 클래스별 TOP8 채용률 상위 카드로 fallback 구성됨.")
        lines += _card_section("고정 채용 카드 (100%)", fixed_cards)
        lines.append("")
        lines += _card_section("준고정 채용 카드 (90%+)", high_cards)
        lines.append("")

    if top_cards:
        lines += ["## inTOP8 카드 채용 상위 (전 클래스 합산)"]
        for i, card in enumerate(top_cards[:20], 1):
            effect = (card.get("effect") or "").strip().replace("\n", " ")
            lines.append(
                f"{i:2d}. {card.get('name', '?')} ({card.get('code', '?')}) "
                f"- 채용률 {card.get('adoption_pct', '')} / 평균 {card.get('avg_copies', '')}장 "
                f"/ {card.get('cost', '-')}pp {card.get('card_type', '-')}"
            )
            lines.append(f"    효과: {effect}")
        lines.append("")

    if trend_diff:
        lines += ["## 전주 대비 변화"]
        for item in trend_diff.get("archetype_changes", []):
            sign = "+" if item["delta"] >= 0 else ""
            lines.append(f"- {item['class']} {item['archetype']}: {sign}{item['delta']:.1f}%p")
        lines.append("")

    # 클래스별 아키타입 목록을 지시문에 명시
    arch_by_class: dict[str, list[str]] = {}
    for arch in archetypes:
        cls = arch.get("class", "기타")
        name = arch.get("archetype_name", "?")
        arch_by_class.setdefault(cls, []).append(name)

    lines += [
        "---",
        "## 리포트 작성 지시",
        "",
        "위 데이터를 바탕으로 아래 형식으로 한국어 리포트를 작성하세요.",
        "**중요: 모든 클래스의 모든 아키타입을 빠짐없이 리뷰해야 합니다.**",
        "카드 효과 텍스트를 직접 참고하여 분석하고, 카드명·키워드는 일본어 원문을 유지하세요.",
        "",
        "### 출력 형식",
        "",
        "**1. 이번 주 메타 개요** (3~4문장: CP04 등장 이후 메타 흐름, 티어 구도 요약)",
        "",
        "**2. 클래스별 성적표** (표 형식, 우승 횟수 내림차순)",
        "",
        "**3. 아키타입 전체 리뷰**",
        "아래 모든 클래스와 아키타입을 순서대로 리뷰하세요.",
        "",
        "**헤더 형식 (반드시 이 형식 준수):**",
        "  `### [クラス名] 한국어아키타입명 (대표카드1 / 대표카드2 / 대표카드3)`",
        "  - 한국어 아키타입명은 덱의 핵심 전략이나 테마를 직관적으로 표현하는 2~5글자 한국어 이름",
        "  - 예시: 스펠 프리코네, 콤보 엘프, 묘지 나이트메어, 기계 비숍, 7코스트 드래곤, 램프 드래곤,",
        "          도쿄 로얄, 약탈 로얄, 연악 로얄, 천사 로얄, 도쿄 엘프, 요정 엘프, 박쥐 나이트메어 등",
        "  - 영어 또는 일본어 아키타입명만 사용 금지. 반드시 한국어 이름을 붙일 것.",
        "",
        "각 아키타입은 다음 소항목으로 작성:",
        "  - **티어**: 1티어 / 2티어 / 3티어 / 비주류 중 하나 (성적·점유율 기준)",
        "  - **전략 개요**: 고정/준고정 카드 효과를 직접 인용하여 핵심 플레이 패턴과 승리 플랜 설명 (3~5문장)",
        "  - **주목 포인트**: 이번 주 특이사항, 채용 트렌드, 카운터 전략 (1~2문장)",
        "",
        "리뷰 대상 아키타입 목록 (반드시 전부 포함):",
    ]
    for cls, names in arch_by_class.items():
        lines.append(f"- **{cls}**: " + " / ".join(names))

    lines += [
        "",
        "**4. TOP8 전체 카드 채용 상위 Top 10** (표 형식: 순위, 카드명, 채용률, 평균 장수, 한줄 효과 요약)",
        "",
        "**5. 총평 & 다음 주 전망** (4~5문장: 지배적 전략 총정리, 주목할 변화, 메타 예측)",
        "",
        "분량: 2500~4000자. 전문적이고 구체적으로 작성하세요.",
        "덱 수가 1건인 소수 아키타입도 간략하게나마 반드시 언급하세요.",
    ]

    return "\n".join(lines)


def load_enriched_and_build(enriched_path: Path) -> str:
    with open(enriched_path, encoding="utf-8") as f:
        enriched = json.load(f)
    return build_report_prompt(enriched)
