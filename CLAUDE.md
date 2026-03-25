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
| `@name` | 担当者/関係者 |
| `due:DATE` | 期限 |
| `_done:DATE` | 完了日 |

## 開発時の注意

- コマンドファイルはClaude向けの指示なので英語で記述
- ユーザー向けドキュメント（README.md, CLAUDE.md.template）は日本語
- setup.shの出力メッセージは日本語
