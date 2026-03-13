#!/usr/bin/env python3
import pandas as pd
import ast
from collections import defaultdict

# 데이터 로드
df = pd.read_csv('data/개인전_v2.txt', sep='\t', dtype=str, keep_default_na=False)
df.columns = ['날짜', '직업', '등수', '참가자', '덱코드', '대회코드', '카드']
df['등수'] = df['등수'].astype(int)

# 이번 주 필터
week = df[(df['날짜'] >= '2026-03-02') & (df['날짜'] <= '2026-03-08')].copy()
print(f"=== 2026-03-02~03-08 개인전 데이터 ===")
print(f"총 레코드: {len(week)}건 (대회 수: {week['대회코드'].nunique()}개)")
print(f"날짜별 대회 수: {week.groupby('날짜')['대회코드'].nunique().to_dict()}")
print()

# 클래스별 집계
cls_stats = week.groupby('직업').agg(
    우승=('등수', lambda x: (x == 1).sum()),
    top8=('등수', 'count')
).sort_values('우승', ascending=False)
cls_stats['우승률'] = (cls_stats['우승'] / cls_stats['우승'].sum() * 100).round(1)
cls_stats['top8율'] = (cls_stats['top8'] / cls_stats['top8'].sum() * 100).round(1)
print("=== 클래스별 성적 ===")
print(cls_stats.to_string())
print()

# deck_clusters 로드
clusters = pd.read_csv('data/analysis/deck_clusters.csv', dtype=str)
clusters = clusters.rename(columns={'덱코드': '덱코드', '아키타입ID': '아키타입ID', '아키타입명(대표카드 top5)': '아키타입명'})

# 이번 주 덱에 클러스터 조인
week_with_cls = week.merge(clusters[['덱코드', '직업', '아키타입명']], on=['덱코드', '직업'], how='left')
week_with_cls['아키타입명'] = week_with_cls['아키타입명'].fillna('기타')

archetype_stats = week_with_cls.groupby(['직업', '아키타입명']).agg(
    우승=('등수', lambda x: (x == 1).sum()),
    top8=('등수', 'count')
).sort_values(['우승', 'top8'], ascending=False)
print("=== 아키타입별 성적 (상위 15) ===")
print(archetype_stats.head(15).to_string())
print()

# 채용률 높은 카드 (이번 주, 클래스별)
print("=== 클래스별 채용률 상위 카드 (이번 주) ===")
for cls in ['エルフ', 'ナイトメア', 'プリンセスコネクト！Re:Dive', 'ドラゴン', 'ビショップ', 'ロイヤル']:
    cls_week = week[week['직업'] == cls]
    if len(cls_week) == 0:
        continue
    card_counts = defaultdict(int)
    total = len(cls_week)
    for _, row in cls_week.iterrows():
        if row['카드'] != 'null' and row['카드']:
            try:
                cards = ast.literal_eval(row['카드'])
                for code in cards:
                    card_counts[code] += 1
            except:
                pass
    top_cards = sorted(card_counts.items(), key=lambda x: -x[1])[:10]
    print(f"\n[{cls}] ({total}건)")
    for code, cnt in top_cards:
        print(f"  {code}: {cnt}/{total} ({cnt/total*100:.0f}%)")
