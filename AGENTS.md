# Repository Guidelines

## Project Structure & Module Organization
This repository combines a Python data pipeline with a Next.js tracker app. Core analysis scripts live in `scripts/`, including card normalization, clustering, weekly processing, and stats generation. RAG assembly lives in `rag/` with `pipeline.py`, `retriever.py`, and `prompt_builder.py`. Data is organized under `data/`: raw captures in `data/raw/`, cleaned files in `data/processed/`, analysis outputs in `data/analysis/`, archetype definitions in `data/archetypes/`, and card database files in `data/carddb*`. Reports and generated artifacts belong in `reports/` and `output/`. The web frontend is isolated in `webapp/`.

## Build, Test, and Development Commands
Run commands from the repository root unless noted otherwise.

- `python scripts/run_cluster.py`: rebuild deck and archetype cluster outputs.
- `python scripts/card_stats.py`: recalculate card adoption and usage statistics.
- `python rag/pipeline.py --tsv data/개인전_v2.txt --clusters data/analysis/deck_clusters.csv --out output/<date>`: generate enriched RAG output for reporting.
- `python scripts/normalize_cards.py --carddb-dir data/carddb_json --test`: validate card normalization logic against the local card DB.
- `cd webapp; npm install; npm run dev`: start the tracker app locally.

## Coding Style & Naming Conventions
Use 4-space indentation in Python and keep modules small and single-purpose. Prefer `snake_case` for functions and variables, `UPPER_SNAKE_CASE` for constants, and `Path` from `pathlib` for file handling. Use UTF-8-safe reads and writes because filenames and content may include Korean and Japanese text. Match existing CSV and TSV column names exactly when extending pipeline logic.

## Testing Guidelines
There is no dedicated `pytest` suite yet. Validate changes by running the script you modified against repository sample data and reviewing regenerated files in `data/analysis/`, `output/`, or `reports/`. For normalization changes, always run `python scripts/normalize_cards.py --carddb-dir data/carddb_json --test`. If you add non-trivial logic, include a reproducible validation command in your PR.

## Commit & Pull Request Guidelines
Recent history uses short conventional prefixes such as `fix:`, `fix(webapp):`, `docs(webapp):`, and `build(webapp):`. Keep commit subjects imperative and specific, for example `feat: add weekly tournament TSV processor`. PRs should describe the affected pipeline stage or app area, list validation commands, and note any regenerated outputs. Include screenshots when `webapp/` UI changes materially.
