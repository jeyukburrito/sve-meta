#!/usr/bin/env python3
"""
2026-03-02~03-08 대회 데이터를 정규화하여 data/개인전_v2.txt에 추가
"""
import json
import sys
import os
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.normalize_cards import build_canonical_map, normalize_deck

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. canonical map 빌드
    carddb_dir = Path(base_dir) / 'data' / 'carddb_json'
    canonical_map = build_canonical_map(carddb_dir)
    print(f"canonical_map: {len(canonical_map)}개 코드")
    
    # 2. 데이터 로드
    with open(os.path.join(base_dir, 'data', 'raw', 'tournament_data_20260302_20260308.json'), encoding='utf-8') as f:
        tournament_data = json.load(f)
    
    with open(os.path.join(base_dir, 'data', 'raw', 'deck_cards_20260302_20260308.json'), encoding='utf-8') as f:
        deck_cards = json.load(f)
    
    # 3. TSV 행 생성
    rows = []
    warn_deck_ids = []
    
    for tournament_code, tdata in sorted(tournament_data.items(), key=lambda x: (x[1]['date'], x[0])):
        date = tdata['date']
        players = tdata['players']
        
        for record in sorted(tdata['records'], key=lambda r: r['rank']):
            rank = record['rank']
            deck_id = record['deckId']
            cls = record['cls']
            
            if deck_id and deck_id in deck_cards:
                raw_cards = deck_cards[deck_id]
                normalized = normalize_deck(raw_cards, canonical_map)
                cards_str = str(normalized)
            else:
                normalized = None
                cards_str = 'null'
                if deck_id:
                    warn_deck_ids.append(deck_id)
            
            row = f"{date}\t{cls}\t{rank}\t{players}\t{deck_id}\t{tournament_code}\t{cards_str}"
            rows.append(row)
    
    print(f"생성된 행: {len(rows)}개")
    if warn_deck_ids:
        print(f"카드 없는 덱: {warn_deck_ids}")
    
    # 4. data/개인전_v2.txt 에 추가
    output_path = os.path.join(base_dir, 'data', '개인전_v2.txt')
    with open(output_path, 'a', encoding='utf-8') as f:
        for row in rows:
            f.write(row + '\n')
    
    print(f"완료: {output_path}에 {len(rows)}행 추가")
    
    # 5. 결과 확인
    with open(output_path, encoding='utf-8') as f:
        all_lines = f.readlines()
    print(f"파일 전체 행 수 (헤더 포함): {len(all_lines)}")

if __name__ == '__main__':
    main()
