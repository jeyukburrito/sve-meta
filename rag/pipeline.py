"""
RAG 파이프라인: TSV(토너먼트 데이터) + 카드 DB → enriched_data.json

실행:
    python rag/pipeline.py --tsv data/processed/개인전_20260221_20260223.tsv
    python rag/pipeline.py --tsv 개인전.txt --clusters data/analysis/deck_clusters.csv --out output/20260228
"""
from __future__ import annotations

import argparse
import ast
import json
import re
from collections import defaultdict
from pathlib import Path

import pandas as pd

from retriever import CardRetriever

# ──────────────────────────────────────────────
# 상수
# ──────────────────────────────────────────────
ANALYSIS_DIR = Path(__file__).parent.parent / "data" / "analysis"
DEFAULT_CLUSTERS = ANALYSIS_DIR / "deck_clusters.csv"
DEFAULT_OUT = Path(__file__).parent.parent / "output"

# 참가자 수 기준
TOP4_THRESHOLD = 16   # 16인 미만 → TOP4
TOP8_THRESHOLD = 9    # 9인 미만 → 수집 제외 (이미 필터됨)
FALLBACK_TOP_CARDS = 20


# ──────────────────────────────────────────────
# 유틸
# ──────────────────────────────────────────────

def parse_cards(raw) -> dict[str, int]:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return {}
    text = str(raw).strip()
    if not text or text.lower() in ("nan", "null", "none"):
        return {}
    try:
        parsed = ast.literal_eval(text)
        if isinstance(parsed, dict):
            return {str(k).strip(): int(float(v)) for k, v in parsed.items() if k and v}
    except Exception:
        pass
    return {}


def sanitize(value: object) -> str:
    text = str(value).strip()
    text = re.sub(r"[^\w\-]+", "_", text, flags=re.UNICODE)
    return re.sub(r"_+", "_", text).strip("_") or "unknown"


def get_top_cutoff(participants: object) -> int:
    pax = int(participants) if not pd.isna(participants) else 0
    return 4 if pax < TOP4_THRESHOLD else 8


def is_top_cut_row(row: pd.Series) -> bool:
    rank = row.get("rank")
    if pd.isna(rank):
        return False
    return int(rank) <= get_top_cutoff(row.get("participants", 0))


def normalize_card_entries(cards: dict[str, int], retriever: CardRetriever) -> dict[str, int]:
    """
    cards 컬럼이 카드코드 또는 카드명으로 들어와도 카드코드 기준으로 정규화한다.
    미정규화 항목은 원문 키를 유지한다.
    """
    normalized: dict[str, int] = {}
    for identifier, qty in cards.items():
        code = retriever.normalize_code(identifier) or str(identifier).strip()
        if not code:
            continue
        normalized[code] = normalized.get(code, 0) + int(qty)
    return normalized


def find_card_stat_columns(stat_df: pd.DataFrame) -> tuple[str | None, str | None]:
    pct_col = next(
        (c for c in stat_df.columns if "採用" in c or "adoption" in c.lower()),
        None,
    )
    card_col = next(
        (
            c for c in stat_df.columns
            if "コード" in c or "card_code" in c.lower() or c.lower() == "code"
        ),
        None,
    )
    if card_col is None:
        card_col = next(
            (c for c in stat_df.columns if "カード" in c or "card" in c.lower() or "name" in c.lower()),
            None,
        )
    return pct_col, card_col


# ──────────────────────────────────────────────
# 데이터 로드
# ──────────────────────────────────────────────

def load_tsv(tsv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(tsv_path, sep="\t")
    df.columns = [c.strip() for c in df.columns]

    rename_map = {}
    for col in df.columns:
        if col in ("날짜", "date"):
            rename_map[col] = "date"
        elif col in ("직업", "class"):
            rename_map[col] = "class"
        elif col in ("등수", "rank"):
            rename_map[col] = "rank"
        elif col in ("참가자", "participants"):
            rename_map[col] = "participants"
        elif col in ("덱코드", "deck_code"):
            rename_map[col] = "deck_code"
        elif col in ("대회코드", "tournament_code"):
            rename_map[col] = "tournament_code"
        elif col in ("카드", "cards"):
            rename_map[col] = "cards"
    df = df.rename(columns=rename_map)

    df["deck_code"] = df["deck_code"].astype(str)
    df["tournament_code"] = df["tournament_code"].astype(str)
    df["rank"] = pd.to_numeric(df["rank"], errors="coerce")
    df["participants"] = pd.to_numeric(df["participants"], errors="coerce")
    return df


def load_clusters(clusters_path: Path) -> pd.DataFrame:
    df = pd.read_csv(clusters_path, encoding="utf-8-sig")
    df.columns = [c.strip() for c in df.columns]
    rename_map = {}
    for col in df.columns:
        if "직업" in col:
            rename_map[col] = "class"
        elif "덱코드" in col:
            rename_map[col] = "deck_code"
        elif "대회코드" in col:
            rename_map[col] = "tournament_code"
        elif "아키타입ID" in col:
            rename_map[col] = "archetype_id"
        elif "아키타입명" in col:
            rename_map[col] = "archetype_name"
    df = df.rename(columns=rename_map)
    df["deck_code"] = df["deck_code"].astype(str)
    df["tournament_code"] = df["tournament_code"].astype(str)
    df = df.drop_duplicates(subset=["class", "deck_code", "tournament_code"], keep="first")
    return df


# ──────────────────────────────────────────────
# 통계 계산
# ──────────────────────────────────────────────

def compute_class_stats(df: pd.DataFrame) -> dict:
    total_wins = 0
    total_top8 = 0
    class_wins: dict[str, int] = defaultdict(int)
    class_top8: dict[str, int] = defaultdict(int)

    for _, row in df.iterrows():
        rank = row.get("rank")
        cls = str(row.get("class", "")).strip()

        if pd.isna(rank) or not cls:
            continue

        rank = int(rank)
        cutoff = get_top_cutoff(row.get("participants", 0))

        if rank == 1:
            class_wins[cls] += 1
            total_wins += 1

        if rank <= cutoff:
            class_top8[cls] += 1
            total_top8 += 1

    all_classes = set(class_wins.keys()) | set(class_top8.keys())
    result: dict[str, dict] = {}
    for cls in all_classes:
        w = class_wins.get(cls, 0)
        t = class_top8.get(cls, 0)
        result[cls] = {
            "win_count": w,
            "win_rate": w / total_wins if total_wins > 0 else 0.0,
            "top8_count": t,
            "top8_rate": t / total_top8 if total_top8 > 0 else 0.0,
        }
    return result


def compute_archetype_stats(df: pd.DataFrame, clusters: pd.DataFrame) -> list[dict]:
    merged = df.merge(
        clusters[["class", "deck_code", "tournament_code", "archetype_id", "archetype_name"]],
        on=["class", "deck_code", "tournament_code"],
        how="left",
    )

    total_top8 = 0
    archetype_wins: dict[tuple, int] = defaultdict(int)
    archetype_top8: dict[tuple, int] = defaultdict(int)

    for _, row in merged.iterrows():
        rank = row.get("rank")
        cls = str(row.get("class", "")).strip()
        arch_id = row.get("archetype_id")
        arch_name = str(row.get("archetype_name", "")).strip()

        if pd.isna(rank) or not cls or pd.isna(arch_id):
            continue

        rank = int(rank)
        cutoff = get_top_cutoff(row.get("participants", 0))
        key = (cls, str(arch_id), arch_name)

        if rank == 1:
            archetype_wins[key] += 1

        if rank <= cutoff:
            archetype_top8[key] += 1
            total_top8 += 1

    all_keys = set(archetype_wins.keys()) | set(archetype_top8.keys())
    result: list[dict] = []
    for key in all_keys:
        cls, arch_id, arch_name = key
        t = archetype_top8.get(key, 0)
        result.append(
            {
                "class": cls,
                "archetype_id": arch_id,
                "archetype_name": arch_name,
                "win_count": archetype_wins.get(key, 0),
                "deck_count": t,
                "top8_rate": t / total_top8 if total_top8 > 0 else 0.0,
            }
        )

    result.sort(key=lambda x: x["top8_rate"], reverse=True)
    return result


def compute_top_cards_overall(df: pd.DataFrame, retriever: CardRetriever) -> list[dict]:
    """전 클래스 TOP8 덱에서 카드코드별 채용률/평균 장수 집계 후 카드 정보를 병합한다."""
    card_deck_count: dict[str, int] = defaultdict(int)
    card_total_copies: dict[str, int] = defaultdict(int)
    total_decks = 0

    for _, row in df.iterrows():
        if not is_top_cut_row(row):
            continue

        cards = normalize_card_entries(parse_cards(row.get("cards")), retriever)
        if not cards:
            continue

        total_decks += 1
        for code, qty in cards.items():
            card_deck_count[code] += 1
            card_total_copies[code] += qty

    if total_decks == 0:
        return []

    rows = []
    codes_in_order: list[str] = []
    for code, deck_n in card_deck_count.items():
        adoption = deck_n / total_decks
        avg = card_total_copies[code] / deck_n
        rows.append(
            {
                "code": code,
                "adoption_rate": adoption,
                "adoption_pct": f"{adoption * 100:.1f}%",
                "avg_copies": f"{avg:.2f}",
            }
        )
    rows.sort(key=lambda x: (-x["adoption_rate"], x["code"]))
    codes_in_order = [row["code"] for row in rows]
    enriched_map = {item["code"]: item for item in retriever.enrich_card_list(codes_in_order)}

    merged_rows: list[dict] = []
    for row in rows:
        info = enriched_map.get(row["code"], {"code": row["code"], "missing": True})
        merged_rows.append(
            {
                "name": info.get("name", row["code"]),
                "code": row["code"],
                "adoption_rate": row["adoption_rate"],
                "adoption_pct": row["adoption_pct"],
                "avg_copies": row["avg_copies"],
                "card_type": info.get("card_type", ""),
                "cost": info.get("cost", "-"),
                "attack": info.get("attack", "-"),
                "hp": info.get("hp", "-"),
                "effect": info.get("effect", ""),
                "class": info.get("class", ""),
                "missing": info.get("missing", False),
            }
        )
    return merged_rows


def get_class_top_cards(df: pd.DataFrame, cls: str, retriever: CardRetriever, limit: int) -> list[str]:
    """해당 클래스 TOP8 덱에서 카드코드 채용률 상위 limit종 반환."""
    card_deck_count: dict[str, int] = defaultdict(int)
    total_decks = 0

    class_df = df[df["class"].astype(str).str.strip() == cls]
    for _, row in class_df.iterrows():
        if not is_top_cut_row(row):
            continue

        cards = normalize_card_entries(parse_cards(row.get("cards")), retriever)
        if not cards:
            continue

        total_decks += 1
        for code in cards:
            card_deck_count[code] += 1

    if total_decks == 0:
        return []

    ranked = sorted(
        card_deck_count.items(),
        key=lambda item: (-item[1] / total_decks, item[0]),
    )
    return [code for code, _ in ranked[:limit]]


def count_top_cut_decks(df: pd.DataFrame) -> int:
    return int(df.apply(is_top_cut_row, axis=1).sum())


# ──────────────────────────────────────────────
# RAG 보강
# ──────────────────────────────────────────────

def enrich_archetypes(
    archetypes: list[dict],
    retriever: CardRetriever,
    analysis_dir: Path,
    df: pd.DataFrame,
) -> list[dict]:
    """
    각 아키타입의 fixed_cards + high_adoption_cards 를 카드 DB에서 조회하여 enriched 정보 포함.
    fixed/high 카드 목록이 비어있으면 해당 class의 TOP8 덱에서 채용률 상위 카드 20종을 fallback으로 사용.
    """
    enriched: list[dict] = []

    if not archetypes:
        total_top8 = count_top_cut_decks(df)
        classes = sorted({str(v).strip() for v in df["class"].dropna().tolist() if str(v).strip()})
        for cls in classes:
            class_top8_mask = (df["class"].astype(str).str.strip() == cls) & df.apply(is_top_cut_row, axis=1)
            class_top8_count = int(class_top8_mask.sum())
            fallback_codes = get_class_top_cards(df, cls, retriever, FALLBACK_TOP_CARDS)
            if not fallback_codes:
                continue
            enriched.append(
                {
                    "class": cls,
                    "archetype_id": f"fallback_{sanitize(cls)}",
                    "archetype_name": "Fallback Top Cards",
                    "win_count": int(df[(df["class"] == cls) & (df["rank"] == 1)].shape[0]),
                    "deck_count": class_top8_count,
                    "top8_rate": class_top8_count / total_top8 if total_top8 > 0 else 0.0,
                    "fixed_cards": [],
                    "high_adoption_cards": fallback_codes,
                    "fixed_cards_enriched": [],
                    "high_adoption_enriched": retriever.enrich_card_list(fallback_codes),
                    "fallback_used": True,
                }
            )
        return enriched

    for arch in archetypes:
        cls = str(arch.get("class", "")).strip()
        arch_id = str(arch.get("archetype_id", "")).split(".")[0]
        safe_cls = sanitize(cls)
        csv_path = analysis_dir / f"card_stats_{safe_cls}_archetype{arch_id}.csv"

        fixed_codes: list[str] = []
        high_codes: list[str] = []

        if csv_path.exists():
            try:
                stat_df = pd.read_csv(csv_path, encoding="utf-8-sig")
                stat_df.columns = [c.strip() for c in stat_df.columns]
                pct_col, card_col = find_card_stat_columns(stat_df)
                if pct_col and card_col:
                    stat_df["_rate"] = (
                        stat_df[pct_col]
                        .astype(str)
                        .str.replace("%", "", regex=False)
                        .str.strip()
                        .pipe(pd.to_numeric, errors="coerce")
                        / 100
                    )
                    stat_df["_code"] = stat_df[card_col].astype(str).str.strip()
                    fixed_codes = [
                        code for code in stat_df[stat_df["_rate"] >= 1.0]["_code"].tolist() if code
                    ]
                    high_codes = [
                        code
                        for code in stat_df[
                            (stat_df["_rate"] >= 0.9) & (stat_df["_rate"] < 1.0)
                        ]["_code"].tolist()
                        if code
                    ]
            except Exception as e:
                print(f"[WARN] {csv_path.name} 파싱 실패: {e}")

        fallback_used = False
        if not fixed_codes and not high_codes:
            high_codes = get_class_top_cards(df, cls, retriever, FALLBACK_TOP_CARDS)
            fallback_used = True

        arch_enriched = {
            **arch,
            "fixed_cards": fixed_codes,
            "high_adoption_cards": high_codes,
            "fixed_cards_enriched": retriever.enrich_card_list(fixed_codes),
            "high_adoption_enriched": retriever.enrich_card_list(high_codes),
            "fallback_used": fallback_used,
        }
        enriched.append(arch_enriched)

    return enriched


# ──────────────────────────────────────────────
# 메인 파이프라인
# ──────────────────────────────────────────────

def run_pipeline(
    tsv_path: Path,
    clusters_path: Path,
    out_dir: Path,
    analysis_dir: Path = ANALYSIS_DIR,
) -> Path:
    """
    전체 RAG 파이프라인 실행.
    Returns: enriched_data.json 경로
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[1/5] TSV 로드: {tsv_path}")
    df = load_tsv(tsv_path)
    print(f"      총 레코드: {len(df)}건")

    print(f"[2/5] 클러스터 로드: {clusters_path}")
    clusters = load_clusters(clusters_path)
    print(f"      클러스터 레코드: {len(clusters)}건")

    print("[3/5] 카드 DB 로드...")
    retriever = CardRetriever()

    print("[4/5] 통계 계산 중...")
    class_stats = compute_class_stats(df)
    archetypes = compute_archetype_stats(df, clusters)
    archetypes_enriched = enrich_archetypes(archetypes, retriever, analysis_dir, df)
    top_cards = compute_top_cards_overall(df, retriever)

    date_range = f"{df['date'].min()} ~ {df['date'].max()}" if "date" in df.columns else "불명"
    total_tournaments = df["tournament_code"].nunique() if "tournament_code" in df.columns else 0
    total_decks = count_top_cut_decks(df)

    analysis_data = {
        "meta": {
            "date_range": date_range,
            "total_tournaments": total_tournaments,
            "total_decks": total_decks,
        },
        "class_stats": class_stats,
        "archetypes": archetypes_enriched,
        "top_cards_overall": top_cards[:30],
        "trend_diff": {},
    }

    analysis_path = out_dir / "analysis_data.json"
    with open(analysis_path, "w", encoding="utf-8") as f:
        json.dump(analysis_data, f, ensure_ascii=False, indent=2)
    print(f"      → {analysis_path} 저장")

    print("[5/5] Gemini 프롬프트 생성...")
    from prompt_builder import build_report_prompt  # noqa: PLC0415

    enriched_path = out_dir / "enriched_data.json"
    with open(enriched_path, "w", encoding="utf-8") as f:
        json.dump(analysis_data, f, ensure_ascii=False, indent=2)
    print(f"      → {enriched_path} 저장")

    prompt = build_report_prompt(analysis_data)
    prompt_path = out_dir / "gemini_prompt.txt"
    with open(prompt_path, "w", encoding="utf-8") as f:
        f.write(prompt)
    print(f"      → {prompt_path} 저장 ({len(prompt)}자)")

    print("\n✅ 파이프라인 완료!")
    return enriched_path


# ──────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="SVE 메타 분석 RAG 파이프라인")
    parser.add_argument("--tsv", type=Path, required=True, help="토너먼트 TSV 파일 경로")
    parser.add_argument("--clusters", type=Path, default=DEFAULT_CLUSTERS, help="덱 클러스터 CSV 경로")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT / "latest", help="출력 디렉토리")
    parser.add_argument("--analysis-dir", type=Path, default=ANALYSIS_DIR, help="card_stats CSV 디렉토리")
    args = parser.parse_args()

    run_pipeline(
        tsv_path=args.tsv,
        clusters_path=args.clusters,
        out_dir=args.out,
        analysis_dir=args.analysis_dir,
    )


if __name__ == "__main__":
    main()
