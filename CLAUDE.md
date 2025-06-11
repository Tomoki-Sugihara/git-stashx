# git-backup プロジェクト情報

## 概要

このプロジェクトは、Gitの作業状態をバックアップ・復元するDenoベースのCLIツールです。


## 作業注意点

### 作業終了時
必ず作業終了時に`afplay ~/dotfiles/claude/bell.wav`を実行して知らせてください。
```bash
afplay ~/dotfiles/claude/bell.wav
```

## 開発ガイドライン

### プロジェクト固有のガイドライン
詳細な開発ガイドラインは [docs/rules/development-guide.md](docs/rules/development-guide.md) を参照してください。

### Deno開発の一般的なベストプラクティス
Deno開発における包括的なガイドライン（コード構成、セキュリティ、パフォーマンス、テスト等）については [docs/rules/deno-development-guide.md](docs/rules/deno-development-guide.md) を参照してください。

## コマンド

### lint と format
```bash
deno fmt
deno lint
```

### テスト実行

```bash
deno test --allow-run --allow-read --allow-write
```

## 開発フロー

1. 機能追加時は対応するテストも追加
2. `deno fmt`でコードフォーマット
3. `deno lint`でリント実行
4. すべてのテストが通ることを確認

## 注意事項

- グローバルなGit設定を変更しない
- ユーザーの作業を破壊しない（常に安全側に倒す）
- バックアップブランチは自動削除しない