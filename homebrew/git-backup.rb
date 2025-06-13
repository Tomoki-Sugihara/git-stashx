class GitStash < Formula
  desc "CLI tool to stash and restore Git working state including staging status"
  homepage "https://github.com/yourusername/git-stashx"
  url "https://github.com/yourusername/git-stashx/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "deno"
  depends_on "git"

  def install
    # Install the main script
    libexec.install "mod.ts"
    
    # Create wrapper script
    (bin/"git-stashx").write <<~EOS
      #!/bin/bash
      exec deno run --allow-run --allow-read --allow-write "#{libexec}/mod.ts" "$@"
    EOS
    
    # Make it executable
    chmod 0755, bin/"git-stashx"
  end

  test do
    # Test version command
    assert_match "git-stashx version 1.0.0", shell_output("#{bin}/git-stashx version")
    
    # Test help command
    assert_match "Usage: git-stashx", shell_output("#{bin}/git-stashx help")
  end
end