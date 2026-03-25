# /dbd:note - Record Notes and Handoff

Record notes or handoff items. Content is routed to Notes or Handoff section based on context.

## Usage

```
/dbd:note              # Interactive mode
/dbd:note <content>    # Direct input (auto-routing)
```

## Behavior

1. **Check today's task file** - If it doesn't exist, prompt user to run `/dbd:today` first
2. **If no arguments**:
   - Ask: "What would you like to record?"
     - Thoughts/Handoff/Tomorrow's priority → Handoff section
     - Memo/Blocker/Idea → Notes section
   - If Handoff selected: Ask for thoughts → context → priority (each skippable with Enter)
   - If Notes selected: Free text input
3. **If arguments provided**:
   - Analyze content and route automatically
   - Keywords like "tomorrow", "next time", "handoff", "priority" → Handoff
   - Otherwise → Notes
4. Record with timestamp

## Interactive Flow (Handoff)

```
What are your thoughts on today? (Press Enter to skip)
> [input]

Any context for handoff?
> [input]

What's the priority for tomorrow? (Press Enter to skip)
> [input]
```

## Section Formats

### Handoff Section Format

```markdown
### HH:MM
#### Thoughts
- content

#### Handoff
- content

#### Tomorrow's Priority
- content
```

### Notes Section Format

```markdown
- HH:MM content
```

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

4. If no arguments provided, use AskUserQuestion:
   - Question: "What would you like to record?"
   - Options:
     - "Handoff/Thoughts" - For end-of-day reflections, context for tomorrow, priorities
     - "Note/Memo" - For blockers, ideas, general memos

5. **If Handoff selected**:
   - Ask three questions sequentially (user can skip any with empty response):
     1. "What are your thoughts on today?"
     2. "Any context for handoff to tomorrow?"
     3. "What's the priority for tomorrow?"
   - Write to `## Handoff` section in structured format

6. **If Notes selected**:
   - Ask: "What would you like to note?"
   - Write to `## Notes` section as: `- HH:MM <content>`

7. **If arguments provided**:
   - Check for handoff keywords: 明日, 次回, 引き継ぎ, 優先, tomorrow, next, handoff, priority
   - If keywords found: Route to Handoff section (as context/priority)
   - Otherwise: Route to Notes section

8. Save the updated file

## Examples

```
/dbd:note                           # Interactive mode
/dbd:note 明日はテスト追加が優先    # → Handoff (keyword: 明日, 優先)
/dbd:note 会議で仕様変更決定        # → Notes
/dbd:note 次回APIリファクタ必要     # → Handoff (keyword: 次回)
/dbd:note デバッグのメモ            # → Notes
```

## Output Format

After recording:

**For Handoff:**
```
Recorded handoff at HH:MM:
- Thoughts: [content]
- Context: [content]
- Priority: [content]
```

**For Notes:**
```
Noted at HH:MM:
- [content]
```
