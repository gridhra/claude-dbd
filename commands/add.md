# /add - Add New Task

Add a new task to today's task file.

## Usage

```
/add [task description with optional tags]
```

## Examples

```
/add Implement login API #backend due:2026-03-26
/add Review design document @designer
/add Fix bug in checkout flow #urgent
/add                          # Interactive mode - will prompt for task
```

## Tag Reference

| Tag | Purpose | Example |
|-----|---------|---------|
| `#tag` | Category/project | `#api`, `#docs`, `#urgent` |
| `@name` | Assignee/stakeholder | `@client`, `@team` |
| `due:DATE` | Due date | `due:2026-03-25` |

## Behavior

1. **Get today's task file** at `tasks/YYYY/MM/YYYY-MM-DD.md`
2. **If file doesn't exist**: Run `/today` first to create it
3. **Parse the task description** from command arguments
4. **If no arguments**: Ask user for task description interactively
5. **Add task** to the Tasks section (after existing tasks)
6. **Confirm** the addition

## Instructions

1. Check if today's file exists:
   ```bash
   test -f tasks/$(date +%Y)/$(date +%m)/$(date +%Y-%m-%d).md
   ```

2. If file doesn't exist, inform user to run `/today` first

3. If no task provided in arguments, use AskUserQuestion to prompt:
   ```
   What task would you like to add?
   (You can include tags like #project, @person, due:YYYY-MM-DD)
   ```

4. Read the current file content

5. Find the Tasks section and append the new task:
   ```markdown
   - [ ] {task description}
   ```

6. Write the updated content back to the file

7. Confirm: "Added task: {task description}"

## Output

After execution, show:
- Confirmation message with the added task
- Current task count for today
- The new task with any parsed tags highlighted
