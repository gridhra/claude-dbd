# claude-dbd フレームワーク開発

Claude Code CLI向けの日次タスク管理フレームワーク

## プロジェクト概要

このリポジトリは公開フレームワークです。ユーザーは自分のプライベートリポジトリにサブモジュールとして組み込んで使用します。

## ディレクトリ構成

```
claude-dbd/
├── skills/                    # スキル定義（SKILL.md形式）
│   ├── dbd:today/SKILL.md    # 今日のセッション開始
│   ├── dbd:add/SKILL.md      # タスク追加
│   ├── dbd:done/SKILL.md     # 完了報告
│   ├── dbd:log/SKILL.md      # 活動記録
│   ├── dbd:note/SKILL.md     # メモ・引き継ぎ
│   ├── dbd:report/SKILL.md   # 日報生成
│   ├── dbd:prioritize/SKILL.md # 優先度分析
│   ├── dbd:gh-done/SKILL.md  # GitHub活動取得
│   ├── dbd:monthly/SKILL.md  # 月次レポート
│   └── dbd:commit/SKILL.md   # コミット
├── mcp/                       # MCPサーバー（TypeScript実装）
├── CLAUDE.md                  # このファイル（開発用コンテキスト）
├── CLAUDE.md.template         # ユーザー向けテンプレート
├── setup.sh                   # セットアップスクリプト
└── README.md                  # ユーザー向けドキュメント
```

## スキル開発ガイドライン

### SKILL.mdの構成

各スキル（`skills/dbd:xxx/SKILL.md`）は以下の構成に従う:

1. **frontmatter** - name, description, argument-hint
2. **動作** - 実行時の動作フロー
3. **手順** - Claudeへの具体的な指示
4. **出力形式** - 期待される出力

### frontmatterの書き方

```yaml
---
name: dbd:xxx
description: 日本語の簡潔な説明（いつ使うかを含む）
argument-hint: "[引数の説明]"  # 引数があるもののみ
---
```

### 言語

- スキルファイル（SKILL.md）は全て日本語で記述
- ユーザー向けドキュメント（README.md, CLAUDE.md.template）も日本語
- setup.shの出力メッセージも日本語

### タスクファイル形式

日次ファイル（`tasks/YYYY/MM/YYYY-MM-DD.md`）:

```markdown
---
date: YYYY-MM-DD
weekday: Day
prev: YYYY-MM-DD
---

# YYYY-MM-DD (Day)

## Carryover
## Tasks
## Done
## Handoff
## Notes
```

### タグ記法

| 記法 | 用途 |
|------|------|
| `#tag` | カテゴリ/プロジェクト |
| `due:DATE` | 期限 |
| `effort:X` | 作業の重さ（S/M/L/XL） |
| `impact:X` | インパクト（L/M/H/C） |
| `_done:DATE` | 完了日 |

## スキル変更時の同期ルール（必須）

**スキルファイル（`skills/dbd:xxx/SKILL.md`）を変更した場合、以下のファイルも必ず同期すること：**

1. `framework/README.md` - コマンド一覧、使用例
2. `framework/CLAUDE.md.template` - コマンド早見表、ワークフロー例
3. `../CLAUDE.md`（親リポジトリ） - コマンド早見表、ワークフロー例

### 同期が必要な変更

- コマンド名の変更
- コマンドの追加・削除
- コマンドの使用方法・引数の変更
- コマンドの動作仕様の変更

### 同期チェックリスト

```
[ ] skills/dbd:xxx/SKILL.md を変更
[ ] framework/README.md を更新
[ ] framework/CLAUDE.md.template を更新
[ ] ../CLAUDE.md を更新（親リポジトリがある場合）
```

**注意**: このルールはClaude Codeが自動的に従う。スキル変更を依頼された場合、関連ドキュメントも同時に更新すること。
