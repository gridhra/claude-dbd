# /done - Record Accomplishments

Interactively record what you accomplished and update task status.

## Behavior

1. **Read today's task file** from `tasks/YYYY/MM/YYYY-MM-DD.md`
2. **Show current Tasks section** with incomplete items
3. **Ask user** what they accomplished
4. **Update the file**:
   - Mark completed tasks with `[x]` and add `_done:{TODAY}`
   - Add accomplishment summary to Done section

## Interactive Flow

### Step 1: Show Current State
Display incomplete tasks:
```
Current incomplete tasks:
1. [ ] API implementation #backend
2. [ ] Write documentation #docs
3. [ ] Review PR @teammate
```

### Step 2: Ask for Completion
```
Which tasks did you complete? (Enter numbers separated by comma, or 'none')
> 1, 3

What did you accomplish? (Brief summary)
> Implemented user authentication API, reviewed and merged teammate's PR
```

### Step 3: Update File

Transform:
```markdown
- [ ] API implementation #backend
```

To:
```markdown
- [x] API implementation #backend _done:2026-03-25
```

And append to Done section:
```markdown
## Done
- Implemented user authentication API
- Reviewed and merged teammate's PR
```

## Instructions

1. Get today's date and read the task file:
   ```bash
   cat tasks/$(date +%Y)/$(date +%m)/$(date +%Y-%m-%d).md
   ```

2. Parse and display incomplete tasks (lines with `- [ ]`)

3. Use AskUserQuestion tool to:
   - Ask which tasks were completed (show numbered list)
   - Ask for accomplishment summary

4. Update the file:
   - Change `- [ ]` to `- [x]` for completed tasks
   - Add `_done:{TODAY}` to completed task lines
   - Append accomplishment summary to Done section

5. Show the updated file content

## Output

After execution, show:
- Updated task list with completion status
- The Done section with new entries
- Count: "Completed X tasks today!"
