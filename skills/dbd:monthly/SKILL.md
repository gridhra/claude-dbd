---
name: dbd:monthly
description: 月次サマリーレポートを生成。月末の振り返りに使う。
argument-hint: "[YYYY-MM]"
---

# dbd:monthly

引数: $ARGUMENTS

## 動作

1. 対象月を決定（デフォルト: 今月）
2. `tasks/YYYY/MM/` 配下の全日次ファイルをスキャン
3. 完了タスク（`[x]` の行）を抽出
4. 各日のDoneセクションを収集
5. `reports/YYYY-MM.md` にレポートを生成

## レポートテンプレート

```markdown
---
month: YYYY-MM
generated: YYYY-MM-DD
days_tracked: N
tasks_completed: N
---

# 月次レポート: YYYY年MM月

## サマリー
- **記録日数**: N日
- **完了タスク**: N件
- **関連プロジェクト**: #api, #docs, #frontend

## プロジェクト別完了タスク

### #api
- [x] ユーザー認証API実装 _done:2026-03-05
- [x] レートリミット追加 _done:2026-03-12

### #docs
- [x] APIドキュメント作成 _done:2026-03-08

### その他
- [x] 細かい修正 _done:2026-03-10

## 日別の成果

### 2026-03-25
- ユーザー認証APIを実装
- チームメイトのPRをレビュー・マージ

### 2026-03-24
- チェックアウトフローのバグ修正
- ステージングにデプロイ

## 来月への持ち越し
- [ ] 統合テスト完了 #testing
- [ ] セキュリティ監査対応 @security
```

## 手順

1. 対象月を決定:
   ```bash
   date +%Y-%m
   ```

2. 月のファイルを一覧:
   ```bash
   ls tasks/YYYY/MM/*.md
   ```

3. 各ファイルから抽出:
   - 完了タスク（`- [x]` の行）
   - Doneセクションの内容
   - 未完了タスク（持ち越し用）

4. 完了タスクを `#tag` でグループ化（タグなしは「その他」）

5. reportsディレクトリを作成:
   ```bash
   mkdir -p reports
   ```

6. `reports/YYYY-MM.md` にレポートを出力

7. 生成したレポートを表示

## 出力形式

- サマリー統計（記録日数、完了タスク数）
- レポートファイルのパス
- アクティブだった上位3プロジェクト/タグ
