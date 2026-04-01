# claude-dbd フレームワーク開発

Claude Code CLI向けの日次タスク管理フレームワーク

## プロジェクト概要

このリポジトリは公開フレームワークです。ユーザーは自分のプライベートリポジトリにサブモジュールとして組み込んで使用します。

## ディレクトリ構成

```
claude-dbd/
├── commands/           # スラッシュコマンド定義
│   ├── dbd:today.md   # 今日のセッション開始
│   ├── dbd:done.md    # 完了報告
│   ├── dbd:add.md     # タスク追加
│   └── dbd:monthly.md # 月次レポート
├── CLAUDE.md          # このファイル（開発用コンテキスト）
├── CLAUDE.md.template # ユーザー向けテンプレート
├── setup.sh           # セットアップスクリプト
└── README.md          # ユーザー向けドキュメント
```

## コマンド開発ガイドライン

### コマンドファイルの構成

各コマンドファイル（`commands/*.md`）は以下の構成に従う:

1. **タイトルと概要** - コマンドの目的
2. **Behavior** - 実行時の動作フロー
3. **Instructions** - Claudeへの具体的な指示
4. **Output** - 期待される出力形式

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
## Notes
```

### タグ記法

| 記法 | 用途 |
|------|------|
| `#tag` | カテゴリ/プロジェクト |
| `due:DATE` | 期限 |
| `_done:DATE` | 完了日 |

## 開発時の注意

- コマンドファイルはClaude向けの指示なので英語で記述
- ユーザー向けドキュメント（README.md, CLAUDE.md.template）は日本語
- setup.shの出力メッセージは日本語

## コマンド変更時の同期ルール（必須）

**コマンドファイル（`commands/*.md`）を変更した場合、以下のファイルも必ず同期すること：**

1. `framework/README.md` - コマンド一覧、使用例
2. `framework/CLAUDE.md.template` - コマンド早見表、ワークフロー例
3. `../CLAUDE.md`（親リポジトリ） - コマンド早見表、ワークフロー例

### 同期が必要な変更

- コマンド名の変更（例: `/add` → `/dbd:add`）
- コマンドの追加・削除
- コマンドの使用方法・引数の変更
- コマンドの動作仕様の変更

### 同期チェックリスト

```
[ ] commands/*.md を変更
[ ] framework/README.md を更新
[ ] framework/CLAUDE.md.template を更新
[ ] ../CLAUDE.md を更新（親リポジトリがある場合）
```

**注意**: このルールはClaude Codeが自動的に従う。コマンド変更を依頼された場合、関連ドキュメントも同時に更新すること。
