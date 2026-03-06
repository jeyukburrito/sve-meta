#!/usr/bin/env python3
from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pandas as pd


CARD_COLUMNS = ["날짜", "직업", "등수", "참가자", "덱코드", "대회코드", "카드"]


def load_carddb_by_code(carddb_dir: Path) -> dict[str, dict]:
    """card_code → card_info 딕셔너리 반환"""
    carddb_by_code: dict[str, dict] = {}
    for path in sorted(carddb_dir.glob("*.json")):
        if "Zone.Identifier" in path.name:
            continue
        rows = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            card_code = str(row.get("card_code", "")).strip()
            if not card_code:
                continue
            carddb_by_code[card_code] = row
    return carddb_by_code


def code_priority(card_code: str) -> int:
    # 베이스 카드 (접미사가 순수 숫자) 우선, 변형·프로모는 후순위
    # 1: BP 베이스 (BP01-001)
    if re.fullmatch(r"BP\d\d-\d+", card_code):
        return 1
    # 2: EBD/ETD 베이스 엑스트라 부스터
    if re.fullmatch(r"(?:EBD|ETD)\d+-\d+", card_code):
        return 2
    # 3: CP/ECP 베이스 (콜라보 팩)
    if re.fullmatch(r"(?:ECP|CP)\d+-\d+", card_code):
        return 3
    # 4: SP 베이스 (SP01-001)
    if re.fullmatch(r"SP\d+-\d+", card_code):
        return 4
    # 5: SD 베이스 스타터
    if re.fullmatch(r"SD\d+-\d+", card_code):
        return 5
    # 6: BP 변형 (SL, P, U, SP 등 – BP\d\d-[알파벳]+\d+)
    if re.fullmatch(r"BP\d\d-[A-Z]+\d+", card_code):
        return 6
    # 7: CP/ECP/SP 변형 (CP02-P01 등)
    if re.fullmatch(r"(?:ECP|CP|SP)\d+-[A-Z]+\d+", card_code):
        return 7
    # 8: PR (프로모)
    if re.fullmatch(r"PR-\d+", card_code):
        return 8
    return 9


def natural_code_key(card_code: str) -> tuple:
    tokens = re.findall(r"\d+|[A-Za-z]+|[^A-Za-z\d]+", card_code)
    normalized = []
    for token in tokens:
        if token.isdigit():
            normalized.append((0, int(token)))
        elif token.isalpha():
            normalized.append((1, token.upper()))
        else:
            normalized.append((2, token))
    return (code_priority(card_code), tuple(normalized), card_code)


def signature_for_card(card_info: dict) -> tuple[str, str, str]:
    return (
        str(card_info.get("class", "")).strip(),
        str(card_info.get("cost", "")).strip(),
        str(card_info.get("effect", "")).strip(),
    )


def build_canonical_map(carddb_dir: Path) -> dict[str, str]:
    """
    card_code → canonical_card_code 매핑 딕셔너리 반환.
    예: 'PR-339' → 'BP01-120' (같은 class+cost+effect)
    """
    carddb_by_code = load_carddb_by_code(carddb_dir)
    grouped: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    for card_code, card_info in carddb_by_code.items():
        grouped[signature_for_card(card_info)].append(card_code)

    canonical_map: dict[str, str] = {}
    for codes in grouped.values():
        canonical_code = sorted(codes, key=natural_code_key)[0]
        for code in codes:
            canonical_map[code] = canonical_code
    return canonical_map


def normalize_deck(card_codes: dict[str, int], canonical_map: dict[str, str]) -> dict[str, int]:
    """
    {card_code: count} → {canonical_code: count} 변환.
    canonical_map에 없는 코드는 그대로 유지.
    같은 canonical로 합산: {'BP01-009': 2, 'PR-088': 1} → {'BP01-009': 3}
    """
    normalized: dict[str, int] = {}
    for card_code, count in card_codes.items():
        target_code = canonical_map.get(card_code, card_code)
        normalized[target_code] = normalized.get(target_code, 0) + int(count)
    return dict(sorted(normalized.items(), key=lambda item: natural_code_key(item[0])))


def build_name_to_canonical_map(
    carddb_by_code: dict[str, dict],
    canonical_map: dict[str, str],
) -> dict[str, str]:
    grouped: dict[str, set[str]] = defaultdict(set)
    for card_code, card_info in carddb_by_code.items():
        name = str(card_info.get("name", "")).strip()
        if not name:
            continue
        grouped[name].add(canonical_map.get(card_code, card_code))

    result: dict[str, str] = {}
    for name, canonical_codes in grouped.items():
        result[name] = sorted(canonical_codes, key=natural_code_key)[0]
    return result


def parse_card_dict(value: object) -> dict[str, int]:
    if isinstance(value, dict):
        parsed = value
    else:
        if value is None or pd.isna(value):
            return {}
        text = str(value).strip()
        if not text:
            return {}
        parsed = ast.literal_eval(text)
    if not isinstance(parsed, dict):
        return {}

    result: dict[str, int] = {}
    for card, count in parsed.items():
        key = str(card).strip()
        if not key:
            continue
        qty = int(count)
        if qty <= 0:
            continue
        result[key] = result.get(key, 0) + qty
    return result


def migrate_individual_file(
    input_path: Path,
    output_path: Path,
    carddb_dir: Path,
) -> list[str]:
    carddb_by_code = load_carddb_by_code(carddb_dir)
    canonical_map = build_canonical_map(carddb_dir)
    name_to_canonical = build_name_to_canonical_map(carddb_by_code, canonical_map)

    df = pd.read_csv(input_path, sep="\t", dtype=str, keep_default_na=False)
    missing_columns = [column for column in CARD_COLUMNS if column not in df.columns]
    if missing_columns:
        raise ValueError(f"입력 파일에 필요한 컬럼이 없습니다: {missing_columns}")

    unresolved_names: set[str] = set()
    normalized_cards: list[str] = []
    for raw_cards in df["카드"]:
        cards_by_name = parse_card_dict(raw_cards)
        cards_by_code: dict[str, int] = {}
        for card_name, count in cards_by_name.items():
            canonical_code = name_to_canonical.get(card_name)
            if canonical_code is None:
                unresolved_names.add(card_name)
                cards_by_code[card_name] = cards_by_code.get(card_name, 0) + count
                continue
            cards_by_code[canonical_code] = cards_by_code.get(canonical_code, 0) + count
        normalized_cards.append(repr(dict(sorted(cards_by_code.items(), key=lambda item: natural_code_key(item[0])))))

    out_df = df[CARD_COLUMNS].copy()
    out_df["카드"] = normalized_cards
    out_df.to_csv(output_path, sep="\t", index=False, encoding="utf-8")
    return sorted(unresolved_names)


def run_self_test(carddb_dir: Path) -> int:
    carddb_by_code = load_carddb_by_code(carddb_dir)
    canonical_map = build_canonical_map(carddb_dir)

    if not carddb_by_code:
        print("[FAIL] 카드 DB를 로드하지 못했습니다.", file=sys.stderr)
        return 1

    expected_samples = {
        "PR-339": "BP07-116",   # BP 베이스로 귀결
        "PR-447": "BP17-113",   # BP 베이스로 귀결
        "PR-435": "CP02-006",   # CP 베이스로 귀결 (BP 없는 콜라보 카드)
    }
    status = 0
    for card_code, expected in expected_samples.items():
        actual = canonical_map.get(card_code)
        print(f"{card_code} -> {actual}")
        if actual != expected:
            print(f"[FAIL] {card_code} expected {expected}, got {actual}", file=sys.stderr)
            status = 1

    sample_deck = {"BP07-116": 2, "PR-339": 1, "PR-447": 3}
    normalized = normalize_deck(sample_deck, canonical_map)
    print(f"normalize_deck({sample_deck}) -> {normalized}")
    if normalized.get("BP07-116") != 3 or normalized.get("BP17-113") != 3:
        print("[FAIL] normalize_deck 집계 검증 실패", file=sys.stderr)
        status = 1

    if status == 0:
        print("[OK] self-test passed")
    return status


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize Shadowverse EVOLVE card codes.")
    parser.add_argument("--carddb-dir", type=Path, default=Path("data/carddb_json"))
    parser.add_argument("--input", type=Path, default=Path("개인전.txt"))
    parser.add_argument("--output", type=Path, default=Path("data/개인전_v2.txt"))
    parser.add_argument("--test", action="store_true", help="run self-test only")
    args = parser.parse_args()

    if args.test:
        return run_self_test(args.carddb_dir)

    unresolved_names = migrate_individual_file(
        input_path=args.input,
        output_path=args.output,
        carddb_dir=args.carddb_dir,
    )
    print(f"saved: {args.output}")
    if unresolved_names:
        print("미등록 카드명:")
        for name in unresolved_names:
            print(name)
    else:
        print("미등록 카드명 없음")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
