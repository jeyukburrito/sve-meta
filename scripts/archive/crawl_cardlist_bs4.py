#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import re
import time
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from bs4 import BeautifulSoup
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "BeautifulSoup4가 필요합니다. 설치: pip install beautifulsoup4"
    ) from exc

HEADER = ["card_code", "name", "class", "card_type", "sub_type", "cost", "attack", "hp", "effect"]
BASE_URL = "https://shadowverse-evolve.com"
CARDSEARCH_PATH = "/cardlist/cardsearch/"
CARDSEARCH_EX_PATH = "/cardlist/cardsearch_ex"
REQUEST_TIMEOUT = (10, 60)  # (connect, read)


def clean_text(text: str) -> str:
    text = html.unescape(text)
    text = text.replace("\xa0", " ").replace("\r", "")
    lines = [line.strip() for line in text.split("\n")]
    lines = [line for line in lines if line]
    return "\n".join(lines)


def read_detail_text(detail_div) -> str:
    parts: list[str] = []
    for node in detail_div.descendants:
        name = getattr(node, "name", None)
        if name == "img" and "icon-square" in (node.get("class") or []):
            alt = (node.get("alt") or "").strip()
            if alt:
                parts.append(f"【{alt}】")
        elif name == "br":
            parts.append("\n")
        elif isinstance(node, str):
            parts.append(node)

    text = "".join(parts)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return clean_text(text)


def first_text(el, default: str = "") -> str:
    if el is None:
        return default
    return clean_text(el.get_text("\n", strip=True))


def parse_card_links(src: str) -> dict[str, str]:
    soup = BeautifulSoup(src, "html.parser")
    links: dict[str, str] = {}

    # Support both full-page list items and fragment-only anchors returned by cardsearch_ex.
    anchors = soup.select("a[href*='cardno=']")
    for a in anchors:
        href = a.get("href", "")
        if "cardno=" not in href:
            continue

        code_node = a.select_one("p.number")
        code = first_text(code_node)
        if not code:
            parsed = parse_qs(urlparse(href).query)
            code = (parsed.get("cardno") or [""])[0]
        if not code:
            continue

        full_url = urljoin(BASE_URL, href)
        if code not in links:
            links[code] = full_url
    return links


def parse_detail_card_page(src: str, expected_code: str = "") -> list[str]:
    soup = BeautifulSoup(src, "html.parser")

    name = first_text(soup.select_one("h1.ttl"))
    status = soup.select_one("div.status")
    detail = soup.select_one("div.detail")
    speech = soup.select_one("div.speech")
    if not (name and status):
        raise ValueError("상세 페이지에서 카드 핵심 블록(.ttl/.status)을 찾지 못했습니다.")

    info_map: dict[str, str] = {}
    for dl in soup.select("div.info dl"):
        dt = first_text(dl.select_one("dt"))
        dd = first_text(dl.select_one("dd"))
        if dt:
            info_map[dt] = dd

    # Most pages keep card code in span.name (e.g. PR-000), while span.heading may be illustrator.
    code = (
        first_text(soup.select_one("div.illustrator span.name"))
        or first_text(soup.select_one("div.illustrator span.heading"))
        or expected_code
    )
    if not code:
        # Fallback to canonical URL / current URL link in document if present
        canon = soup.select_one("link[rel='canonical']")
        if canon and canon.get("href"):
            parsed = parse_qs(urlparse(canon.get("href")).query)
            code = (parsed.get("cardno") or [""])[0]

    def stat(cls_name: str) -> str:
        node = status.select_one(f"span.status-Item-{cls_name}")
        if node is None:
            return "-"
        heading = node.select_one("span.heading")
        if heading:
            heading.extract()
        return first_text(node, "-") or "-"

    effect = read_detail_text(detail) if detail is not None else first_text(speech, "")

    return [
        code,
        name,
        info_map.get("クラス", ""),
        info_map.get("カード種類", ""),
        info_map.get("タイプ", ""),
        stat("Cost"),
        stat("Power"),
        stat("Hp"),
        effect,
    ]


def extract_max_page(src: str) -> int:
    m = re.search(r"max_page\s*=\s*(\d+)\s*;", src)
    return int(m.group(1)) if m else 1


def fetch_list_pages(expansion: str, session: requests.Session) -> list[str]:
    pages: list[str] = []
    params = {"expansion": expansion, "view": "text", "sort": "new"}
    r1 = session.get(BASE_URL + CARDSEARCH_PATH, params=params, timeout=REQUEST_TIMEOUT)
    r1.raise_for_status()
    src1 = r1.text
    pages.append(src1)

    max_page = extract_max_page(src1)
    for page in range(2, max_page + 1):
        ex_params = {"expansion": expansion, "view": "text", "page": page}
        rx = session.get(BASE_URL + CARDSEARCH_EX_PATH, params=ex_params, timeout=REQUEST_TIMEOUT)
        rx.raise_for_status()
        pages.append(rx.text)

    return pages


def fetch_card_links_from_pages(pages: list[str]) -> dict[str, str]:
    links: dict[str, str] = {}
    for src in pages:
        links.update(parse_card_links(src))
    return links


def fetch_card_row(detail_url: str, expected_code: str, session: requests.Session) -> list[str] | None:
    # Guard against transient 5xx/timeout on specific card detail pages.
    for attempt in range(1, 4):
        try:
            res = session.get(detail_url, timeout=REQUEST_TIMEOUT)
            res.raise_for_status()
            row = parse_detail_card_page(res.text, expected_code=expected_code)
            if row[0] and expected_code and row[0] != expected_code:
                # Keep list-page code if detail-page heading mismatches unexpectedly.
                row[0] = expected_code
            elif not row[0]:
                row[0] = expected_code
            return row
        except requests.RequestException as e:
            if attempt >= 3:
                print(f"[WARN] skip {expected_code} ({detail_url}) after retries: {e}")
                return None
            time.sleep(1.5 * attempt)


def fetch_online(expansion: str, session: requests.Session) -> list[list[str]]:
    list_pages = fetch_list_pages(expansion, session)
    links = fetch_card_links_from_pages(list_pages)

    rows: list[list[str]] = []
    for code in sorted(links.keys()):
        row = fetch_card_row(links[code], code, session)
        if row is not None:
            rows.append(row)
    return rows


def write_csv(rows: list[list[str]], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(rows)


def build_expansion_sequence(start: str, end: str) -> list[str]:
    # Single literal code range: PR ~ PR
    if start == end and re.fullmatch(r"[A-Za-z0-9]+", start):
        return [start]

    m1 = re.fullmatch(r"([A-Za-z]+)(\d+)([A-Za-z]?)", start)
    m2 = re.fullmatch(r"([A-Za-z]+)(\d+)([A-Za-z]?)", end)
    if not (m1 and m2):
        raise ValueError("확장팩 코드는 BP07, CSD03a, 또는 PR~PR 같은 단일 코드 범위여야 합니다.")

    p1, n1, s1 = m1.group(1), int(m1.group(2)), (m1.group(3) or "").lower()
    p2, n2, s2 = m2.group(1), int(m2.group(2)), (m2.group(3) or "").lower()
    if p1 != p2:
        raise ValueError("시작/종료 확장팩 접두사는 같아야 합니다. 예: BP07~BP18, CSD03a~CSD03b")

    width = max(len(m1.group(2)), len(m2.group(2)))

    # Numeric-only range: BP07 ~ BP18
    if not s1 and not s2:
        if n1 > n2:
            raise ValueError("시작 번호가 종료 번호보다 클 수 없습니다.")
        return [f"{p1}{i:0{width}d}" for i in range(n1, n2 + 1)]

    # Suffix-letter range on the same numeric id: CSD03a ~ CSD03c
    if n1 == n2 and s1 and s2:
        if len(s1) != 1 or len(s2) != 1:
            raise ValueError("접미사는 한 글자 알파벳이어야 합니다.")
        a1, a2 = ord(s1), ord(s2)
        if a1 > a2:
            raise ValueError("시작 접미사가 종료 접미사보다 클 수 없습니다.")
        return [f"{p1}{n1:0{width}d}{chr(c)}" for c in range(a1, a2 + 1)]

    raise ValueError(
        "지원하지 않는 범위 형식입니다. 예: BP07~BP18 또는 CSD03a~CSD03c (동일 번호, 접미사 범위)"
    )


def crawl_expansion(expansion: str, output_path: Path) -> int:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8,ko;q=0.7",
            "Referer": "https://shadowverse-evolve.com/cardlist/",
        }
    )
    retry = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=1.0,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    rows = fetch_online(expansion, session)

    dedup: dict[str, list[str]] = {}
    for row in rows:
        code = row[0]
        if code not in dedup:
            dedup[code] = row

    sorted_rows = sorted(dedup.values(), key=lambda r: r[0])
    write_csv(sorted_rows, output_path)
    return len(sorted_rows)


def main() -> None:
    ap = argparse.ArgumentParser(description="Shadowverse EVOLVE 카드리스트 웹 크롤러 (BeautifulSoup 기반)")
    ap.add_argument("--expansion", default="CP01", help="예: CP01, BP01")
    ap.add_argument("--output", default="data/carddb/CP01.csv")
    ap.add_argument("--start-expansion", help="범위 수집 시작 코드. 예: BP07")
    ap.add_argument("--end-expansion", help="범위 수집 종료 코드. 예: BP18")
    ap.add_argument("--output-dir", default="data/carddb", help="범위 수집 시 출력 폴더")
    args = ap.parse_args()

    if args.start_expansion or args.end_expansion:
        if not (args.start_expansion and args.end_expansion):
            raise SystemExit("--start-expansion 과 --end-expansion 은 함께 지정해야 합니다.")

        expansions = build_expansion_sequence(args.start_expansion, args.end_expansion)
        out_dir = Path(args.output_dir)
        for expansion in expansions:
            out_path = out_dir / f"{expansion}.csv"
            count = crawl_expansion(expansion, out_path)
            print(f"wrote {count} rows to {out_path}")
        return

    out_path = Path(args.output)
    count = crawl_expansion(args.expansion, out_path)
    print(f"wrote {count} rows to {out_path}")


if __name__ == "__main__":
    main()
