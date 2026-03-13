# Repository Guidelines

## Project Structure & Module Organization
This repository is a Python-based data pipeline for Shadowverse EVOLVE meta analysis. Core scripts live in `scripts/`, including normalization (`normalize_cards.py`), clustering (`run_cluster.py`, `cluster.py`), weekly processing, and chart generation. RAG assembly lives in `rag/` with `pipeline.py`, `retriever.py`, and `prompt_builder.py`. Source data and generated artifacts are separated under `data/`: raw API captures in `data/raw/`, cleaned TSVs in `data/processed/`, analysis CSVs in `data/analysis/`, archetype YAML files in `data/archetypes/`, and card DB files in `data/carddb*`. Project notes and rule references live in `docs/`. Generated report outputs belong in `output/` and `reports/`.

## Build, Test, and Development Commands
Use direct Python entry points from the repository root:

```bash
python3 scripts/run_cluster.py
python3 scripts/card_stats.py
python3 rag/pipeline.py --tsv data/개인전_v2.txt --clusters data/analysis/deck_clusters.csv --out output/$(date +%Y%m%d)
python3 scripts/normalize_cards.py --carddb-dir data/carddb_json --test
```

`run_cluster.py` rebuilds archetype clusters, `card_stats.py` recalculates adoption statistics, `rag/pipeline.py` generates enriched output for report writing, and `normalize_cards.py --test` is the closest thing to a built-in validation check.

## Coding Style & Naming Conventions
Follow existing Python style: 4-space indentation, `snake_case` for functions and variables, `UPPER_SNAKE_CASE` for constants, and small single-purpose modules. Prefer `pathlib.Path`, type hints, and UTF-8-safe file handling because this repo mixes Korean and Japanese filenames. Keep new scripts executable with `#!/usr/bin/env python3` when they are intended as CLI entry points. Match existing CSV/TSV column names exactly when extending data processing.

## Testing Guidelines
There is no dedicated `pytest` suite yet. Validate changes by running the script you touched against repository sample data and checking regenerated outputs in `data/analysis/`, `output/`, or `reports/`. For normalization changes, run `python3 scripts/normalize_cards.py --carddb-dir data/carddb_json --test`. If you add non-trivial logic, include a self-test path or a reproducible command in the PR description.

## Commit & Pull Request Guidelines
Recent history uses short conventional prefixes such as `feat:` and `docs:`. Keep commit subjects imperative and specific, for example `feat: add weekly tournament TSV processor`. PRs should describe the pipeline stage affected, list commands used for validation, and note any regenerated data files. Include screenshots only when chart or report output changes materially.
