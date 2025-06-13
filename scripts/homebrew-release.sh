#!/bin/bash

# Homebrew Formula公開用のスクリプト
# このスクリプトはリリース時に使用します

set -e

VERSION=$1
GITHUB_USER="yourusername"
REPO_NAME="git-backup"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

echo "Preparing Homebrew release for version $VERSION..."

# GitHub URLの生成
TARBALL_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}/archive/refs/tags/v${VERSION}.tar.gz"

# SHA256の計算（リリース後に実行）
echo ""
echo "After creating the GitHub release, run the following to get the SHA256:"
echo "curl -L ${TARBALL_URL} | shasum -a 256"
echo ""

# Homebrew Formulaの更新手順
echo "Steps to publish to Homebrew:"
echo ""
echo "1. Create a GitHub release with tag v${VERSION}"
echo "2. Wait for GitHub Actions to build and upload binaries"
echo "3. Calculate SHA256 of the source tarball"
echo "4. Update homebrew/git-backup.rb with:"
echo "   - url: ${TARBALL_URL}"
echo "   - sha256: <calculated sha256>"
echo "   - homepage: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""
echo "5. Create your own Homebrew tap:"
echo "   git clone https://github.com/${GITHUB_USER}/homebrew-tap"
echo "   cp homebrew/git-backup.rb homebrew-tap/Formula/"
echo "   cd homebrew-tap"
echo "   git add Formula/git-backup.rb"
echo "   git commit -m \"Add git-backup ${VERSION}\""
echo "   git push"
echo ""
echo "6. Test installation:"
echo "   brew tap ${GITHUB_USER}/tap"
echo "   brew install git-backup"
echo ""

# 代替案：Homebrew coreへの提出
echo "Alternative: Submit to Homebrew core"
echo "1. Fork homebrew/homebrew-core"
echo "2. Create a new branch"
echo "3. Add Formula/git-backup.rb"
echo "4. Submit a pull request"
echo ""
echo "Note: Homebrew core has strict requirements."
echo "See: https://docs.brew.sh/Acceptable-Formulae"