# Shadowverse EVOLVE 総合ルール Layer 2: セクション別詳細ルール
# ver 1.24.1 準拠 (2026/01/29)

## 概要
Layer 1（コア要約）で判定できないエッジケースが発生した場合に、
該当セクションの原文を参照するためのファイル群です。

## ファイル一覧

| ファイル | サイズ | 内容 | 主な検索用途 |
|---------|--------|------|-------------|
| 01_game_overview.md | 6KB | 1章: ゲームの概要 | 勝敗判定、大原則の確認 |
| 02_card_info.md | 6KB | 2章: カードの情報 | カード属性の定義、両面カード |
| 03_player_info.md | 3KB | 3章: プレイヤーに関する情報 | オーナー/マスター、PP/EP/SEP詳細 |
| 04_zones.md | 13KB | 4章: 領域 | 各領域の詳細ルール、配置状態 |
| 05_special_notation.md | 24KB | 5章: 特定表記 | 破壊/消滅/探す/ダメージ等の厳密定義 |
| 06_game_setup.md | 5KB | 6章: ゲームの準備 | デッキ構築条件、ゲーム前手順 |
| 07_game_flow.md | 4KB | 7章: ゲームの進行 | ターン構造、各フェイズ詳細 |
| 08_main_phase.md | 5KB | 8章: メインフェイズの処理 | カードプレイ/攻撃の詳細手順 |
| 09_special_cards.md | 3KB | 9章: 特殊なカード類の処理 | トークン/アドバンスカードの挙動 |
| 10_play_resolve.md | 28KB | 10章: プレイと解決 | 能力分類/コスト/チェックタイミング/効果処理 |
| 11_rule_processing.md | 5KB | 11章: ルール処理 | 敗北/破壊/超過等の自動処理 |
| 12_keywords.md | 10KB | 12章: キーワード能力 | 全キーワード能力の厳密定義 |
| 13_class_keywords.md | 6KB | 13章: クラス別キーワード | クラス固有キーワードの厳密定義 |
| 14_title_keywords.md | 14KB | 14章: タイトル別キーワード | タイトル固有キーワードの厳密定義 |
| 15_misc.md | 2KB | 15章: その他 | カウンター、永久循環 |
| appendix_a_tokens.md | 30KB | 付録A: トークン一覧 | 全トークンのステータス/テキスト |
| appendix_b_formats.md | 4KB | 付録B: 特殊フォーマット | シールド戦、クロスオーバー |
| appendix_c_updates.md | 1KB | 付録C: 更新項目 | バージョン変更点 |

**合計: 約170KB (18ファイル)**

## よくある参照パターン

| 質問の種類 | 参照すべきファイル |
|-----------|-------------------|
| 「破壊と消滅の違いは？」 | 05_special_notation.md |
| 「進化の正確な手順は？」 | 08_main_phase.md → 10_play_resolve.md |
| 「ファンファーレはいつ誘発？」 | 12_keywords.md |
| 「スタックの処理は？」 | 13_class_keywords.md |
| 「ドライブチェックの詳細は？」 | 14_title_keywords.md |
| 「このトークンのテキストは？」 | appendix_a_tokens.md |
| 「置換効果の優先順位は？」 | 10_play_resolve.md (10.2, 10.7) |
| 「チェックタイミングの流れは？」 | 10_play_resolve.md (10.5) |
| 「場の上限を超えたら？」 | 11_rule_processing.md |

## CLI Agentでの使い方

### Claude Code
```markdown
<!-- CLAUDE.md に追記 -->
ルール判定が必要な場合は rules/ ディレクトリ内の該当ファイルを読んで判定すること。
コア要約は svevolve_core_rules_ja.md を参照。詳細判定は rules/ 内のセクションファイルを参照。
```

### Gemini CLI
```bash
# 特定セクションだけコンテキストに追加
cat rules/10_play_resolve.md | gemini "チェックタイミングの処理順序を教えて"

# 複数セクション結合
cat rules/12_keywords.md rules/13_class_keywords.md | gemini "スタックと土の秘術の関係を説明して"
```

### Codex
```bash
# プロジェクトルートに配置
cp -r rules/ ./rules/
# Codex は自動的にプロジェクト内ファイルを参照可能
```

### 全エージェント共通: grep検索
```bash
# 特定ルール番号で検索
grep -r "10.5.1" rules/

# キーワードで検索
grep -rl "置換効果" rules/

# 特定トークンの情報
grep -A2 "ゴースト" rules/appendix_a_tokens.md
```
