#!/usr/bin/env python3
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd


BASE_DIR = Path("/home/oo/work/sve_meta")
INPUT_PATH = BASE_DIR / "개인전_v2.txt"
OUT_DIR = BASE_DIR / "reports/charts"
START_DATE = "2026-02-23"
END_DATE = "2026-03-01"

CLASS_LABELS = {
    "エルフ": "Elf",
    "ロイヤル": "Royal",
    "ウィッチ": "Witch",
    "ドラゴン": "Dragon",
    "ナイトメア": "Nightmare",
    "ビショップ": "Bishop",
    "プリンセスコネクト！Re:Dive": "PriConne",
    "アイドルマスター シンデレラガールズ": "Deresute",
    "ウマ娘 プリティーダービー": "UmaMusume",
}

CLASS_COLORS = {
    "エルフ": "#2E8B57",
    "ロイヤル": "#2F6BFF",
    "ウィッチ": "#8B5FBF",
    "ドラゴン": "#D94B4B",
    "ナイトメア": "#4A4A4A",
    "ビショップ": "#E6C229",
    "プリンセスコネクト！Re:Dive": "#F48FB1",
    "アイドルマスター シンデレラガールズ": "#F39C34",
    "ウマ娘 プリティーダービー": "#6EC6FF",
}


def load_filtered_data() -> pd.DataFrame:
    df = pd.read_csv(INPUT_PATH, sep="\t")
    df["날짜"] = pd.to_datetime(df["날짜"], errors="coerce")
    df["등수"] = pd.to_numeric(df["등수"], errors="coerce")
    df = df.dropna(subset=["날짜", "등수", "직업"]).copy()
    df["등수"] = df["등수"].astype(int)
    df = df[(df["날짜"] >= START_DATE) & (df["날짜"] <= END_DATE)]
    return df


def display_name(class_name: str) -> str:
    return CLASS_LABELS.get(class_name, class_name)


def save_figure(fig: plt.Figure, path: Path) -> None:
    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def chart_class_share(df: pd.DataFrame) -> pd.Series:
    top8 = df[df["등수"].between(1, 8)].copy()
    counts = top8["직업"].value_counts().sort_values(ascending=False)
    labels = [f"{display_name(name)} {value / counts.sum() * 100:.1f}%" for name, value in counts.items()]
    colors = [CLASS_COLORS.get(name, "#999999") for name in counts.index]

    fig, ax = plt.subplots(figsize=(10, 7))
    ax.pie(
        counts.values,
        labels=labels,
        colors=colors,
        startangle=90,
        counterclock=False,
        wedgeprops={"edgecolor": "white", "linewidth": 1},
    )
    ax.set_title("クラス別TOP8シェア (2026/2/23~3/1)")
    ax.axis("equal")
    save_figure(fig, OUT_DIR / "class_share_20260301.png")
    return counts


def chart_class_wins(df: pd.DataFrame) -> pd.Series:
    winners = df[df["등수"] == 1]["직업"].value_counts().sort_values(ascending=True)
    colors = [CLASS_COLORS.get(name, "#999999") for name in winners.index]

    fig, ax = plt.subplots(figsize=(10, 7))
    bars = ax.barh([display_name(name) for name in winners.index], winners.values, color=colors)
    ax.set_title("クラス別優勝回数 (2026/2/23~3/1)")
    ax.set_xlabel("Wins")
    ax.set_ylabel("Class")
    ax.grid(axis="x", linestyle="--", alpha=0.35)
    ax.set_axisbelow(True)

    xmax = max(winners.values) if len(winners) else 0
    ax.set_xlim(0, xmax + 1)
    for bar, value in zip(bars, winners.values):
        ax.text(value + 0.05, bar.get_y() + bar.get_height() / 2, str(int(value)), va="center")

    save_figure(fig, OUT_DIR / "class_wins_20260301.png")
    return winners.sort_values(ascending=False)


def chart_class_trend(df: pd.DataFrame) -> pd.DataFrame:
    top8 = df[df["등수"].between(1, 8)].copy()
    top8["date_label"] = top8["날짜"].dt.strftime("%-m/%-d")
    date_order = [d.strftime("%-m/%-d") for d in sorted(top8["날짜"].dt.normalize().unique())]
    pivot = (
        top8.groupby(["date_label", "직업"])
        .size()
        .unstack(fill_value=0)
        .reindex(index=date_order, fill_value=0)
    )

    fig, ax = plt.subplots(figsize=(10, 7))
    bottom = pd.Series(0, index=pivot.index, dtype=float)
    for class_name in pivot.sum(axis=0).sort_values(ascending=False).index:
        values = pivot[class_name].astype(float)
        ax.bar(
            pivot.index,
            values.values,
            bottom=bottom.values,
            color=CLASS_COLORS.get(class_name, "#999999"),
            label=display_name(class_name),
        )
        bottom += values

    ax.set_title("日付別クラス登場数推移 (2026/2/23~3/1)")
    ax.set_xlabel("Date")
    ax.set_ylabel("Top8 Appearances")
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.set_axisbelow(True)
    ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1))

    save_figure(fig, OUT_DIR / "class_trend_20260301.png")
    return pivot


def main() -> None:
    plt.rcParams["font.family"] = "DejaVu Sans"
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    df = load_filtered_data()
    share = chart_class_share(df)
    wins = chart_class_wins(df)
    trend = chart_class_trend(df)

    print(f"Filtered rows: {len(df)}")
    print(f"TOP8 rows: {int(share.sum())}")
    print("Saved charts:")
    print(f"- {OUT_DIR / 'class_share_20260301.png'}")
    print(f"- {OUT_DIR / 'class_wins_20260301.png'}")
    print(f"- {OUT_DIR / 'class_trend_20260301.png'}")
    print("Top8 share by class:")
    for class_name, count in share.items():
        print(f"- {display_name(class_name)}: {int(count)}")
    print("Wins by class:")
    for class_name, count in wins.items():
        print(f"- {display_name(class_name)}: {int(count)}")
    print("Trend dates:")
    print(f"- {', '.join(trend.index.tolist())}")


if __name__ == "__main__":
    main()
