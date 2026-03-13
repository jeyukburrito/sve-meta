#!/usr/bin/env python3
import os

import matplotlib
import matplotlib.pyplot as plt
import pandas as pd


def main() -> None:
    input_path = "data/개인전_v2.txt"
    output_dir = "reports/charts"
    os.makedirs(output_dir, exist_ok=True)

    matplotlib.rcParams["font.family"] = "DejaVu Sans"

    df = pd.read_csv(input_path, sep="\t")
    df["날짜"] = pd.to_datetime(df["날짜"], format="%Y-%m-%d", errors="coerce")
    df["등수"] = pd.to_numeric(df["등수"], errors="coerce")

    start = pd.Timestamp("2026-03-02")
    end = pd.Timestamp("2026-03-08")
    weekly = df[(df["날짜"] >= start) & (df["날짜"] <= end)].copy()

    top8 = weekly[weekly["등수"] <= 8].copy()

    share = top8["직업"].value_counts().sort_values(ascending=False)
    plt.figure(figsize=(10, 6))
    plt.pie(
        share.values,
        labels=share.index,
        autopct="%1.1f%%",
        startangle=90,
        counterclock=False,
    )
    plt.title("Top8 Share by Class (2026-03-02 to 2026-03-08)")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "class_share_20260308.png"), dpi=150)
    plt.close()

    wins = weekly[weekly["등수"] == 1]["직업"].value_counts().sort_values(ascending=False)
    plt.figure(figsize=(10, 6))
    wins.plot(kind="bar")
    plt.title("Class Wins (1st Place Count, 2026-03-02 to 2026-03-08)")
    plt.xlabel("Class")
    plt.ylabel("Wins")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "class_wins_20260308.png"), dpi=150)
    plt.close()

    avg_rank = weekly.groupby("직업")["등수"].mean().sort_values(ascending=True)
    plt.figure(figsize=(10, 6))
    avg_rank.plot(kind="bar")
    plt.title("Average Rank by Class (Lower is Better, 2026-03-02 to 2026-03-08)")
    plt.xlabel("Class")
    plt.ylabel("Average Rank")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "class_avg_rank_20260308.png"), dpi=150)
    plt.close()

    print(f"Filtered rows: {len(weekly)}")
    print(f"Top8 rows: {len(top8)}")
    print("Saved charts:")
    print(os.path.join(output_dir, "class_share_20260308.png"))
    print(os.path.join(output_dir, "class_wins_20260308.png"))
    print(os.path.join(output_dir, "class_avg_rank_20260308.png"))


if __name__ == "__main__":
    main()
