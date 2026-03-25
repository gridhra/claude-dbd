# /monthly - Generate Monthly Report

Generate a summary report of completed tasks and accomplishments for the current month.

## Usage

```
/monthly           # Generate report for current month
/monthly 2026-02   # Generate report for specific month
```

## Behavior

1. **Determine target month** (current month or specified)
2. **Scan all daily files** in `tasks/YYYY/MM/`
3. **Extract completed tasks** (lines with `[x]`)
4. **Collect Done sections** from each day
5. **Generate report** at `reports/YYYY-MM.md`

## Report Template

```markdown
---
month: 2026-03
generated: 2026-03-25
days_tracked: 15
tasks_completed: 42
---

# Monthly Report: March 2026

## Summary
- **Days tracked**: 15
- **Tasks completed**: 42
- **Projects touched**: #api, #docs, #frontend

## Completed Tasks by Project

### #api
- [x] Implement user authentication _done:2026-03-05
- [x] Add rate limiting _done:2026-03-12

### #docs
- [x] Write API documentation _done:2026-03-08
- [x] Update README _done:2026-03-15

### Other
- [x] Various small fixes _done:2026-03-10

## Daily Accomplishments

### 2026-03-25
- Implemented user authentication API
- Reviewed and merged teammate's PR

### 2026-03-24
- Fixed checkout flow bug
- Deployed to staging

## Carryover to Next Month
- [ ] Complete integration tests #testing
- [ ] Review security audit findings @security
```

## Instructions

1. Determine target month:
   ```bash
   # Current month
   date +%Y-%m
   # Or parse from argument
   ```

2. Find all daily files for the month:
   ```bash
   ls tasks/2026/03/*.md
   ```

3. For each file, extract:
   - Completed tasks (lines with `- [x]`)
   - Done section content
   - Incomplete tasks (for carryover)

4. Group completed tasks by `#tag` (or "Other" if no tag)

5. Create reports directory if needed:
   ```bash
   mkdir -p reports
   ```

6. Generate the report file at `reports/YYYY-MM.md`

7. Display the generated report

## Output

After execution, show:
- Summary statistics (days tracked, tasks completed)
- Path to generated report
- Top 3 most active projects/tags
