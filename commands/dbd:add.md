# /dbd:add - Add New Task

Add one or more tasks to today's task file.

## Usage

```
/dbd:add [task description(s)]
```

## Examples

```
/dbd:add Implement login API #backend due:2026-03-26
/dbd:add ドキュメント更新、テスト作成、レビュー依頼
/dbd:add
  - バグ修正 #urgent
  - コードレビュー #review
  - デプロイ準備
/dbd:add                          # Interactive mode - will prompt for task
```

## Tag Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `#tag` | Category/project | `#api`, `#docs`, `#urgent` |
| `due:DATE` | Due date | `due:2026-03-25` |

## Behavior

1. **Get today's task file** at `tasks/YYYY/MM/YYYY-MM-DD.md`
2. **If file doesn't exist**: Run `/dbd:today` first to create it
3. **If no arguments**: Ask user for task description interactively
4. **Intelligent parsing**: Analyze input and split into multiple tasks if appropriate
5. **Due date check**: For tasks without `due:DATE`, ask user to specify due date
6. **Add tasks** to the Tasks section (after existing tasks)
7. **Confirm** the additions

## Instructions

1. Check if today's file exists:
   ```bash
   test -f tasks/$(date +%Y)/$(date +%m)/$(date +%Y-%m-%d).md
   ```

2. If file doesn't exist, inform user to run `/dbd:today` first

3. **If arguments are provided** (non-empty input after the command):
   - Analyze the input text intelligently
   - Identify if multiple tasks are intended (look for: bullet points, numbered lists, commas, line breaks, conjunctions like "と" or "and")
   - Split into separate tasks as appropriate
   - Preserve tags (#tag, due:DATE) for each task

4. **If no arguments**: Use AskUserQuestion to prompt for tasks

5. **Due date confirmation** (for tasks without `due:DATE`):
   - Use AskUserQuestion to ask for due date
   - Options: "今日", "明日", "今週中 (金曜)", "来週中", "期日なし"
   - If multiple tasks lack due dates, ask once and apply to all (or ask individually if tasks seem unrelated)
   - Add the `due:YYYY-MM-DD` tag to the task

6. Read the current file content

7. Find the Tasks section and append new tasks:
   ```markdown
   - [ ] {task 1}
   - [ ] {task 2}
   ...
   ```

8. Write the updated content back to the file

## Output

After execution, show:
- List of added tasks
- Current total task count for today
- Brief confirmation (e.g., "Added 3 tasks")
