"""
CardRetriever: 카드 DB JSON에서 카드명/카드코드로 카드 정보를 조회한다.

data/carddb_json/*.json 파일을 모두 로드하여 이름/코드 인덱스를 빌드한다.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

CARDDB_DIR = Path(__file__).parent.parent / "data" / "carddb_json"


class CardRetriever:
    def __init__(self, carddb_dir: Path = CARDDB_DIR) -> None:
        self._db: dict[str, dict] = {}  # name -> card info
        self._db_by_code: dict[str, dict] = {}  # code -> card info
        self._load(carddb_dir)

    def _load(self, carddb_dir: Path) -> None:
        count = 0
        for json_path in sorted(carddb_dir.glob("*.json")):
            if "Zone" in json_path.name or "Identifier" in json_path.name:
                continue
            try:
                with open(json_path, encoding="utf-8-sig") as f:
                    cards: list[dict] = json.load(f)
            except Exception as e:
                print(f"[WARN] {json_path.name} 로드 실패: {e}")
                continue
            for card in cards:
                name = str(card.get("name", "")).strip()
                code = str(card.get("card_code", "")).strip()
                if name and name not in self._db:
                    self._db[name] = card
                if code and code not in self._db_by_code:
                    self._db_by_code[code] = card
                if name or code:
                    count += 1
        print(
            "[CardRetriever] 카드 DB 로드 완료: "
            f"{count}장 ({len(self._db)} 고유명 / {len(self._db_by_code)} 고유코드)"
        )

    def get(self, name: str) -> Optional[dict]:
        """카드명으로 카드 정보를 반환한다. 없으면 None."""
        return self._db.get(name.strip())

    def get_by_code(self, code: str) -> Optional[dict]:
        """카드코드로 카드 정보를 반환한다. 없으면 None."""
        return self._db_by_code.get(code.strip())

    def resolve(self, identifier: str) -> Optional[dict]:
        """입력이 카드코드면 코드 인덱스, 아니면 이름 인덱스로 조회한다."""
        ident = str(identifier).strip()
        if not ident:
            return None
        return self.get_by_code(ident) or self.get(ident)

    def normalize_code(self, identifier: str) -> Optional[str]:
        """카드명 또는 카드코드를 카드코드로 정규화한다."""
        info = self.resolve(identifier)
        if info is None:
            return None
        code = str(info.get("card_code", "")).strip()
        return code or None

    def retrieve(self, card_names: list[str]) -> dict:
        """
        카드명 목록을 조회하여 found/missing으로 분류해 반환한다.
        Returns:
            {
                "found": [{ "name": ..., "cost": ..., "attack": ..., "hp": ..., "effect": ..., ... }, ...],
                "missing": ["카드명", ...]
            }
        """
        found: list[dict] = []
        missing: list[str] = []
        for name in card_names:
            info = self.get(name)
            if info is not None:
                found.append(info)
            else:
                missing.append(name)
        return {"found": found, "missing": missing}

    def enrich_card_list(self, card_codes: list[str]) -> list[dict]:
        """
        카드 코드 목록을 받아 카드 정보를 반환한다. effect truncate 없이 전문 포함.
        Returns: [{ code, name, class, card_type, cost, attack, hp, effect }, ...]
        DB에 없는 코드는 { code, missing: True } 로 반환.
        """
        result: list[dict] = []
        for raw_code in card_codes:
            code = str(raw_code).strip()
            info = self.get_by_code(code)
            if info is None:
                result.append({"code": code, "missing": True})
                continue
            result.append(
                {
                    "code": code,
                    "name": info.get("name", ""),
                    "class": info.get("class", ""),
                    "card_type": info.get("card_type", ""),
                    "cost": info.get("cost", "-"),
                    "attack": info.get("attack", "-"),
                    "hp": info.get("hp", "-"),
                    "effect": info.get("effect", "") or "",
                }
            )
        return result

    def __len__(self) -> int:
        return len(self._db_by_code)
