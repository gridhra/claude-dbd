# claude-dbd

Claude Code CLI向けの日次タスク管理システム

## 特徴

- **ローカルファースト**: データはすべてリポジトリ内に保存、Git管理
- **シンプルなタグ記法**: `#project`, `@person`, `due:DATE`
- **セッション継続性**: 未完了タスクの自動引き継ぎ
- **スラッシュコマンド**: `/dbd:today`, `/dbd:add`, `/dbd:done`, `/dbd:monthly`

## クイックスタート

### 方法1: セットアップスクリプトを使用

```bash
# このリポジトリをクローン
git clone https://github.com/YOUR_USERNAME/claude-dbd.git
cd claude-dbd

# セットアップスクリプトでプライベートリポジトリを作成
./setup.sh ~/works/my-tasks
```

### 方法2: 手動セットアップ

```bash
# プライベートリポジトリを作成
mkdir ~/works/my-tasks && cd ~/works/my-tasks
git init

# claude-dbdをサブモジュールとして追加
git submodule add https://github.com/YOUR_USERNAME/claude-dbd.git framework

# コマンド用のシンボリックリンクを作成
mkdir -p .claude
ln -s ../framework/commands .claude/commands

# CLAUDE.mdテンプレートをコピー
cp framework/CLAUDE.md.template CLAUDE.md

# ディレクトリ構造を作成
mkdir -p tasks/$(date +%Y)/$(date +%m) reports

# コミットしてプライベートリポジトリにプッシュ
git add -A
git commit -m "Initial setup"
git remote add origin <your-private-repo-url>
git push -u origin main
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `/dbd:today` | 今日のセッションを開始。前日からの未完了タスクを引き継いで日次ファイルを作成。前日のHandoffがあれば表示 |
| `/dbd:add [タスク...]` | 新しいタスクを追加（複数可、引数なしで対話モード）。タグ対応: `#project`, `@person`, `due:DATE` |
| `/dbd:log <内容>` | やったことをタイムスタンプ付きで即座に記録（Doneセクションに追記） |
| `/dbd:note [内容]` | メモや引き継ぎを記録（Notes/Handoffセクションに振り分け） |
| `/dbd:done` | 対話的にタスクを完了にし、成果を記録 |
| `/dbd:report [YYYY-MM-DD]` | 日報を自動生成（引数省略で今日） |
| `/dbd:prioritize` | タスク優先度分析（営業日残・effort・impact考慮） |
| `/dbd:monthly [YYYY-MM]` | 月次サマリーレポートを生成（引数省略で今月） |

## ディレクトリ構成

```
my-tasks/                     # あなたのプライベートリポジトリ
├── framework/                # claude-dbdサブモジュール
│   └── commands/
├── .claude/
│   └── commands -> ../framework/commands
├── CLAUDE.md                 # カスタマイズしたコンテキスト
├── tasks/
│   └── 2026/
│       └── 03/
│           ├── 2026-03-24.md
│           └── 2026-03-25.md
└── reports/
    └── 2026-03.md
```

## ファイル形式

### 日次タスクファイル (`tasks/YYYY/MM/YYYY-MM-DD.md`)

```markdown
---
date: 2026-03-25
weekday: Tue
prev: 2026-03-24
---

# 2026-03-25 (Tue)

## Carryover
- [ ] 昨日からの未完了タスク #project

## Tasks
- [ ] 今日の新しいタスク #api due:2026-03-26
- [ ] 別のタスク @teammate
- [x] 完了したタスク _done:2026-03-25

## Done
- ユーザー認証を実装
- チェックアウトのバグを修正

## Handoff
### 18:00
#### 所感
- 予定より進んだ

#### 引き継ぎ
- 認証周りのテスト追加が必要

#### 明日の優先
- テスト追加

## Notes
- ブロッカー: API認証情報待ち
```

### タグ一覧

| タグ | 用途 | 例 |
|-----|------|-----|
| `#tag` | プロジェクト/カテゴリ | `#api`, `#docs`, `#urgent` |
| `@name` | 担当者/関係者 | `@client`, `@team` |
| `due:DATE` | 期限 | `due:2026-03-25` |
| `effort:X` | 作業の重さ (S/M/L/XL) | `effort:M` |
| `impact:X` | インパクト (L/M/H/C) | `impact:H` |
| `_done:DATE` | 完了日（自動付与） | `_done:2026-03-25` |

## 日常のワークフロー

```
朝:
  $ claude
  > /dbd:today        # 今日のファイルを作成、引き継ぎタスクを表示

日中:
  > /dbd:add ログインバグ修正 #auth
  > /dbd:add PRレビュー @alice due:2026-03-26
  > /dbd:log API認証機能を実装した #backend
  > /dbd:log PRレビュー完了 @alice
  > /dbd:note デバッグ手順のメモ  # Notesセクションに記録

終業時:
  > /dbd:done         # タスクを完了にし、やったことを記録
  > /dbd:note         # 所感・引き継ぎをHandoffセクションに記録

月末:
  > /dbd:monthly      # サマリーレポートを生成
```

## フレームワークの更新

`claude-dbd`に更新があった場合:

```bash
cd my-tasks/framework
git pull origin main
cd ..
git add framework
git commit -m "Update claude-dbd framework"
```

## フレームワークへの貢献

`framework/`はサブモジュールなので、そこで変更を加えられます:

```bash
cd my-tasks/framework
# 改善を加える
git add -A
git commit -m "Improve /today command"
git push origin main
cd ..
git add framework
git commit -m "Update framework submodule"
```

## MCPサーバー

他のプロジェクトからタスク管理機能にアクセスするためのMCPサーバーも提供しています。

### MCPツール

| ツール | 説明 |
|--------|------|
| `dbd_today` | 今日のタスク一覧を取得（前日Handoff表示付き） |
| `dbd_add` | 新しいタスクを追加 |
| `dbd_done` | タスクを完了にする |
| `dbd_log` | 活動をタイムスタンプ付きで記録 |
| `dbd_note` | メモや引き継ぎを記録 |
| `dbd_prioritize` | タスク優先度分析 |
| `dbd_report` | 日報を自動生成 |

### セットアップ

```bash
# MCPサーバーをビルド
cd framework/mcp
npm install
npm run build

# Claude Codeに登録
claude mcp add \
  --transport stdio \
  --env DBD_ROOT=/path/to/aquila-claude-dbd \
  dbd -- node /path/to/aquila-claude-dbd/framework/mcp/build/index.js
```

詳細は [mcp/README.md](mcp/README.md) を参照してください。

## ライセンス

MIT
