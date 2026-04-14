---
name: dbd:commit
description: 今日のタスクファイルと関連変更をコミット。終業時の保存に使う。
argument-hint: "[YYYY-MM-DD]"
---

# dbd:commit

引数: $ARGUMENTS

## 動作

1. 対象日を決定（デフォルト: 今日）
2. `framework/` を除外して変更をステージ
3. `daily: YYYY-MM-DD` のメッセージでコミット

## 手順

1. 対象日を決定:
   - 引数があればその日付を使用
   - なければ今日: `date +%Y-%m-%d`

2. 変更を確認:
   ```bash
   git status --porcelain | grep -v '^.. framework/'
   ```

3. 変更がない場合:
   - 「コミットする変更がありません」と案内して終了

4. `framework/` を除外してステージ:
   ```bash
   git add --all -- ':!framework/'
   ```

5. コミット内容を表示:
   ```bash
   git diff --cached --stat
   ```

6. コミット実行:
   ```bash
   git commit -m "daily: YYYY-MM-DD"
   ```

7. 結果を表示:
   - コミットハッシュ
   - 変更ファイル数
   - 「コミット完了: daily: YYYY-MM-DD」

## 出力形式

```
## ステージされた変更
 tasks/2026/03/2026-03-26.md | 40 +++
 .local/holidays/2026.json   |  5 +

## コミット
コミット完了: daily: 2026-03-26
   abc1234 - 2 files changed
```

## 注意事項

- `framework/` は除外（サブモジュールとして別管理）
- `.local/` の変更は含まれる（祝日データ等）
- タスクファイルとレポートが対象
