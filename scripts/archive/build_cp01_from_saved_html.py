#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import re
from pathlib import Path

INPUT_HTML = Path("コラボパック「ウマ娘 プリティーダービー」 _ カードリスト _ Shadowverse EVOLVE（シャドウバース エボルヴ）公式サイト.html")
OUTPUT_CSV = Path("data/carddb/CP01.csv")

HEADER = ["card_code", "name", "class", "card_type", "sub_type", "cost", "attack", "hp", "effect"]
DEFAULT_CLASS = "ウマ娘 プリティーダービー"


def clean_text(raw: str) -> str:
    # Convert icon images to bracket keywords (e.g. <img alt="ファンファーレ"> -> 【ファンファーレ】)
    text = re.sub(
        r'<img[^>]*class="icon-square"[^>]*alt="([^"]+)"[^>]*>',
        lambda m: f"【{m.group(1)}】",
        raw,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ").replace("\r", "")
    lines = [line.strip() for line in text.split("\n")]
    lines = [line for line in lines if line]
    return "\n".join(lines)


def extract(span_html: str, heading: str) -> str:
    m = re.search(
        rf'<span class="status-Item status-Item-{heading}">\s*<span class="heading heading-{heading}">[^<]*</span>\s*([^<]+)\s*</span>',
        span_html,
        flags=re.IGNORECASE,
    )
    return m.group(1).strip() if m else "-"


def parse_rows(page: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for m in re.finditer(r"<li><a href=\"https://shadowverse-evolve\.com/cardlist/\?cardno=CP01-[^\"]+\".*?</li>", page, flags=re.DOTALL):
        block = m.group(0)

        code_m = re.search(r'<p class="number">(CP01-[0-9A-Z]+)</p>', block)
        name_m = re.search(r'<p class="ttl">(.*?)</p>', block, flags=re.DOTALL)
        status_m = re.search(r'<div class="status">(.*?)</div>', block, flags=re.DOTALL)
        detail_m = re.search(r'<div class="detail">\s*<p>(.*?)</p>\s*</div>', block, flags=re.DOTALL)

        if not (code_m and name_m and status_m and detail_m):
            continue

        code = code_m.group(1).strip()
        name = clean_text(name_m.group(1))
        status_html = status_m.group(1)
        status_items = re.findall(r'<span class="status-Item">(.*?)</span>', status_html, flags=re.DOTALL)
        status_items = [clean_text(x) for x in status_items]

        card_type = status_items[0] if len(status_items) > 0 else ""
        sub_type = status_items[1] if len(status_items) > 1 else ""

        cost = extract(status_html, "Cost")
        attack = extract(status_html, "Power")
        hp = extract(status_html, "Hp")
        effect = clean_text(detail_m.group(1))

        rows.append([code, name, DEFAULT_CLASS, card_type, sub_type, cost, attack, hp, effect])

    return rows


def main() -> None:
    src = INPUT_HTML.read_text(encoding="utf-8")
    rows = parse_rows(src)
    rows.sort(key=lambda r: r[0])

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(rows)

    print(f"wrote {len(rows)} rows to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
