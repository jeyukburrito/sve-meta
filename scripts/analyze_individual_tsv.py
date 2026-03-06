import ast
import json
import math
import sys
from pathlib import Path

import pandas as pd


def parse_card_dict(v):
    if pd.isna(v):
        return {}
    if isinstance(v, dict):
        return v
    s = str(v).strip()
    if not s:
        return {}
    try:
        d = ast.literal_eval(s)
    except Exception:
        return {}
    if isinstance(d, dict):
        return d
    return {}


def rate(x, total):
    if total == 0:
        return 0.0
    return round(float(x) / float(total), 4)


def class_stats(series, total):
    counts = series.value_counts()
    return {k: {"count": int(v), "rate": rate(v, total)} for k, v in counts.items()}


def main(path_str: str):
    path = Path(path_str)
    df = pd.read_csv(path, sep='\t')

    # Defensive typing
    df['등수'] = pd.to_numeric(df['등수'], errors='coerce')
    df['참가자'] = pd.to_numeric(df['참가자'], errors='coerce')
    df = df.dropna(subset=['등수', '직업']).copy()
    df['등수'] = df['등수'].astype(int)

    top8 = df[df['등수'].between(1, 8)].copy()
    total_decks = int(len(top8))
    total_tournaments = int(top8['대회코드'].nunique())

    # 1) 클래스 분포 (Top 8 전체)
    class_distribution = class_stats(top8['직업'].astype(str), total_decks)

    # 2) 1위 한정 클래스 분포
    firsts = top8[top8['등수'] == 1].copy()
    class_1st_place = class_stats(firsts['직업'].astype(str), int(len(firsts)))

    # 3) Top 8 진출 클래스 횟수
    top8_by_class = top8['직업'].astype(str).value_counts().to_dict()
    top8_by_class = {k: int(v) for k, v in top8_by_class.items()}

    # 4,5) 카드 채용률 / 3장 풀채용률 (메인덱 기준)
    card_dicts = top8['카드'].apply(parse_card_dict)
    records = []
    for d in card_dicts:
        if not isinstance(d, dict):
            continue
        for card, cnt in d.items():
            try:
                cnt_int = int(cnt)
            except Exception:
                continue
            records.append((str(card), cnt_int))

    card_df = pd.DataFrame(records, columns=['card', 'count'])
    if card_df.empty:
        card_usage_top20 = []
        card_full3_top20 = []
    else:
        usage_counts = card_df.groupby('card').size().sort_values(ascending=False)
        usage_top = usage_counts.head(20)
        card_usage_top20 = [
            {
                'card': card,
                'usage_rate': rate(int(deck_count), total_decks),
                'deck_count': int(deck_count),
            }
            for card, deck_count in usage_top.items()
        ]

        full3_counts = card_df[card_df['count'] == 3].groupby('card').size().sort_values(ascending=False)
        full3_top = full3_counts.head(20)
        card_full3_top20 = [
            {
                'card': card,
                'full3_rate': rate(int(deck_count), total_decks),
            }
            for card, deck_count in full3_top.items()
        ]

    # 6) 대회 규모별 분석 (참가자 기준)
    def size_bucket(n):
        if pd.isna(n):
            return None
        n = int(n)
        if n < 10:
            return 'small(<10)'
        if 10 <= n <= 19:
            return 'medium(10-19)'
        return 'large(20+)'

    top8['size_bucket'] = top8['참가자'].apply(size_bucket)
    by_tournament_size = {}
    for bucket in ['small(<10)', 'medium(10-19)', 'large(20+)']:
        sub = top8[top8['size_bucket'] == bucket]
        bucket_total = int(len(sub))
        ccounts = sub['직업'].astype(str).value_counts()
        by_tournament_size[bucket] = {
            'total': bucket_total,
            'classes': {k: {'count': int(v), 'rate': rate(int(v), bucket_total)} for k, v in ccounts.items()}
        }

    # 기간 문자열
    date_series = pd.to_datetime(top8['날짜'], errors='coerce').dropna()
    if len(date_series) > 0:
        period = f"{date_series.min().date()} ~ {date_series.max().date()}"
    else:
        period = ""

    result = {
        'period': period,
        'total_decks': total_decks,
        'total_tournaments': total_tournaments,
        'class_distribution': class_distribution,
        'class_1st_place': class_1st_place,
        'top8_by_class': top8_by_class,
        'card_usage_top20': card_usage_top20,
        'card_full3_top20': card_full3_top20,
        'by_tournament_size': by_tournament_size,
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('Usage: python3 scripts/analyze_individual_tsv.py <path.tsv>', file=sys.stderr)
        sys.exit(1)
    main(sys.argv[1])
