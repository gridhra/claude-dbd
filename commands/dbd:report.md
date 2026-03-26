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

5. **Interview the user** (use AskUserQuestion tool):

   **Question 1: 未記載の活動確認**
   - Show the current Done section entries as bullet points
   - Ask: "他に記録していない作業はありますか？"
   - Options: "特になし", "あり"
   - If user selects "あり", they provide text → append to Done section

   **Question 2: 引き継ぎ事項確認**
   - Ask: "明日への引き継ぎ・申し送り事項はありますか？"
   - Options: "特になし", "あり"
   - If user selects "あり", they provide text → add to Handoff section

6. Generate accomplishments summary:
   - Analyze activity log entries
   - Group related items and create a concise summary (1-2 sentences)
   - This goes at the TOP of the report

7. Filter remaining tasks:
   - Only include tasks due tomorrow or earlier (overdue)
   - Do NOT include tasks due later than tomorrow

8. Generate and display the report in the following format:

## Output Format

```markdown
# 日報 YYYY-MM-DD (Weekday)

## 本日の成果

[1-2 sentence summary of key accomplishments]

## 活動ログ

- Activity 1
- Activity 2
- ...

## 明日やること

- Task 1 (期限: MM-DD)
- Task 2 (期限: MM-DD)

## メモ・備考

- Note 1
```

## Key Points

- **成果を先に**: 活動ログより前に、成果サマリーを表示
- **残タスクは明日分のみ**: 翌営業日までの期限のタスクだけを表示
- **達成率は不要**: シンプルに成果とやることだけを表示

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
