#!/bin/bash
# setup.sh - claude-dbdを使ったプライベートタスク管理リポジトリのセットアップ
#
# 使い方:
#   ./setup.sh [ターゲットディレクトリ]
#
# 例:
#   ./setup.sh ~/works/my-tasks

set -e

# 出力用カラー
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# デフォルトのターゲットディレクトリ
TARGET_DIR="${1:-$HOME/works/my-tasks}"
FRAMEWORK_REPO="https://github.com/$(git config user.name 2>/dev/null || echo 'YOUR_USERNAME')/claude-dbd.git"

echo -e "${GREEN}=== Claude DBD セットアップ ===${NC}"
echo "プライベートタスクリポジトリを作成: $TARGET_DIR"
echo ""

# ターゲットが既に存在するかチェック
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}警告: ディレクトリ $TARGET_DIR は既に存在します。${NC}"
    read -p "続行しますか？ (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "中止しました。"
        exit 1
    fi
fi

# ターゲットディレクトリを作成
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# gitを初期化（まだの場合）
if [ ! -d ".git" ]; then
    echo -e "${GREEN}Gitリポジトリを初期化中...${NC}"
    git init
fi

# フレームワークリポジトリURLの入力
echo ""
echo -e "${YELLOW}claude-dbdリポジトリのURLを入力してください${NC}"
echo "(Enterでデフォルトを使用: $FRAMEWORK_REPO)"
read -p "> " CUSTOM_REPO
if [ -n "$CUSTOM_REPO" ]; then
    FRAMEWORK_REPO="$CUSTOM_REPO"
fi

# サブモジュールを追加
if [ ! -d "framework" ]; then
    echo -e "${GREEN}claude-dbdをサブモジュールとして追加中...${NC}"
    git submodule add "$FRAMEWORK_REPO" framework
else
    echo -e "${YELLOW}framework/ は既に存在します。サブモジュール追加をスキップ${NC}"
fi

# .claudeディレクトリとシンボリックリンクを作成
echo -e "${GREEN}.claude/skills シンボリックリンクを設定中...${NC}"
mkdir -p .claude
# 旧commands リンクがあれば削除
if [ -L ".claude/commands" ]; then
    rm .claude/commands
    echo "旧シンボリックリンクを削除: .claude/commands"
fi
if [ ! -L ".claude/skills" ]; then
    ln -s ../framework/skills .claude/skills
    echo "シンボリックリンクを作成: .claude/skills -> ../framework/skills"
else
    echo -e "${YELLOW}シンボリックリンクは既に存在します${NC}"
fi

# tasksディレクトリ構造を作成
echo -e "${GREEN}tasksディレクトリ構造を作成中...${NC}"
YEAR=$(date +%Y)
MONTH=$(date +%m)
mkdir -p "tasks/$YEAR/$MONTH"
mkdir -p "reports"

# CLAUDE.mdをコピーしてカスタマイズ
if [ ! -f "CLAUDE.md" ]; then
    echo -e "${GREEN}テンプレートからCLAUDE.mdを作成中...${NC}"
    cp framework/CLAUDE.md.template CLAUDE.md
    echo "CLAUDE.mdを作成しました - プロジェクトに合わせてカスタマイズしてください！"
else
    echo -e "${YELLOW}CLAUDE.mdは既に存在します。スキップ${NC}"
fi

# .gitignoreを作成
if [ ! -f ".gitignore" ]; then
    echo -e "${GREEN}.gitignoreを作成中...${NC}"
    cat > .gitignore << 'EOF'
# OS files
.DS_Store
Thumbs.db

# Editor files
*.swp
*.swo
*~

# Local overrides (optional)
.local/
EOF
fi

# 今日のファイルを作成
TODAY=$(date +%Y-%m-%d)
WEEKDAY=$(date +%a)
TODAY_FILE="tasks/$YEAR/$MONTH/$TODAY.md"

if [ ! -f "$TODAY_FILE" ]; then
    echo -e "${GREEN}今日のタスクファイルを作成中...${NC}"
    cat > "$TODAY_FILE" << EOF
---
date: $TODAY
weekday: $WEEKDAY
prev:
---

# $TODAY ($WEEKDAY)

## Carryover
<!-- 引き継ぎタスクなし -->

## Tasks
- [ ] タスク管理システムのセットアップ #setup

## Done
<!-- 成果をここに記録 -->

## Notes
<!-- ブロッカー、アイデア、メモ -->
EOF
    echo "作成: $TODAY_FILE"
fi

# 初回コミット
echo -e "${GREEN}初回コミットを作成中...${NC}"
git add -A
git commit -m "claude-dbdフレームワークで初期セットアップ

- claude-dbdをサブモジュールとして追加
- .claude/commandsシンボリックリンクを作成
- tasks/とreports/ディレクトリをセットアップ
- テンプレートからCLAUDE.mdを作成
- 初回の日次タスクファイルを作成"

echo ""
echo -e "${GREEN}=== セットアップ完了！ ===${NC}"
echo ""
echo "次のステップ:"
echo "  1. cd $TARGET_DIR"
echo "  2. CLAUDE.mdを編集してプロジェクト情報を追加"
echo "  3. プライベートGitHubリポジトリを作成してプッシュ:"
echo "     git remote add origin <your-private-repo-url>"
echo "     git push -u origin main"
echo "  4. Claude Codeで /today を実行して開始"
echo ""
echo "利用可能なコマンド:"
echo "  /today   - 今日のセッションを開始"
echo "  /add     - 新しいタスクを追加"
echo "  /done    - 成果を記録"
echo "  /monthly - 月次レポートを生成"
