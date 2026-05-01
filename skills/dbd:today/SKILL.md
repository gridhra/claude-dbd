---
name: dbd:today
description: 今日のセッションを開始。日次ファイルの作成/表示、前日Handoff表示、今日コミットするTODOの整理。朝一番に使う。
---

# dbd:today

## 日付判定（27時制）

現在時刻が午前3時（03:00）より前の場合、前日をタスク上の「今日」として扱う。
これは深夜作業が前日の延長である実態に合わせるため。

```bash
HOUR=$(date +%H)
if [ "$HOUR" -lt 3 ]; then
  TODAY=$(date -v-1d +%Y-%m-%d)
  WEEKDAY=$(date -v-1d +%a)
else
  TODAY=$(date +%Y-%m-%d)
  WEEKDAY=$(date +%a)
fi
```

## 動作

1. 上記の27時制ルールで「今日」の日付と曜日を決定
2. `tasks/YYYY/MM/YYYY-MM-DD.md` が存在するか確認
3. **ファイルがある場合**: 内容を表示
4. **ファイルがない場合**:
   - 直近の日次ファイルを探す（`ls -1 tasks/*/*/*.md | sort -r | head -1`）
   - 未完了タスク（`- [ ]` で始まる行）を抽出
   - Carryoverとして新しいファイルを作成
5. **TODO整理ステップ**: Carryoverを見て、長期滞留タスクへの対処を促し、今日コミットする1〜3個を選定する

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

1. 27時制で「今日」の日付を決定:
   ```bash
   HOUR=$(date +%H)
   if [ "$HOUR" -lt 3 ]; then
     TODAY=$(date -v-1d +%Y-%m-%d)
   else
     TODAY=$(date +%Y-%m-%d)
   fi
   ```

2. ファイル存在確認:
   ```bash
   ls tasks/${TODAY:0:4}/${TODAY:5:2}/${TODAY}.md
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

8. **TODO整理ステップ** (Carryoverに未完了タスクが1件以上ある場合のみ):

   a. **長期滞留チェック**: 各 Carryover タスクが直近何日分の日次ファイルに登場し続けているかを軽く確認:
      ```bash
      # 直近10日分の日次ファイルから同じタスク行が出てきた回数をカウント
      ls -1 tasks/*/*/*.md | sort -r | head -10 | xargs grep -F "<タスクテキストの先頭部分>" 2>/dev/null | wc -l
      ```
      または、複数タスクをまとめて把握する場合は `git log --oneline tasks/` や直近数ファイルを `Read` で目視。

   b. **長期滞留タスクの剪定対話**: 5日以上連続で繰り越されているタスクがあれば、AskUserQuestionで1件ずつ「やる/捨てる/延期」を確認:
      - 「やる」→ 後段のFocus候補に含める
      - 「捨てる」→ 該当行を Carryover から削除し、`## Notes` に `- HH:MM dropped: <要約>（理由: ...）` を追記
      - 「延期」→ `due:DATE` を更新する、または何もしない
      
      1日上限3件まで。残りは「明日以降」と案内。

   c. **Focus 選定**: AskUserQuestionで「今日コミットする1〜3個を選んでください（skipも可）」を確認:
      - 候補は Carryover + Tasks の未完了タスク全体
      - 番号で受け取る

   d. **結果表示**: 選定した「今日のフォーカス」を冒頭サマリとして明確に表示。
      （ファイル構造は変更しない。Carryover/Tasks セクションはそのまま。Focus はskill出力上で強調するのみ）

## 出力形式

表示する内容（順序）:
1. **前日のHandoff**（内容がある場合）: 前日ファイルのHandoffセクションを冒頭に表示
2. 今日のタスクファイル全文
3. Carryoverタスク数（あれば）と長期滞留警告（5日以上連続で繰り越し中のものがあれば件数を明示）
4. **今日のフォーカス**（TODO整理ステップで選定済の場合）: 1〜3個を番号付きで強調表示
5. リマインダー: 「`/dbd:add` でタスク追加、`/dbd:done` で完了記録」

## 前日Handoffの表示

前日ファイルにHandoffセクションの内容がある場合、冒頭に表示:

```
## Previous Handoff (YYYY-MM-DD)
[前日のHandoff内容]

---
```
