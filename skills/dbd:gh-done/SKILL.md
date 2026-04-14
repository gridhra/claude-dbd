---
name: dbd:gh-done
description: GitHubのPR活動を取得してDoneに記録。日報作成前にGitHub活動を取り込む時に使う。
argument-hint: "[YYYY-MM-DD] [owner/repo]"
---

# dbd:gh-done

引数: $ARGUMENTS

## 動作

1. 対象日にマージされたPR（自分がレビュー/マージしたもの）を取得
2. 対象日に自分が作成したPRを取得
3. カテゴリ別に分類してDoneセクションに記録
4. 重複チェック（既に記録済みのPRはスキップ）

## 手順

1. 対象日を決定（引数があればその日付、なければ今日）:
   ```bash
   date +%Y-%m-%d
   ```

2. 今日のタスクファイルを読み込み。なければ `/dbd:today` を先に実行するよう案内

3. GitHubユーザー名を取得（`gh api user --jq .login` またはデフォルト）

4. 対象リポジトリを決定:
   - 引数で指定があればそれを使用
   - なければプロジェクトCLAUDE.mdの `github_repo:` を参照
   - どちらもなければユーザーに質問

5. マージ済みPRを取得:
   ```bash
   gh pr list -R {repo} --search "is:merged merged:{date}" --json number,title,author --limit 50
   ```

6. 自分が作成したPRを取得:
   ```bash
   gh pr list -R {repo} --author {username} --search "created:{date}" --state all --json number,title,state --limit 50
   ```

7. 結果を分類:
   - **他者が作成しマージされたPR** → 「PRレビュー・動作確認・リリース」
     - 形式: `- PRレビュー・動作確認・リリース: #N タイトル, #N タイトル`
   - **自分が作成し当日作成のPR** → 「実装」
     - 形式: `- 実装: #N タイトル, #N タイトル`
   - **自分が作成し当日以前作成のPR（マージのみ）** → 「実装・リリース」
     - 形式: `- 実装・リリース: #N タイトル, #N タイトル`

8. Doneセクションの既存内容と重複チェック（PR番号で判定）。記録済みはスキップ

9. Doneセクションに追記

10. 追加内容を表示

## 出力形式

```
## GitHub活動 (YYYY-MM-DD) from owner/repo

### PRレビュー・動作確認・リリース
- #123 ログインバグ修正 (author)
- #456 依存関係更新 (author)

### 実装
- #789 新機能追加

### 実装・リリース
- #101 認証モジュールリファクタ

---
Doneセクションに X 件追加しました。
```

## 複数リポジトリ対応

カンマ区切りで複数リポジトリを指定可能:
```
/dbd:gh-done 2026-04-13 owner/repo1,owner/repo2
```

## 注意事項

- `gh` CLI が必要（`gh auth login` で認証済みであること）
- GitHub MCPサーバーも代替手段として利用可能
