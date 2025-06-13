# Homebrew公開手順

## 概要

git-stashxをHomebrewで公開するための手順書です。

## 事前準備

1. GitHubリポジトリの作成
2. Denoのインストール
3. Homebrewのインストール

## 公開手順

### 1. リリースの作成

```bash
# タグを作成してプッシュ
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actionsが自動的にビルドを実行し、バイナリをリリースページに追加します。

### 2. SHA256の計算

リリースが作成されたら、ソースコードのtarballのSHA256を計算します：

```bash
curl -L https://github.com/yourusername/git-stashx/archive/refs/tags/v1.0.0.tar.gz | shasum -a 256
```

### 3. Homebrew Tap の作成

個人のHomebrewタップリポジトリを作成します：

1. GitHubで新しいリポジトリ `homebrew-tap` を作成
2. Formulaディレクトリを作成してFormulaファイルをコピー

```bash
mkdir -p Formula
cp homebrew/git-stashx.rb Formula/
# SHA256とURLを更新
```

3. コミットしてプッシュ

```bash
git add Formula/git-stashx.rb
git commit -m "Add git-stashx v1.0.0"
git push
```

### 4. インストールのテスト

```bash
# タップを追加
brew tap yourusername/tap

# インストール
brew install git-stashx

# 動作確認
git-stashx version
```

## Formulaの更新

`homebrew/git-stashx.rb` の以下の項目を更新する必要があります：

- `homepage`: 実際のGitHubリポジトリURL
- `url`: リリースのtarball URL
- `sha256`: 計算したSHA256ハッシュ値

## 注意事項

- GitHubのユーザー名を `yourusername` から実際のものに変更してください
- バージョン番号は `mod.ts` のVERSION定数と一致させてください
- Homebrew coreへの提出には追加の要件があります（30日間のオープンソース、一定数のstar等）

## トラブルシューティング

### インストールが失敗する場合

1. Denoがインストールされているか確認
2. Formulaのパスが正しいか確認
3. SHA256が正しいか確認

### 実行時エラー

1. 必要な権限が付与されているか確認
2. Gitがインストールされているか確認