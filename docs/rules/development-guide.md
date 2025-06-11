# git-backup 開発ガイドライン

## プロジェクト概要

git-backupは、Gitの作業状態をバックアップ・復元するDenoベースのCLIツールです。

## 技術スタック

- **言語**: TypeScript (Deno)
- **テストフレームワーク**: Deno標準テストフレームワーク
- **スタイル**: クラスを使用しない関数型プログラミング

## ディレクトリ構造

```
git-backup/
├── mod.ts                 # エントリーポイント
├── src/
│   ├── commands/
│   │   ├── save.ts       # バックアップコマンド
│   │   ├── restore.ts    # 復元コマンド
│   │   └── list.ts       # 一覧表示コマンド
│   ├── utils/
│   │   ├── git.ts        # Git操作ユーティリティ
│   │   ├── date.ts       # 日付フォーマット
│   │   └── prompt.ts     # 対話的入力
│   └── types.ts          # 型定義
├── tests/
│   ├── commands/
│   │   ├── save_test.ts
│   │   ├── restore_test.ts
│   │   └── list_test.ts
│   └── utils/
│       └── git_test.ts
├── docs/
│   └── development-guide.md
├── README.md
├── CLAUDE.md
└── deno.json
```

## コーディング規約

### 一般原則

- クラスは使用しない（関数とインターフェースのみ）
- 純粋関数を優先する
- 副作用は明確に分離する
- エラーは詳細にログ出力する

### 命名規則

- ファイル名: snake_case（例: `git_utils.ts`）
- 関数名: camelCase（例: `createBackupBranch`）
- 定数: UPPER_SNAKE_CASE（例: `BACKUP_PREFIX`）
- 型/インターフェース: PascalCase（例: `BackupInfo`）

### Git操作

- すべてのGit操作は`src/utils/git.ts`に集約
- コマンド実行は`Deno.Command`を使用
- エラーハンドリングを必ず実装

## 主要な関数

### バックアップ機能

```typescript
// src/commands/save.ts
export async function saveBackup(description?: string): Promise<void>;
```

1. 作業状態をチェック
2. バックアップブランチを作成
3. ステージング済み変更をコミット
4. 未ステージ変更をコミット

### 復元機能

```typescript
// src/commands/restore.ts
export async function restoreBackup(backupName?: string): Promise<void>;
```

1. バックアップブランチの存在確認
2. マージ可能性チェック
3. cherry-pickで変更を適用
4. resetで元の状態を復元

### Git ユーティリティ

```typescript
// src/utils/git.ts
export async function runGitCommand(args: string[]): Promise<GitCommandResult>;
export async function getCurrentBranch(): Promise<string>;
export async function hasChanges(): Promise<boolean>;
export async function getStagedFiles(): Promise<string[]>;
export async function getUnstagedFiles(): Promise<string[]>;
```

## エラーハンドリング

- すべてのGitコマンドエラーをキャッチ
- ユーザーフレンドリーなエラーメッセージを表示
- 詳細なログを`console.error`で出力

## テスト戦略

### 単体テスト

- 各ユーティリティ関数の個別テスト
- モックGitリポジトリを使用

### 統合テスト

- 実際のGit操作を含むエンドツーエンドテスト
- テスト用の一時リポジトリを作成・削除

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
