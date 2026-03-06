from __future__ import annotations
import japanize_matplotlib  # noqa: F401

import ast
import warnings
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.font_manager as fm
from matplotlib import ft2font
import matplotlib.pyplot as plt
import pandas as pd


BASE_DIR = Path("/home/oo/work/sve_meta")
TSV_PATH = BASE_DIR / "data/processed/개인전_20260221_20260223.tsv"
CLUSTER_PATH = BASE_DIR / "data/analysis/deck_clusters.csv"
OUT_DIR = BASE_DIR / "reports/charts"


def configure_matplotlib() -> str:
    warnings.filterwarnings("ignore", message=r"Glyph .* missing from font", category=UserWarning)

    preferred = [
        "IPAGothic",
        "IPAexGothic",
        "Noto Sans CJK JP",
        "Noto Sans JP",
        "Yu Gothic",
        "MS Gothic",
        "TakaoGothic",
    ]
    jp_codepoints = [ord("ア"), ord("日"), ord("ー")]
    font_paths_by_name: dict[str, list[str]] = {}
    for font in fm.fontManager.ttflist:
        font_paths_by_name.setdefault(font.name, []).append(font.fname)

    def supports_japanese(font_name: str) -> bool:
        for path in font_paths_by_name.get(font_name, []):
            try:
                cmap = ft2font.FT2Font(path).get_charmap()
            except Exception:
                continue
            if all(cp in cmap for cp in jp_codepoints):
                return True
        return False

    chosen = None
    for name in preferred:
        if supports_japanese(name):
            chosen = name
            break
    if chosen:
        plt.rcParams["font.family"] = chosen
    else:
        # Fallback for Korean UI labels if no Japanese-capable font exists.
        fallback_names = ["NanumGothic", "NanumBarunGothic", "DejaVu Sans"]
        available = {f.name for f in fm.fontManager.ttflist}
        for name in fallback_names:
            if name in available:
                plt.rcParams["font.family"] = name
                chosen = name
                break
        if not chosen:
            plt.rcParams["font.family"] = "sans-serif"
            chosen = "sans-serif"
        print("WARNING: No Japanese-capable font detected. Japanese labels may render as tofu boxes.")
    plt.rcParams["axes.unicode_minus"] = False
    return chosen


def setup_ax(ax, grid_axis: str = "x") -> None:
    ax.set_facecolor("white")
    ax.grid(True, axis=grid_axis, linestyle="--", alpha=0.35)
    ax.set_axisbelow(True)


def savefig(fig: plt.Figure, filename: str) -> None:
    fig.patch.set_facecolor("white")
    fig.tight_layout()
    fig.savefig(OUT_DIR / filename, dpi=180, facecolor="white", bbox_inches="tight")
    plt.close(fig)


def load_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    df = pd.read_csv(TSV_PATH, sep="\t")
    clusters = pd.read_csv(CLUSTER_PATH)
    return df, clusters


def chart_class_top8_bar(df: pd.DataFrame) -> None:
    top8 = df[df["등수"] <= 8].copy()
    counts = top8["직업"].value_counts().sort_values(ascending=False)
    total = int(counts.sum())
    pct = counts / total * 100

    fig, ax = plt.subplots(figsize=(12, 7))
    bars = ax.barh(counts.index, counts.values, color="#4C78A8")
    ax.invert_yaxis()
    ax.set_title("クラス別 Top8 入賞回数")
    ax.set_xlabel("入賞回数")
    ax.set_ylabel("クラス名")
    setup_ax(ax, "x")

    xmax = max(counts.values) * 1.25 if len(counts) else 1
    ax.set_xlim(0, xmax)
    for bar, c, p in zip(bars, counts.values, pct.values):
        ax.text(
            bar.get_width() + xmax * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{int(c)} ({p:.1f}%)",
            va="center",
            ha="left",
            fontsize=10,
        )

    savefig(fig, "class_top8_bar.png")


def chart_class_winrate_pie(df: pd.DataFrame) -> None:
    winners = df[df["등수"] == 1]["직업"].value_counts()
    winners = winners[winners > 0].sort_values(ascending=False)

    fig, ax = plt.subplots(figsize=(12, 7))
    colors = plt.cm.tab20.colors[: len(winners)]
    labels = [f"{cls}" for cls in winners.index]
    ax.pie(
        winners.values,
        labels=labels,
        autopct="%1.1f%%",
        startangle=90,
        counterclock=False,
        colors=colors,
        wedgeprops={"edgecolor": "white", "linewidth": 1},
        textprops={"fontsize": 10},
    )
    ax.set_title("1位（優勝）クラス分布")
    ax.axis("equal")
    ax.set_facecolor("white")

    savefig(fig, "class_winrate_pie.png")


def chart_card_usage_top20_bar(df: pd.DataFrame) -> None:
    parsed_decks = []
    for v in df["카드"]:
        if pd.isna(v):
            continue
        try:
            parsed = ast.literal_eval(v)
        except Exception:
            continue
        if isinstance(parsed, dict):
            parsed_decks.append(parsed)

    total_decks = len(parsed_decks)
    card_counts: dict[str, int] = {}
    for deck in parsed_decks:
        for card_name in deck.keys():
            card_counts[card_name] = card_counts.get(card_name, 0) + 1

    usage = (
        pd.Series(card_counts, dtype=float)
        .sort_values(ascending=False)
        .head(20)
        .sort_values(ascending=True)
    )
    usage_pct = usage / total_decks * 100 if total_decks else usage

    fig, ax = plt.subplots(figsize=(14, 9))
    bars = ax.barh(usage.index, usage_pct.values, color="#59A14F")
    ax.set_title("カード採用率 Top 20")
    ax.set_xlabel("採用率(%)")
    ax.set_ylabel("カード名")
    setup_ax(ax, "x")

    xmax = max(usage_pct.values) * 1.2 if len(usage_pct) else 1
    ax.set_xlim(0, xmax)
    for bar, pct in zip(bars, usage_pct.values):
        ax.text(
            bar.get_width() + xmax * 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{pct:.1f}%",
            va="center",
            ha="left",
            fontsize=9,
        )

    savefig(fig, "card_usage_top20_bar.png")


def chart_archetype_heatmap(clusters: pd.DataFrame) -> None:
    pivot = pd.pivot_table(
        clusters,
        index="직업",
        columns="아키타입ID",
        values="덱코드",
        aggfunc="count",
        fill_value=0,
    )
    pivot = pivot.reindex(sorted(pivot.index), axis=0)
    pivot = pivot.reindex(sorted(pivot.columns), axis=1)

    fig, ax = plt.subplots(figsize=(12, 7))
    im = ax.imshow(pivot.values, cmap="YlOrRd", aspect="auto")
    ax.set_title("クラス × アーキタイプ デッキ数 ヒートマップ")
    ax.set_xlabel("アーキタイプID")
    ax.set_ylabel("クラス")
    ax.set_xticks(range(len(pivot.columns)))
    ax.set_xticklabels([str(c) for c in pivot.columns])
    ax.set_yticks(range(len(pivot.index)))
    ax.set_yticklabels(list(pivot.index))
    ax.set_facecolor("white")

    for i in range(pivot.shape[0]):
        for j in range(pivot.shape[1]):
            v = int(pivot.iat[i, j])
            ax.text(j, i, str(v), ha="center", va="center", fontsize=9, color="black")

    cbar = fig.colorbar(im, ax=ax)
    cbar.set_label("デッキ数")

    savefig(fig, "archetype_heatmap.png")


def size_bucket(n: int) -> str:
    if n == 9:
        return "9人"
    if 10 <= n <= 19:
        return "10~19人"
    return "20人+"


def chart_class_by_tournament_size(df: pd.DataFrame) -> None:
    tmp = df.copy()
    tmp["규모구간"] = tmp["참가자"].astype(int).map(size_bucket)

    bucket_order = ["9人", "10~19人", "20人+"]
    classes = sorted(tmp["직업"].dropna().unique())
    counts = (
        tmp.groupby(["규모구간", "직업"])
        .size()
        .unstack(fill_value=0)
        .reindex(bucket_order, fill_value=0)
        .reindex(columns=classes, fill_value=0)
    )

    fig, ax = plt.subplots(figsize=(13, 8))
    cmap = plt.get_cmap("tab20", len(classes))
    left = pd.Series(0, index=counts.index, dtype=float)
    for i, cls in enumerate(classes):
        vals = counts[cls].astype(float)
        ax.barh(counts.index, vals.values, left=left.values, color=cmap(i), label=cls, edgecolor="white")
        left += vals

    ax.set_title("大会規模別クラス分布")
    ax.set_xlabel("デッキ数(Top8 エントリー基準)")
    ax.set_ylabel("大会規模")
    setup_ax(ax, "x")
    ax.legend(title="クラス", bbox_to_anchor=(1.02, 1), loc="upper left")

    # Segment labels for readable chunks
    left_positions = {bucket: 0 for bucket in counts.index}
    for cls in classes:
        vals = counts[cls]
        for y_idx, bucket in enumerate(counts.index):
            v = int(vals.loc[bucket])
            if v <= 0:
                continue
            left_pos = left_positions[bucket]
            if v >= 3:
                ax.text(left_pos + v / 2, y_idx, str(v), ha="center", va="center", fontsize=9, color="white")
            left_positions[bucket] += v

    savefig(fig, "class_by_tournament_size.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font_used = configure_matplotlib()
    print(f"Using font family: {font_used}")

    df, clusters = load_data()
    chart_class_top8_bar(df)
    chart_class_winrate_pie(df)
    chart_card_usage_top20_bar(df)
    chart_archetype_heatmap(clusters)
    chart_class_by_tournament_size(df)

    print("Saved charts:")
    for name in [
        "class_top8_bar.png",
        "class_winrate_pie.png",
        "card_usage_top20_bar.png",
        "archetype_heatmap.png",
        "class_by_tournament_size.png",
    ]:
        print((OUT_DIR / name).as_posix())


if __name__ == "__main__":
    main()
