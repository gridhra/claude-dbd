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
2. **Analyze** completed tasks, activity logs, and remaining tasks
3. **Generate** a formatted daily report in Japanese

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
   - Completed tasks (lines with `- [x]`)
   - Incomplete tasks (lines with `- [ ]`)
   - Done section entries (activity log)
   - Notes section entries

5. Calculate summary:
   - Total tasks count
   - Completed count
   - Incomplete count
   - Completion rate (%)

6. Generate and display the report in the following format:

## Output Format

```markdown
# 日報 YYYY-MM-DD (Weekday)

## サマリー

- タスク総数: X
- 完了: X
- 未完了: X
- 達成率: X%

## 完了したタスク

- Task 1
- Task 2

## 活動ログ

- HH:MM Activity 1
- HH:MM Activity 2

## 残タスク

- Remaining task 1 (期限: YYYY-MM-DD)
- Remaining task 2

## メモ・備考

- Note 1
- Note 2
```

## Tips

- Use at the end of the day to summarize accomplishments
- The report can be copied to Slack, email, or other reporting systems
- Combine with `/dbd:monthly` for longer-term tracking
