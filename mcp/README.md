# dbd-mcp-server

aquila-claude-dbd のタスク管理機能に他のプロジェクトからアクセスするための MCP サーバー。

## 機能

| ツール | 説明 |
|--------|------|
| `dbd_today` | 今日のタスク一覧を取得（ファイルがなければ作成） |
| `dbd_add` | 新しいタスクを追加 |
| `dbd_done` | タスクを完了にする |
| `dbd_log` | 活動をタイムスタンプ付きで記録 |
| `dbd_note` | メモや引き継ぎを記録 |
| `dbd_prioritize` | タスク優先度分析（営業日残・effort・impact） |
| `dbd_report` | 日報を自動生成 |

## インストール

```bash
cd framework/mcp
npm install
npm run build
```

## 設定

MCPサーバーは環境変数 `DBD_ROOT` で aquila-claude-dbd のルートディレクトリを指定します。

### Claude Code CLI での登録

```bash
claude mcp add \
  --transport stdio \
  --env DBD_ROOT=/path/to/aquila-claude-dbd \
  dbd -- node /path/to/aquila-claude-dbd/framework/mcp/build/index.js
```

### プロジェクトごとの設定（.mcp.json）

プロジェクトルートに `.mcp.json` を作成:

```json
{
  "mcpServers": {
    "dbd": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/aquila-claude-dbd/framework/mcp/build/index.js"],
      "env": {
        "DBD_ROOT": "/path/to/aquila-claude-dbd"
      }
    }
  }
}
```

### ユーザー設定での登録（全プロジェクト共通）

```bash
claude mcp add \
  --scope user \
  --transport stdio \
  --env DBD_ROOT=/path/to/aquila-claude-dbd \
  dbd -- node /path/to/aquila-claude-dbd/framework/mcp/build/index.js
```

## ツールの使用方法

### dbd_today

今日のタスク一覧を取得します。ファイルが存在しない場合は新規作成されます。

**入力パラメータ**: なし

**出力例**:
```
# Today's Tasks (2026-03-25)

## Summary
- Total tasks: 5
- Incomplete: 3
- Completed: 2

## Incomplete Tasks
1. [ ] API実装 #backend
2. [ ] ドキュメント更新 #docs
3. [ ] コードレビュー #review

## Raw File Content
...
```

### dbd_add

新しいタスクを追加します。

**入力パラメータ**:
- `task` (必須): タスクの説明
- `due` (オプション): 期限（YYYY-MM-DD形式）
- `tags` (オプション): タグの配列（例: `["#project", "@person"]`）

**使用例**:
```json
{
  "task": "API実装",
  "due": "2026-03-26",
  "tags": ["#backend", "@bob"]
}
```

### dbd_done

タスクを完了にします。

**入力パラメータ**:
- `taskIndex` (必須): タスク番号（1から始まるインデックス）
- `accomplishment` (オプション): 成果の説明

**使用例**:
```json
{
  "taskIndex": 1,
  "accomplishment": "認証APIを実装し、テストも追加"
}
```

### dbd_log

活動をタイムスタンプ付きでDoneセクションに記録します。

**入力パラメータ**:
- `activity` (必須): 活動の説明

**使用例**:
```json
{
  "activity": "認証バグを修正 #backend"
}
```

**出力例**:
```
Logged at 14:30:
- 認証バグを修正 #backend

Date: 2026-03-25
```

### dbd_report

日報を自動生成します。

**入力パラメータ**:
- `date` (オプション): 日付（YYYY-MM-DD形式、デフォルト: 今日）

**使用例**:
```json
{
  "date": "2026-03-25"
}
```

**出力例**:
```markdown
# 日報 2026-03-25 (Tue)

## サマリー

- タスク総数: 5
- 完了: 3
- 未完了: 2
- 達成率: 60%

## 完了したタスク

- API実装 #backend
- ドキュメント更新 #docs

## 活動ログ

- 09:30 朝会
- 14:30 認証バグを修正 #backend

## 残タスク

- コードレビュー (期限: 2026-03-26)
```

## 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# ビルドせずに実行（開発時）
npx tsx src/index.ts
```

## トラブルシューティング

### DBD_ROOT environment variable is not set

MCP登録時に `--env DBD_ROOT=...` を指定してください。

### Task file not found

`dbd_today` を先に実行して、今日のタスクファイルを作成してください。

## ライセンス

MIT
