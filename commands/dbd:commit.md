# /dbd:commit - Commit Daily Progress

Commit today's task file and any other non-framework changes.

## Usage

```
/dbd:commit [YYYY-MM-DD]
```

## Examples

```
/dbd:commit           # Commit today's changes
/dbd:commit 2026-03-25  # Commit specific date's changes
```

## Behavior

1. **Get the target date** (default: today)
2. **Stage changes** excluding `framework/` directory
3. **Create commit** with message `daily: YYYY-MM-DD`

## Instructions

1. Get target date:
   - If argument provided, use it
   - Otherwise use today: `date +%Y-%m-%d`

2. Check for changes:
   ```bash
   git status --porcelain | grep -v '^.. framework/'
   ```

3. If no changes:
   - Inform user: "コミットする変更がありません"
   - Exit

4. Stage all changes except framework:
   ```bash
   git add --all -- ':!framework/'
   ```

5. Show what will be committed:
   ```bash
   git diff --cached --stat
   ```

6. Create commit:
   ```bash
   git commit -m "daily: YYYY-MM-DD"
   ```

7. Show result:
   - Commit hash
   - Files changed
   - "✅ コミット完了: daily: YYYY-MM-DD"

## Output Format

```
## Staged Changes
 tasks/2026/03/2026-03-26.md | 40 +++
 .local/holidays/2026.json   |  5 +

## Commit
✅ コミット完了: daily: 2026-03-26
   abc1234 - 2 files changed
```

## Notes

- `framework/` directory is excluded (managed separately as submodule)
- `.local/` changes are included (holidays data, etc.)
- Task files and reports are included
