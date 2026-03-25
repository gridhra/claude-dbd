# claude-dbd

Claude Code CLI向けの日次タスク管理システム

## 特徴

- **ローカルファースト**: データはすべてリポジトリ内に保存、Git管理
- **シンプルなタグ記法**: `#project`, `@person`, `due:DATE`
- **セッション継続性**: 未完了タスクの自動引き継ぎ
- **スラッシュコマンド**: `/today`, `/add`, `/done`, `/monthly`

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
| `/today` | 今日のセッションを開始。前日からの未完了タスクを引き継いで日次ファイルを作成 |
| `/add [タスク]` | 新しいタスクを追加。タグ対応: `#project`, `@person`, `due:DATE` |
| `/done` | 対話的にタスクを完了にし、成果を記録 |
| `/monthly` | 月次サマリーレポートを生成 |

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

## Notes
- ブロッカー: API認証情報待ち
```

### タグ一覧

| タグ | 用途 | 例 |
|-----|------|-----|
| `#tag` | プロジェクト/カテゴリ | `#api`, `#docs`, `#urgent` |
| `@name` | 担当者/関係者 | `@client`, `@team` |
| `due:DATE` | 期限 | `due:2026-03-25` |
| `_done:DATE` | 完了日（自動付与） | `_done:2026-03-25` |

## 日常のワークフロー

```
朝:
  $ claude
  > /today        # 今日のファイルを作成、引き継ぎタスクを表示

日中:
  > /add ログインバグ修正 #auth
  > /add PRレビュー @alice due:2026-03-26

終業時:
  > /done         # タスクを完了にし、やったことを記録

月末:
  > /monthly      # サマリーレポートを生成
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

## ライセンス

MIT
