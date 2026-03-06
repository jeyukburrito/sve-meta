#!/usr/bin/env python3
import argparse
import ast
import re
from pathlib import Path

import pandas as pd

try:
    from tabulate import tabulate
except ImportError:
    def tabulate(rows, headers="keys", tablefmt=None, showindex=False):  # noqa: A001
        if isinstance(rows, pd.DataFrame):
            df = rows.copy()
        else:
            df = pd.DataFrame(rows)
        if headers == "keys":
            cols = list(df.columns)
        else:
            cols = list(headers)
            df = df[cols]
        str_df = df.astype(str)
        widths = [max(len(str(c)), *(len(v) for v in str_df[c].tolist())) for c in cols]
        sep = "-+-".join("-" * w for w in widths)
        head = " | ".join(str(c).ljust(w) for c, w in zip(cols, widths))
        body = [
            " | ".join(str(v).ljust(w) for v, w in zip(row, widths))
            for row in str_df[cols].itertuples(index=showindex, name=None)
        ]
        return "\n".join([head, sep, *body])


DEFAULT_TSV = Path("data/개인전_v2.txt")
DEFAULT_CLUSTERS = Path("data/analysis/deck_clusters.csv")
DEFAULT_OUTDIR = Path("data/analysis")


def sanitize_filename_component(value: object) -> str:
    text = str(value).strip()
    text = re.sub(r"[^\w\-]+", "_", text, flags=re.UNICODE)
    text = re.sub(r"_+", "_", text).strip("_")
    return text or "unknown"


def normalize_archetype_id(value: object):
    if value is None or pd.isna(value):
        return pd.NA
    text = str(value).strip()
    if not text:
        return pd.NA
    if re.fullmatch(r"\d+\.0+", text):
        return text.split(".", 1)[0]
    return text


def parse_card_dict(raw: object, evolve: bool = False) -> dict[str, int]:
    if isinstance(raw, dict):
        parsed = raw
    else:
        if raw is None or pd.isna(raw):
            return {}
        text = str(raw).strip()
        if not text or text.lower() == "nan":
            return {}
        try:
            parsed = ast.literal_eval(text)
        except (ValueError, SyntaxError):
            return {}
    if not isinstance(parsed, dict):
        return {}

    result: dict[str, int] = {}
    for card_name, count in parsed.items():
        if card_name is None or count is None:
            continue
        name = str(card_name).strip()
        if not name:
            continue
        if evolve and not name.startswith("(EV)"):
            name = f"(EV){name}"
        try:
            qty = int(float(count))
        except (TypeError, ValueError):
            continue
        if qty <= 0:
            continue
        result[name] = result.get(name, 0) + qty
    return result


def load_decks(tsv_path: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = pd.read_csv(tsv_path, sep="\t")
    required = ["직업", "덱코드", "대회코드", "카드"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"TSV에 필요한 컬럼이 없습니다: {missing}")

    deck_meta = df[["직업", "덱코드", "대회코드"]].copy()
    deck_meta["덱코드"] = deck_meta["덱코드"].astype(str)
    deck_meta["대회코드"] = deck_meta["대회코드"].astype(str)
    deck_meta["deck_id"] = range(len(deck_meta))

    card_rows: list[dict[str, object]] = []
    for idx, r in df.iterrows():
        main_cards = parse_card_dict(r.get("카드"), evolve=False)

        for name, qty in main_cards.items():
            card_rows.append({"deck_id": idx, "カード名": name, "count": qty})

    cards_long = pd.DataFrame(card_rows, columns=["deck_id", "カード名", "count"])
    return deck_meta, cards_long


def compute_stats(cards_long: pd.DataFrame, total_decks: int) -> pd.DataFrame:
    if total_decks <= 0:
        return pd.DataFrame(columns=["カード名", "枚数", "価値", "採用デッキ%"])

    if cards_long.empty:
        return pd.DataFrame(columns=["カード名", "枚数", "価値", "採用デッキ%"])

    grouped = (
        cards_long.groupby("カード名", as_index=False)
        .agg(採用デッキ数=("deck_id", "nunique"), 合計枚数=("count", "sum"))
        .copy()
    )
    grouped["adoption_rate"] = grouped["採用デッキ数"] / total_decks
    grouped["avg_copies_used"] = grouped["合計枚数"] / grouped["採用デッキ数"]
    grouped["avg_copies_all"] = grouped["合計枚数"] / total_decks
    grouped["value"] = grouped["avg_copies_all"] / 3.0

    grouped = grouped.sort_values(
        by=["value", "adoption_rate", "avg_copies_all", "カード名"],
        ascending=[False, False, False, True],
    )

    out = pd.DataFrame(
        {
            "カード名": grouped["カード名"],
            "枚数": grouped["avg_copies_all"].map(lambda x: f"{x:.2f}"),
            "価値": grouped["value"].round(6),
            "採用デッキ%": grouped["adoption_rate"].map(lambda x: f"{x * 100:.2f}%"),
        }
    )
    return out


def write_class_stats(
    deck_meta: pd.DataFrame,
    cards_long: pd.DataFrame,
    outdir: Path,
) -> None:
    for class_name in sorted(deck_meta["직업"].dropna().unique()):
        class_decks = deck_meta[deck_meta["직업"] == class_name]
        deck_ids = set(class_decks["deck_id"].tolist())
        class_cards = cards_long[cards_long["deck_id"].isin(deck_ids)]
        stats = compute_stats(class_cards, total_decks=len(class_decks))

        safe_class = sanitize_filename_component(class_name)
        out_path = outdir / f"card_stats_{safe_class}.csv"
        stats.to_csv(out_path, index=False, encoding="utf-8-sig")

        print(f"\n=== {class_name} (decks={len(class_decks)}) top 15 ===")
        print(tabulate(stats.head(15), headers="keys", tablefmt="github", showindex=False))


def write_archetype_stats(
    deck_meta: pd.DataFrame,
    cards_long: pd.DataFrame,
    clusters_path: Path,
    outdir: Path,
) -> None:
    clusters = pd.read_csv(clusters_path, dtype=str, keep_default_na=False)
    required = ["직업", "덱코드", "대회코드", "아키타입ID", "아키타입명(대표카드 top5)"]
    missing = [c for c in required if c not in clusters.columns]
    if missing:
        raise ValueError(f"cluster CSV에 필요한 컬럼이 없습니다: {missing}")

    clusters = clusters[required].copy()
    clusters["덱코드"] = clusters["덱코드"].astype(str)
    clusters["대회코드"] = clusters["대회코드"].astype(str)
    clusters["아키타입ID"] = clusters["아키타입ID"].map(normalize_archetype_id)

    dup_mask = clusters.duplicated(subset=["직업", "덱코드", "대회코드"], keep=False)
    if dup_mask.any():
        dup_count = int(dup_mask.sum())
        print(f"[WARN] deck_clusters.csv 중복 키 {dup_count}건 발견: 첫 행 기준으로 중복 제거")
        clusters = clusters.drop_duplicates(subset=["직업", "덱코드", "대회코드"], keep="first")

    merged = deck_meta.merge(
        clusters,
        on=["직업", "덱코드", "대회코드"],
        how="left",
        validate="m:1",
    )
    missing_cluster = int(merged["아키타입ID"].isna().sum())
    if missing_cluster:
        print(f"[WARN] 클러스터 미매칭 덱 {missing_cluster}건 (아키타입 통계에서 제외)")

    grouped = merged.dropna(subset=["아키타입ID"]).groupby(["직업", "아키타입ID"], sort=True)
    for (class_name, archetype_id), group in grouped:
        archetype_name = str(group["아키타입명(대표카드 top5)"].iloc[0])
        deck_ids = set(group["deck_id"].tolist())
        archetype_cards = cards_long[cards_long["deck_id"].isin(deck_ids)]
        stats = compute_stats(archetype_cards, total_decks=len(group))
        stats.insert(0, "아키타입명(대표카드 top5)", archetype_name)
        stats.insert(0, "아키타입ID", normalize_archetype_id(archetype_id))

        safe_class = sanitize_filename_component(class_name)
        safe_arch = sanitize_filename_component(normalize_archetype_id(archetype_id))
        out_path = outdir / f"card_stats_{safe_class}_archetype{safe_arch}.csv"
        stats.to_csv(out_path, index=False, encoding="utf-8-sig")


def main() -> None:
    parser = argparse.ArgumentParser(description="Calculate class/archetype card adoption stats.")
    parser.add_argument("--tsv", type=Path, default=DEFAULT_TSV)
    parser.add_argument("--clusters", type=Path, default=DEFAULT_CLUSTERS)
    parser.add_argument("--outdir", type=Path, default=DEFAULT_OUTDIR)
    args = parser.parse_args()

    args.outdir.mkdir(parents=True, exist_ok=True)

    deck_meta, cards_long = load_decks(args.tsv)
    print(f"Loaded decks: {len(deck_meta)} / card rows: {len(cards_long)}")

    write_class_stats(deck_meta, cards_long, args.outdir)
    write_archetype_stats(deck_meta, cards_long, args.clusters, args.outdir)
    print("\nDone.")


if __name__ == "__main__":
    main()
