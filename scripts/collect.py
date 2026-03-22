#!/usr/bin/env python3
"""
대회 데이터 수집 스크립트 (Python playwright)

사용법:
  python3 scripts/collect.py --date 2026-03-17
  python3 scripts/collect.py --from 2026-03-17 --to 2026-03-23
  python3 scripts/collect.py --date 2026-03-17 --dry-run

출력 파일 (8컬럼 TSV):
  data/개인전_v3.txt  — 날짜/직업/등수/참가자/덱코드/대회코드/카드/에볼브
  data/트리오_v2.txt  — 동일 형식
"""
import argparse
import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from normalize_cards import build_canonical_map, normalize_deck

from playwright.async_api import async_playwright

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent
CARDDB_DIR = PROJECT_ROOT / "data" / "carddb_json"
KOJIN_PATH = PROJECT_ROOT / "data" / "개인전_v3.txt"
TRIO_PATH  = PROJECT_ROOT / "data" / "트리오_v2.txt"
TSV_HEADER = "날짜\t직업\t등수\t참가자\t덱코드\t대회코드\t카드\t에볼브"

DECKLOG_JS = """() => {
    const findSection = (label) => {
        const h3 = Array.from(document.querySelectorAll('h3'))
                        .find(h => h.textContent.includes(label));
        if (!h3) return null;
        return Array.from(h3.nextElementSibling.querySelectorAll('.card-item')).map(item => ({
            code: item.querySelector('img.card-view-item').getAttribute('title').split(' : ')[0].trim(),
            count: parseInt(item.querySelector('span.num').textContent)
        }));
    };
    return { main: findSection('メインデッキ'), evolve: findSection('エボルヴデッキ') };
}"""


# ──────────────────────────────────────────────
# bushi-navi 수집
# ──────────────────────────────────────────────

async def fetch_events_for_date_range(page, date_from: str, date_to: str) -> list[dict]:
    """date_from ~ date_to 범위의 대회 목록 수집 (내림차순 API 기준)"""
    tournaments = []
    offset = 0

    while True:
        captured = {}

        async def handle_route(route):
            url = route.request.url
            if "api-user.bushi-navi.com/api/user/event/result/list" in url:
                new_url = (
                    url
                    .replace("game_title_id=6", "game_title_id[]=6")
                    .replace("offset=0", f"offset={offset}")
                )
                await route.continue_(url=new_url)
            else:
                await route.continue_()

        async def on_response(response):
            if "api-user.bushi-navi.com/api/user/event/result/list" in response.url:
                captured["data"] = await response.json()

        await page.route("**/*", handle_route)
        page.on("response", on_response)
        await page.goto(
            "https://www.bushi-navi.com/event/result/list?game_title_id=6",
            wait_until="domcontentloaded",
        )
        await asyncio.sleep(1.5)
        page.remove_listener("response", on_response)
        await page.unroute("**/*", handle_route)

        events = captured.get("data", {}).get("success", {}).get("events", [])
        if not events:
            log.info("offset=%d: 이벤트 없음 → 종료", offset)
            break

        for ev in events:
            date = ev.get("start_datetime", "")[:10]
            if date_from <= date <= date_to:
                tournaments.append(ev)
            elif date < date_from:
                log.info("offset=%d: %s < %s → 종료", offset, date, date_from)
                return tournaments

        oldest = events[-1].get("start_datetime", "")[:10]
        if oldest < date_from:
            break

        offset += 10
        await asyncio.sleep(0.5)

    return tournaments


async def fetch_tournament_detail(page, event_id: str) -> dict | None:
    captured = {}

    async def on_response(response):
        if f"event/result/detail/{event_id}" in response.url:
            captured["data"] = await response.json()

    page.on("response", on_response)
    await page.goto(
        f"https://www.bushi-navi.com/event/result/{event_id}",
        wait_until="domcontentloaded",
    )
    await asyncio.sleep(1.5)
    page.remove_listener("response", on_response)
    return captured.get("data")


# ──────────────────────────────────────────────
# decklog 수집
# ──────────────────────────────────────────────

async def fetch_deck_cards(page, deck_code: str) -> dict | None:
    try:
        await page.goto(
            f"https://decklog.bushiroad.com/view/{deck_code}",
            wait_until="domcontentloaded",
        )
        await asyncio.sleep(2)
        return await page.evaluate(DECKLOG_JS)
    except Exception as e:
        log.warning("decklog %s 오류: %s", deck_code, e)
        return None


# ──────────────────────────────────────────────
# 중복 체크
# ──────────────────────────────────────────────

def load_existing_keys(path: Path) -> set[tuple]:
    keys = set()
    if not path.exists():
        return keys
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i == 0:
                continue
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 6:
                keys.add((parts[5], parts[4], parts[2]))  # (대회코드, 덱코드, 등수)
    return keys


def append_lines(path: Path, lines: list[str], dry_run: bool) -> None:
    if not lines:
        return
    if dry_run:
        log.info("[DRY-RUN] %s 에 %d건 (미저장)", path.name, len(lines))
        return
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as f:
            f.write(TSV_HEADER + "\n")
            for line in lines:
                f.write(line + "\n")
    else:
        content = path.read_bytes()
        with path.open("a", encoding="utf-8") as f:
            if content and not content.endswith(b"\n"):
                f.write("\n")
            for line in lines:
                f.write(line + "\n")
    log.info("%s 에 %d건 추가", path.name, len(lines))


# ──────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────

async def run(date_from: str, date_to: str, dry_run: bool) -> None:
    canonical_map = build_canonical_map(CARDDB_DIR)
    log.info("canonical 맵: %d개", len(canonical_map))

    kojin_keys = load_existing_keys(KOJIN_PATH)
    trio_keys  = load_existing_keys(TRIO_PATH)
    log.info("기존 데이터: 개인전 %d건, 트리오 %d건", len(kojin_keys), len(trio_keys))

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # ── 대회 목록 수집 ──
        log.info("=== 대회 목록 수집 (%s ~ %s) ===", date_from, date_to)
        events = await fetch_events_for_date_range(page, date_from, date_to)
        log.info("발견: %d개 대회", len(events))

        # ── 상세 수집 + 엔트리 파싱 ──
        all_entries = []  # {fmt, date, players, event_id, rank, class, deckCode}

        for ev in events:
            event_id = str(ev["event_id"])
            players  = ev.get("joined_player_count", 0)
            date     = ev.get("start_datetime", "")[:10]
            title    = ev.get("event_title", "")

            detail = await fetch_tournament_detail(page, event_id)
            if not detail:
                log.warning("[%s] 상세 없음 → 스킵", event_id)
                continue

            ev_detail  = detail.get("success", {}).get("event_detail", {})
            team_count = ev_detail.get("team_count", 1)
            fmt        = "트리오" if team_count == 3 else "개인전"

            if team_count != 3 and players < 9:
                log.info("[%s] %s %d명 < 9 → 스킵", event_id, fmt, players)
                continue

            gr_raw  = detail.get("success", {}).get("grouped_rankings", {})
            grouped = gr_raw.get("", {}) if isinstance(gr_raw, dict) else {}
            count = 0
            for team in grouped.values():
                rank = team.get("rank")
                if not rank or rank > 8:
                    continue
                for member in team.get("team_member", []):
                    dc  = str(member.get("deck_recipe_id", "")).strip()
                    cls = member.get("deck_param1", "")
                    if dc:
                        all_entries.append({
                            "fmt": fmt, "date": date, "players": players,
                            "event_id": event_id, "rank": rank,
                            "class": cls, "deckCode": dc,
                        })
                        count += 1
            log.info("[%s] %s | %s | %d명 | %d건", event_id, title, fmt, players, count)

        if not all_entries:
            log.info("수집할 엔트리 없음")
            await browser.close()
            return

        # ── decklog 카드 수집 ──
        all_codes = list({e["deckCode"] for e in all_entries})
        log.info("=== decklog 수집: %d개 덱코드 ===", len(all_codes))

        deck_cards = {}
        for i, code in enumerate(all_codes, 1):
            raw = await fetch_deck_cards(page, code)
            if raw and raw.get("main"):
                main_n   = normalize_deck({c["code"]: c["count"] for c in raw["main"]}, canonical_map)
                evolve_r = raw.get("evolve") or []
                evolve_n = normalize_deck({c["code"]: c["count"] for c in evolve_r}, canonical_map) if evolve_r else {}
                deck_cards[code] = {"main": main_n, "evolve": evolve_n}
                log.info("  [%d/%d] %s → 메인 %d장 / 에볼브 %d장",
                         i, len(all_codes), code, sum(main_n.values()), sum(evolve_n.values()))
            else:
                deck_cards[code] = None
                log.info("  [%d/%d] %s → null", i, len(all_codes), code)
            await asyncio.sleep(1.5)

        await browser.close()

        # ── TSV 행 생성 ──
        kojin_lines, trio_lines = [], []

        for e in sorted(all_entries, key=lambda x: (x["date"], x["event_id"], x["rank"])):
            key = (e["event_id"], e["deckCode"], str(e["rank"]))
            d   = deck_cards.get(e["deckCode"])
            main_str   = repr(d["main"])   if d              else "null"
            evolve_str = repr(d["evolve"]) if d and d["evolve"] else "null"
            line = (f"{e['date']}\t{e['class']}\t{e['rank']}\t{e['players']}\t"
                    f"{e['deckCode']}\t{e['event_id']}\t{main_str}\t{evolve_str}")

            if e["fmt"] == "개인전":
                if key not in kojin_keys:
                    kojin_lines.append(line)
                    kojin_keys.add(key)
            else:
                if key not in trio_keys:
                    trio_lines.append(line)
                    trio_keys.add(key)

        log.info("=== 완료: 개인전 %d건, 트리오 %d건 ===", len(kojin_lines), len(trio_lines))
        append_lines(KOJIN_PATH, kojin_lines, dry_run)
        append_lines(TRIO_PATH,  trio_lines,  dry_run)


def main():
    parser = argparse.ArgumentParser(description="SVE 대회 데이터 수집")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--date",  help="특정 날짜 (예: 2026-03-17)")
    group.add_argument("--from",  dest="date_from", help="시작 날짜")
    parser.add_argument("--to",   dest="date_to",   help="종료 날짜 (--from과 함께)")
    parser.add_argument("--dry-run", action="store_true", help="파일에 쓰지 않고 결과만 출력")
    args = parser.parse_args()

    if args.date:
        date_from = date_to = args.date
    else:
        if not args.date_to:
            parser.error("--from 사용 시 --to 필요")
        date_from, date_to = args.date_from, args.date_to

    asyncio.run(run(date_from, date_to, args.dry_run))


if __name__ == "__main__":
    main()
