# /dbd:log - Log Activity

Quick-log what you just accomplished with timestamp.

## Usage

```
/dbd:log <activity description> [#tags] [@mentions]
```

## Behavior

1. **Get current time** in HH:MM format
2. **Read today's task file** from `tasks/YYYY/MM/YYYY-MM-DD.md`
3. **Append to Done section**: `- HH:MM <description>`
4. **Confirm** the logged entry

## Instructions

1. Get current date and time:
   ```bash
   date +%Y-%m-%d
   date +%H:%M
   ```

2. Read today's task file:
   ```bash
   cat tasks/$(date +%Y)/$(date +%m)/$(date +%Y-%m-%d).md
   ```

3. If today's file doesn't exist:
   - Inform user: "Today's task file doesn't exist. Run `/dbd:today` first."
   - Exit

4. Parse the activity description from command arguments

5. If no arguments provided:
   - Use AskUserQuestion to ask: "What did you accomplish?"

6. Append to the Done section with timestamp:
   - Find the `## Done` section
   - Add new line: `- HH:MM <activity description>`
   - Preserve any existing entries in Done section

7. Save the updated file

## Examples

```
/dbd:log Fixed authentication bug #backend
/dbd:log Code review for PR #123 @alice
/dbd:log Deployed to staging
/dbd:log Meeting: Sprint planning @team
```

## Output Format

After logging, display:

```
Logged at HH:MM:
- <activity description>
```

## File Update Example

Before:
```markdown
## Done
- 09:30 Morning standup
```

After `/dbd:log Fixed login bug #auth`:
```markdown
## Done
- 09:30 Morning standup
- 14:25 Fixed login bug #auth
```
