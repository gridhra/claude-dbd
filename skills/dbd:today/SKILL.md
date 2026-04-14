---
name: dbd:today
description: 今日のセッションを開始。日次ファイルの作成/表示、前日のHandoff表示。朝一番に使う。
---

# dbd:today

## 動作

1. `date +%Y-%m-%d` で今日の日付と曜日を取得
2. `tasks/YYYY/MM/YYYY-MM-DD.md` が存在するか確認
3. **ファイルがある場合**: 内容を表示
4. **ファイルがない場合**:
   - 直近の日次ファイルを探す（`ls -1 tasks/*/*/*.md | sort -r | head -1`）
   - 未完了タスク（`- [ ]` で始まる行）を抽出
   - Carryoverとして新しいファイルを作成

## ファイル作成テンプレート

```markdown
---
date: {TODAY}
weekday: {WEEKDAY}
prev: {PREV_DATE}
---

# {TODAY} ({WEEKDAY})

## Carryover
{未完了タスク or "<!-- No carryover tasks -->"}

## Tasks
- [ ]

## Done
<!-- Record accomplishments here -->

## Handoff
<!-- Thoughts, handoff, tomorrow's priorities -->

## Notes
<!-- Blockers, ideas, meeting notes -->
```

## 手順

1. 今日の日付を取得:
   ```bash
   date +%Y-%m-%d
   ```

2. ファイル存在確認:
   ```bash
   ls tasks/$(date +%Y)/$(date +%m)/$(date +%Y-%m-%d).md
   ```

3. ファイルがない場合、直近のファイルを取得:
   ```bash
   ls -1 tasks/*/*/*.md | sort -r | head -1
   ```

4. 前日ファイルから未完了タスクを抽出（`^- \[ \]` にマッチする行）

5. 必要ならディレクトリ作成:
   ```bash
   mkdir -p tasks/$(date +%Y)/$(date +%m)
   ```

6. テンプレートで新ファイルを作成

7. ファイル内容をユーザーに表示

## 出力形式

表示する内容:
- **前日のHandoff**（内容がある場合）: 前日ファイルのHandoffセクションを冒頭に表示
- 今日のタスクファイル全文
- Carryoverタスク数（あれば）
- リマインダー: 「`/dbd:add` でタスク追加、`/dbd:done` で完了記録」

## 前日Handoffの表示

前日ファイルにHandoffセクションの内容がある場合、冒頭に表示:

```
## Previous Handoff (YYYY-MM-DD)
[前日のHandoff内容]

---
```
