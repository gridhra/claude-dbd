# /dbd:today - Daily Task Startup

Start or continue today's task management session.

## Behavior

1. **Determine today's date** using `date +%Y-%m-%d` and weekday
2. **Check if today's file exists** at `tasks/YYYY/MM/YYYY-MM-DD.md`
3. **If file exists**: Display the current content
4. **If file doesn't exist**:
   - Find the previous business day's file (skip weekends)
   - Extract incomplete tasks (lines starting with `- [ ]`)
   - Create today's file with carryover tasks

## File Creation Template

When creating a new daily file:

```markdown
---
date: {TODAY}
weekday: {WEEKDAY}
prev: {PREV_DATE}
---

# {TODAY} ({WEEKDAY})

## Carryover
{CARRYOVER_TASKS or "<!-- No carryover tasks -->"}

## Tasks
- [ ]

## Done
<!-- Record accomplishments here -->

## Notes
<!-- Blockers, ideas, meeting notes -->
```

## Instructions

1. Get today's date:
   ```bash
   date +%Y-%m-%d
   ```

2. Check for existing file:
   ```bash
   ls tasks/$(date +%Y)/$(date +%m)/$(date +%Y-%m-%d).md
   ```

3. If no file exists, find the most recent previous file:
   ```bash
   ls -1 tasks/*/*/*.md | sort -r | head -1
   ```

4. Extract incomplete tasks from previous file (if found):
   - Look for lines matching `^- \[ \]`
   - These become the Carryover section

5. Create directory structure if needed:
   ```bash
   mkdir -p tasks/$(date +%Y)/$(date +%m)
   ```

6. Create the new file with the template above

7. Display the file content to the user

## Output

After execution, show:
- The full content of today's task file
- Count of carryover tasks (if any)
- Reminder: "Use `/dbd:add` to add tasks, `/dbd:done` to record accomplishments"
