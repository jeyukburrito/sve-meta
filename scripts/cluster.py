import argparse
import ast
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.cluster.hierarchy import fcluster, linkage
from scipy.spatial.distance import pdist
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from scripts.normalize_cards import load_carddb_by_code
except ImportError:
    from normalize_cards import load_carddb_by_code


INPUT_PATH = Path("/home/oo/work/sve_meta/data/개인전_v2.txt")
OUTPUT_PATH = Path("/home/oo/work/sve_meta/data/analysis/deck_clusters.csv")
CARDDB_DIR = Path("/home/oo/work/sve_meta/data/carddb_json")

def represent_archetype(decklist_group):
    if not decklist_group:
        return {}

    card_totals = defaultdict(float)
    for decklist in decklist_group:
        for card_name, count in decklist.items():
            card_totals[card_name] += float(count)

    deck_count = len(decklist_group)
    return {card_name: total / deck_count for card_name, total in card_totals.items()}

def archetype_categorize_recursive(classe, decklists, threshold=5.0):
    print(classe, threshold)
    if len(decklists) <= 1:
        return np.array([1] * len(decklists), dtype=object)

    vectorize = DictVectorizer(sparse=False)
    vectorized = vectorize.fit_transform(decklists)
    cosine_sim_matrix = cosine_similarity(vectorized)
    distance_matrix = 1 - cosine_sim_matrix
    condensed_distance_matrix = pdist(distance_matrix)
    Z = linkage(condensed_distance_matrix, method='ward')

    clusters = fcluster(Z, t=threshold, criterion='distance')
    cluster_card_lists = {}

    for index, cluster in enumerate(clusters):
        if cluster not in cluster_card_lists:
            cluster_card_lists[cluster] = []
        cluster_card_lists[cluster].append(decklists[index])

    new_clusters = clusters.copy()
    clusters_to_split = []

    for cluster, decklist_group in cluster_card_lists.items():
        avg_values = represent_archetype(decklist_group)
        max_average_value = max(avg_values.values(), default=0)

        indices_to_split = [i for i, c in enumerate(clusters) if c == cluster]
        sub_decklists = [decklists[i] for i in indices_to_split]

        distance_max = 0.0
        global_max_distance = 0.0

        if sub_decklists:
            mask = np.array([c == cluster for c in clusters])
            sub_distance_matrix = distance_matrix[mask][:, mask]

            global_max_distance = np.max(distance_matrix)
            if global_max_distance > 0:
                normalized_sub_distance_matrix = sub_distance_matrix / global_max_distance
            else:
                normalized_sub_distance_matrix = np.zeros_like(sub_distance_matrix)
            distance_max = np.max(normalized_sub_distance_matrix)

        print('c', classe, max_average_value, distance_max, global_max_distance)
        if max_average_value < 2.8 or (distance_max > 0.8 and global_max_distance > 0.81):
            clusters_to_split.append(cluster)

    if not clusters_to_split:
        return new_clusters

    for cluster in clusters_to_split:
        indices_to_split = [i for i, c in enumerate(clusters) if c == cluster]
        sub_decklists = [decklists[i] for i in indices_to_split]

        if sub_decklists:
            mask = np.array([c == cluster for c in clusters])
            sub_distance_matrix = distance_matrix[mask][:, mask]

            global_max_distance = np.max(distance_matrix)
            if global_max_distance > 0:
                normalized_sub_distance_matrix = sub_distance_matrix / global_max_distance
            else:
                normalized_sub_distance_matrix = np.zeros_like(sub_distance_matrix)
            new_threshold = np.max(normalized_sub_distance_matrix) * threshold if len(normalized_sub_distance_matrix) > 1 > np.max(normalized_sub_distance_matrix) else threshold * 0.5

            sub_clusters = archetype_categorize_recursive(classe, sub_decklists, new_threshold)

            for i, sub_cluster in enumerate(sub_clusters):
                new_clusters[indices_to_split[i]] = f'{cluster}_{sub_cluster}'

    return new_clusters


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
            result_rows.append(
                {
                    "직업": row["직업"],
                    "덱코드": row["덱코드"],
                    "대회코드": row["대회코드"],
                    "아키타입ID": label_to_id[cluster_label],
                    "아키타입명(대표카드 top5)": cluster_meta[cluster_label]["name"],
                }
            )

        class_summaries.append((classe, ordered_labels, cluster_meta))

    result_df = pd.DataFrame(
        result_rows,
        columns=["직업", "덱코드", "대회코드", "아키타입ID", "아키타입명(대표카드 top5)"],
    )
    result_df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    total_archetypes = sum(len(labels) for _, labels, _ in class_summaries)
    print(f"\n저장 완료: {OUTPUT_PATH} (rows={len(result_df)})")
    print(f"총 클러스터 수: {total_archetypes}")
    print("\n직업별 아키타입 수")
    for classe, ordered_labels, _ in class_summaries:
        print(f"- {classe}: {len(ordered_labels)}")


if __name__ == "__main__":
    main()
