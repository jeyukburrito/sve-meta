#!/usr/bin/env python3
"""
docs/rules/*.md → data/rules_chunks.jsonl

청크 단위:
- 번호형 룰 파일 (01~15): X.Y 레벨 서브섹션 단위
- appendix_a_tokens.md: ## 헤더 단위
- svevolve_core_rules_*.md, INDEX.md: 제외 (CLAUDE.md Layer1으로 커버)
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES_DIR = ROOT / "docs" / "rules"
OUT_FILE = ROOT / "data" / "rules_chunks.jsonl"

# 제외 파일
SKIP_FILES = {"svevolve_core_rules_ja.md", "svevolve_core_rules_ko.md", "INDEX.md"}

# 번호형 룰 파일 패턴 (01_*.md ~ 15_*.md)
NUMBERED_FILE_RE = re.compile(r"^(\d{2})_")

# X.Y. 서브섹션 시작 패턴 (예: "5.6. 破壊する", "10.5. チェックタイミング")
# (?!\d) 로 X.Y.Z. 형식은 매칭 제외
SUBSECTION_RE = re.compile(r"^(\d+\.\d+)\.(?!\d)\s*(.+)")

# appendix_a 헤더 패턴
APPENDIX_HEADER_RE = re.compile(r"^##\s*●\s*(.+)")


def extract_keywords(text: str) -> list[str]:
    """텍스트에서 검색 키워드 추출 (괄호 안 용어, 카타카나 어휘 등)"""
    keywords = []
    # 『카드명』 패턴
    keywords += re.findall(r"『([^』]+)』", text)
    # '키워드' 패턴
    keywords += re.findall(r"'([^']{2,12})'", text)
    # 중요 일본어 능력 키워드
    ability_terms = [
        "ファンファーレ", "ラストワード", "進化時", "攻撃時", "守護", "疾走", "突進",
        "必殺", "ドレイン", "オーラ", "Quick", "チェックタイミング", "起動能力",
        "自動能力", "永続能力", "スペル能力", "置換効果", "継続効果", "単発効果",
        "コンボ", "スペルブースト", "スタック", "ネクロチャージ", "覚醒",
        "破壊", "消滅", "探す", "引く", "捨てる", "変身", "ダメージ", "回復",
        "エボルブ", "アドバンス", "スタンド", "アクト", "墓場", "消滅領域",
    ]
    for term in ability_terms:
        if term in text:
            keywords.append(term)
    return list(dict.fromkeys(keywords))  # 중복 제거, 순서 유지


def chunk_numbered_file(path: Path, file_num: str) -> list[dict]:
    """번호형 룰 파일을 X.Y 단위로 청크화"""
    lines = path.read_text(encoding="utf-8").splitlines()

    # 상단 주석 3줄 (# 주석) 파싱
    top_section = ""
    for line in lines[:5]:
        if line.startswith("#"):
            top_section = line.lstrip("# ").strip()
            break

    chunks = []
    current_id = None
    current_title = ""
    current_lines = []

    def flush(chunk_id, title, body_lines):
        text = "\n".join(body_lines).strip()
        if not text:
            return
        chunks.append({
            "id": f"r{file_num}_{chunk_id.replace('.', '_')}",
            "source": str(path.relative_to(ROOT)),
            "file_section": top_section,
            "subsection_id": chunk_id,
            "subsection_title": title,
            "text": text,
            "keywords": extract_keywords(text),
        })

    for line in lines:
        m = SUBSECTION_RE.match(line)
        if m:
            # 이전 청크 저장
            if current_id:
                flush(current_id, current_title, current_lines)
            current_id = m.group(1)
            current_title = m.group(2).strip()
            current_lines = [line]
        elif current_id:
            current_lines.append(line)

    if current_id:
        flush(current_id, current_title, current_lines)

    return chunks


def chunk_appendix_a(path: Path) -> list[dict]:
    """appendix_a_tokens.md를 ## ● 헤더 단위로 청크화"""
    lines = path.read_text(encoding="utf-8").splitlines()
    chunks = []
    current_title = ""
    current_lines = []
    chunk_idx = 0

    def flush(title, body_lines, idx):
        text = "\n".join(body_lines).strip()
        if not text:
            return
        chunks.append({
            "id": f"r_appendix_a_{idx:03d}",
            "source": str(path.relative_to(ROOT)),
            "file_section": "付録A：トークン一覧",
            "subsection_id": f"A.{idx}",
            "subsection_title": title,
            "text": text,
            "keywords": extract_keywords(text),
        })

    for line in lines:
        m = APPENDIX_HEADER_RE.match(line)
        if m:
            if current_title:
                flush(current_title, current_lines, chunk_idx)
                chunk_idx += 1
            current_title = m.group(1).strip()
            current_lines = [line]
        elif current_title:
            current_lines.append(line)

    if current_title:
        flush(current_title, current_lines, chunk_idx)

    return chunks


def chunk_generic_md(path: Path, file_id: str) -> list[dict]:
    """그 외 MD 파일: ## 헤더 단위로 청크화"""
    lines = path.read_text(encoding="utf-8").splitlines()
    chunks = []
    current_title = ""
    current_lines = []
    chunk_idx = 0

    def flush(title, body_lines, idx):
        text = "\n".join(body_lines).strip()
        if not text:
            return
        chunks.append({
            "id": f"r_{file_id}_{idx:03d}",
            "source": str(path.relative_to(ROOT)),
            "file_section": path.stem,
            "subsection_id": f"{file_id}.{idx}",
            "subsection_title": title,
            "text": text,
            "keywords": extract_keywords(text),
        })

    for line in lines:
        if line.startswith("## "):
            if current_title:
                flush(current_title, current_lines, chunk_idx)
                chunk_idx += 1
            current_title = line.lstrip("# ").strip()
            current_lines = [line]
        elif current_title:
            current_lines.append(line)
        else:
            # 첫 헤더 전 내용은 첫 청크에 포함
            current_lines.append(line)

    if current_lines:
        flush(current_title or path.stem, current_lines, chunk_idx)

    return chunks


def main():
    all_chunks = []

    md_files = sorted(RULES_DIR.glob("*.md"))
    for path in md_files:
        if path.name in SKIP_FILES:
            print(f"  skip: {path.name}")
            continue

        m = NUMBERED_FILE_RE.match(path.name)
        if m:
            file_num = m.group(1)
            chunks = chunk_numbered_file(path, file_num)
        elif path.name == "appendix_a_tokens.md":
            chunks = chunk_appendix_a(path)
        else:
            file_id = path.stem.replace("-", "_")
            chunks = chunk_generic_md(path, file_id)

        print(f"  {path.name}: {len(chunks)} chunks")
        all_chunks.extend(chunks)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"\n총 {len(all_chunks)}개 청크 → {OUT_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
