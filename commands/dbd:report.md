# /dbd:report - Generate Daily Report

Generate a summary report of the day's tasks and activities.

## Usage

```
/dbd:report [YYYY-MM-DD]
```

## Examples

```
/dbd:report           # Generate report for today
/dbd:report 2026-03-24  # Generate report for specific date
```

## Behavior

1. **Read the task file** for the specified date (default: today)
2. **Analyze** activity logs and extract key accomplishments
3. **Interview** the user to fill gaps and confirm handoff items
4. **Filter** remaining tasks to only show tomorrow's priorities
5. **Generate** a formatted daily report in Japanese

## Instructions

1. Get the target date:
   - If argument provided, use it as the date
   - Otherwise use today: `date +%Y-%m-%d`

2. Read the task file:
   ```bash
   cat tasks/$(date +%Y)/$(date +%m)/{DATE}.md
   ```

3. If the file doesn't exist:
   - Inform user: "タスクファイルが見つかりません: {DATE}"
   - Exit

4. Parse the file and extract:
   - Done section entries (activity log)
   - Incomplete tasks with due dates
   - Notes section entries

5. **Interview the user** (対話形式で確認):

   タスクファイルを読んだ後、以下の形式でユーザーに確認を求める。
   **ツールは使わず、通常のテキスト出力で質問し、ユーザーの返答を待つ。**

   ```
   ## 日報作成: {DATE}

   ### 現在の記録

   **Done:**
   - [Doneセクションの内容を箇条書きで表示]
   - （空の場合は「記録なし」）

   **Handoff:**
   - [Handoffセクションの内容を箇条書きで表示]
   - （空の場合は「記録なし」）

   ---

   ### 追加・修正があれば教えてください

   - 他にやったこと
   - 明日への引き継ぎ
   - 成果物の添付（スクショやコードなど）

   **なければ「ok」と入力してください。**
   ```

   ユーザーの返答に応じて:
   - 「ok」「特になし」等 → そのまま日報生成へ進む
   - 追加内容あり → Doneセクション/Handoffセクションを更新してから日報生成

6. Generate accomplishments summary:
   - Analyze activity log entries
   - Group related items and create a concise summary (1-2 sentences)
   - This goes at the TOP of the report

7. Filter remaining tasks:
   - Only include tasks due tomorrow or earlier (overdue)
   - Do NOT include tasks due later than tomorrow

8. Generate and display the report in the following format:

## Output Format (Slack mrkdwn最適化)

Slackは標準Markdownではなく独自の「mrkdwn」形式を使用する。
以下の形式で出力すること:

```
:memo: *日報 MM/DD (Weekday)*

:white_check_mark: *本日の成果*
[1-2文の成果サマリー]

:pencil: *活動ログ*
• Activity 1
• Activity 2

:arrow_right: *明日やること*
• Task 1 (MM/DD)
• Task 2 (MM/DD)

:speech_balloon: *メモ*
[メモがあれば記載、なければセクションごと省略]
```

### Slack mrkdwn 記法ルール

| 要素 | 正しい書き方 | 間違い |
|------|-------------|--------|
| 太字 | `*text*` | `**text**` |
| 斜体 | `_text_` | `*text*` |
| 箇条書き | `• ` または `* ` | `- ` |
| 見出し | `*太字*` + 絵文字 | `# ` `## ` |

### 絵文字ガイド

- `:memo:` 📝 - 日報タイトル
- `:white_check_mark:` ✅ - 成果
- `:pencil:` ✏️ - 活動ログ
- `:arrow_right:` ➡️ - 明日やること
- `:speech_balloon:` 💬 - メモ
- `:warning:` ⚠️ - 注意事項・ブロッカー

### Key Points

- *太字+絵文字*でセクション見出しを作る（`#`は使えない）
- 箇条書きは `•` を使用（`-` より視認性が良い）
- 日付は `MM/DD` 形式（短く）
- メモが空ならセクションごと省略してコンパクトに

## Clipboard Copy

After generating the report, **automatically copy it to clipboard** using:

```bash
echo "{REPORT_CONTENT}" | pbcopy
```

Then inform the user: "📋 クリップボードにコピーしました"

## Tips

- Use at the end of the day to summarize accomplishments
- The report can be pasted directly to Slack, email, or other reporting systems
- Combine with `/dbd:monthly` for longer-term tracking
