import ast
import argparse
from pathlib import Path

import pandas as pd

try:
    from scripts.cluster import archetype_categorize_recursive, represent_archetype
except ImportError:
    from cluster import archetype_categorize_recursive, represent_archetype

try:
    from scripts.normalize_cards import load_carddb_by_code
except ImportError:
    from normalize_cards import load_carddb_by_code


INPUT_PATH = Path("/home/oo/work/sve_meta/data/개인전_v2.txt")
OUTPUT_PATH = Path("/home/oo/work/sve_meta/data/analysis/deck_clusters.csv")
CARDDB_DIR = Path("/home/oo/work/sve_meta/data/carddb_json")


def parse_card_dict(raw):
    if not isinstance(raw, str) or not raw.strip():
        return None

    try:
        parsed = ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return None

    if not isinstance(parsed, dict):
        return None

    normalized = {}
    for card_name, count in parsed.items():
        if card_name is None:
            continue
        try:
            normalized[str(card_name)] = float(count)
        except (TypeError, ValueError):
            continue

    return normalized or None


def top_cards_name(avg_counts, carddb_by_code, top_n=5):
    ordered = sorted(avg_counts.items(), key=lambda item: (-item[1], item[0]))
    names = []
    for card_code, _ in ordered[:top_n]:
        info = carddb_by_code.get(card_code)
        names.append(str(info.get("name", "")).strip() if info else card_code)
    return names


def main():
    parser = argparse.ArgumentParser(description="Cluster deck archetypes from tournament TSV.")
    parser.add_argument("--tsv", type=Path, default=INPUT_PATH)
    args = parser.parse_args()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    carddb_by_code = load_carddb_by_code(CARDDB_DIR)

    df = pd.read_csv(args.tsv, sep="\t", dtype=str, keep_default_na=False)
    df["parsed_cards"] = df["카드"].apply(parse_card_dict)
    df = df[df["parsed_cards"].notna()].copy()

    if df.empty:
        print("유효한 카드 데이터가 없습니다.")
        pd.DataFrame(
            columns=["직업", "덱코드", "대회코드", "아키타입ID", "아키타입명(대표카드 top5)"]
        ).to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")
        return

    result_rows = []
    class_summaries = []

    for classe, class_df in df.groupby("직업", sort=True):
        class_df = class_df.copy()
        deck_count = len(class_df)

        if deck_count < 3:
            print(f"[SKIP] {classe}: 덱 수 {deck_count} (<3)")
            continue

        decklists = class_df["parsed_cards"].tolist()
        raw_clusters = archetype_categorize_recursive(classe, decklists)
        class_df["_cluster_label"] = [str(label) for label in raw_clusters]

        cluster_meta = {}
        for cluster_label, cluster_df in class_df.groupby("_cluster_label", sort=False):
            avg_counts = represent_archetype(cluster_df["parsed_cards"].tolist())
            rep_cards = top_cards_name(avg_counts, carddb_by_code, top_n=5)
            cluster_meta[cluster_label] = {
                "size": len(cluster_df),
                "rep_cards": rep_cards,
                "name": " / ".join(rep_cards),
            }

        ordered_labels = sorted(
            cluster_meta.keys(),
            key=lambda label: (-cluster_meta[label]["size"], label),
        )
        label_to_id = {label: i + 1 for i, label in enumerate(ordered_labels)}

        for _, row in class_df.iterrows():
            cluster_label = row["_cluster_label"]
            archetype_id = label_to_id[cluster_label]
            result_rows.append(
                {
                    "직업": row["직업"],
                    "덱코드": row["덱코드"],
                    "대회코드": row["대회코드"],
                    "아키타입ID": archetype_id,
                    "아키타입명(대표카드 top5)": cluster_meta[cluster_label]["name"],
                }
            )

        class_summaries.append((classe, ordered_labels, cluster_meta))

    result_df = pd.DataFrame(
        result_rows,
        columns=["직업", "덱코드", "대회코드", "아키타입ID", "아키타입명(대표카드 top5)"],
    )
    result_df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print(f"\n저장 완료: {OUTPUT_PATH} (rows={len(result_df)})")
    print("\n직업별 아키타입 요약")
    for classe, ordered_labels, cluster_meta in class_summaries:
        print(f"- {classe}: {len(ordered_labels)}개 아키타입")
        for label in ordered_labels:
            meta = cluster_meta[label]
            archetype_id = ordered_labels.index(label) + 1
            rep = ", ".join(meta["rep_cards"])
            print(f"  - ID {archetype_id}: {meta['size']}덱 | {rep}")


if __name__ == "__main__":
    main()
