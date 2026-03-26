# /dbd:prioritize - Task Priority Analysis

Analyze tasks and suggest priorities based on business days remaining, effort, and impact.

## Usage

```
/dbd:prioritize
```

## Behavior

1. **Read today's task file** and gather all incomplete tasks
2. **Calculate business days remaining** for each task (excluding weekends and holidays)
3. **Analyze effort/impact** from tags or estimate from task description
4. **Score and rank** tasks by priority
5. **Ask for clarification** if effort/impact cannot be determined
6. **Suggest today's actions** based on priority

## Tag Reference

| Tag | Values | Description |
|-----|--------|-------------|
| `effort:` | `S`, `M`, `L`, `XL` | 作業の重さ (数時間/1日/数日/1週間+) |
| `impact:` | `L`, `M`, `H`, `C` | インパクト (低/中/高/クリティカル) |

## Priority Score Calculation

Priority is calculated from:
- **Urgency (0-40pts)**: Based on business days remaining
- **Impact (0-40pts)**: C=40, H=30, M=20, L=10
- **Effort bonus (0-3pts)**: Smaller tasks get slight bonus for quick wins

## Instructions

1. Get today's date and read the task file

2. For each incomplete task:
   - Parse `due:DATE` to calculate calendar and business days remaining
   - Check for `effort:X` and `impact:X` tags
   - If tags are missing, estimate from task description
   - Calculate priority score

3. Sort tasks by priority score (descending)

4. Display prioritized task table:
   ```
   | 優先度 | タスク | 期限 | 営業日残 | effort | impact |
   |:------:|--------|------|:--------:|:------:|:------:|
   | 🔴 | タスク名... | 03-30 | 2日 | M* | H* |
   ```
   (* indicates AI-estimated values)

5. If any task has unknown effort/impact that couldn't be estimated:
   - Use AskUserQuestion to ask the user
   - Options: effort (S/M/L/XL), impact (L/M/H/C)
   - After user answers, update the task file with tags

6. Show today's recommended actions (top 3 priority tasks)

## Output Format

```markdown
# タスク優先度分析 (YYYY-MM-DD)

## 優先度順タスク一覧

| 優先度 | タスク | 期限 | 営業日残 | effort | impact |
|:------:|--------|------|:--------:|:------:|:------:|
| 🔴 | 現場調査報告書ブラッシュアップ | 03-30 | 2日 | M | H |
| 🟠 | 月次振り返り資料記入 | 03-31 | 3日 | S* | M* |
...

## 情報が不足しているタスク

- タスク名...
  → 不明: effort, impact

## 今日の推奨アクション

1. **現場調査報告書ブラッシュアップ** ⚠️
   - 営業日残: 2日
2. **展開範囲を決める**
   - 営業日残: 2日
3. **月次振り返り資料記入**
   - 営業日残: 3日

---
effort: S(数時間) / M(1日) / L(数日) / XL(1週間+)
impact: L(低) / M(中) / H(高) / C(クリティカル)
```

## Holiday Configuration

Holidays are loaded from `.local/holidays/YYYY.json`:

```json
{
  "year": 2026,
  "country": "JP",
  "holidays": [
    { "date": "2026-01-01", "name": "元日" },
    ...
  ]
}
```

This file is not committed to git (in `.gitignore`).

## Examples

```
> /dbd:prioritize

# タスク優先度分析 (2026-03-26)

## 優先度順タスク一覧
...

「月次振り返り資料記入」のeffort/impactを教えてください：
- effort: S(数時間) / M(1日) / L(数日) / XL(1週間+)
- impact: L(低) / M(中) / H(高) / C(クリティカル)

> effort: S, impact: M

タスクを更新しました: 月次振り返り資料記入 effort:S impact:M

## 今日の推奨アクション
1. 現場調査報告書ブラッシュアップ
2. ...
```
