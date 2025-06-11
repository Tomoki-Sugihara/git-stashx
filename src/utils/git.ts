import { BACKUP_PREFIX, FileStatus, GitCommandResult } from "../types.ts";

export async function runGitCommand(args: string[]): Promise<GitCommandResult> {
  const command = new Deno.Command("git", {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  return {
    success: code === 0,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
    code,
  };
}

export async function isGitRepository(): Promise<boolean> {
  const result = await runGitCommand(["rev-parse", "--git-dir"]);
  return result.success;
}

export async function getCurrentBranch(): Promise<string> {
  const result = await runGitCommand(["branch", "--show-current"]);
  if (!result.success) {
    throw new Error("Failed to get current branch: " + result.stderr);
  }
  return result.stdout.trim();
}

export async function hasChanges(): Promise<boolean> {
  const result = await runGitCommand(["status", "--porcelain"]);
  if (!result.success) {
    throw new Error("Failed to check git status: " + result.stderr);
  }
  return result.stdout.trim().length > 0;
}

export async function getFileStatus(): Promise<FileStatus> {
  const result = await runGitCommand(["status", "--porcelain"]);
  if (!result.success) {
    throw new Error("Failed to get git status: " + result.stderr);
  }

  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];

  const lines = result.stdout.trim().split("\n").filter((line) => line.length > 0);

  for (const line of lines) {
    const status = line.substring(0, 2);
    const filename = line.substring(3);

    if (status[0] !== " " && status[0] !== "?") {
      staged.push(filename);
    }
    if (status[1] !== " " && status[1] !== "?") {
      unstaged.push(filename);
    }
    if (status === "??") {
      untracked.push(filename);
    }
  }

  return { staged, unstaged, untracked };
}

export async function createBranch(branchName: string): Promise<void> {
  const result = await runGitCommand(["checkout", "-b", branchName]);
  if (!result.success) {
    throw new Error(`Failed to create branch ${branchName}: ${result.stderr}`);
  }
}

export async function checkoutBranch(branchName: string): Promise<void> {
  const result = await runGitCommand(["checkout", branchName]);
  if (!result.success) {
    throw new Error(`Failed to checkout branch ${branchName}: ${result.stderr}`);
  }
}

export async function addFiles(files: string[]): Promise<void> {
  if (files.length === 0) return;

  const result = await runGitCommand(["add", ...files]);
  if (!result.success) {
    throw new Error(`Failed to add files: ${result.stderr}`);
  }
}

export async function addAllFiles(): Promise<void> {
  const result = await runGitCommand(["add", "-A"]);
  if (!result.success) {
    throw new Error(`Failed to add all files: ${result.stderr}`);
  }
}

export async function commit(message: string): Promise<string> {
  const result = await runGitCommand(["commit", "-m", message]);
  if (!result.success) {
    throw new Error(`Failed to commit: ${result.stderr}`);
  }

  // Extract commit hash from output
  const match = result.stdout.match(/\[[\w\s-]+\s+([a-f0-9]+)\]/);
  return match ? match[1] : "";
}

export async function cherryPick(commitHash: string): Promise<void> {
  const result = await runGitCommand(["cherry-pick", commitHash]);
  if (!result.success) {
    throw new Error(`Failed to cherry-pick ${commitHash}: ${result.stderr}`);
  }
}

export async function resetSoft(commitRef: string = "HEAD~1"): Promise<void> {
  const result = await runGitCommand(["reset", "--soft", commitRef]);
  if (!result.success) {
    throw new Error(`Failed to soft reset to ${commitRef}: ${result.stderr}`);
  }
}

export async function resetMixed(commitRef: string = "HEAD~1"): Promise<void> {
  const result = await runGitCommand(["reset", "--mixed", commitRef]);
  if (!result.success) {
    throw new Error(`Failed to mixed reset to ${commitRef}: ${result.stderr}`);
  }
}

export async function getBackupBranches(): Promise<string[]> {
  const result = await runGitCommand(["branch", "--list", `${BACKUP_PREFIX}*`]);
  if (!result.success) {
    throw new Error("Failed to list branches: " + result.stderr);
  }

  return result.stdout
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => line.trim().replace(/^\*\s*/, ""));
}

export async function branchExists(branchName: string): Promise<boolean> {
  const result = await runGitCommand(["show-ref", "--verify", `refs/heads/${branchName}`]);
  return result.success;
}

export async function getCommitMessage(commitRef: string): Promise<string> {
  const result = await runGitCommand(["log", "-1", "--pretty=%s", commitRef]);
  if (!result.success) {
    throw new Error(`Failed to get commit message for ${commitRef}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

export async function getCommitDate(commitRef: string): Promise<Date> {
  const result = await runGitCommand(["log", "-1", "--pretty=%aI", commitRef]);
  if (!result.success) {
    throw new Error(`Failed to get commit date for ${commitRef}: ${result.stderr}`);
  }
  return new Date(result.stdout.trim());
}

export async function stashSave(message?: string): Promise<void> {
  const args = ["stash", "save"];
  if (message) {
    args.push(message);
  }
  const result = await runGitCommand(args);
  if (!result.success) {
    throw new Error(`Failed to stash changes: ${result.stderr}`);
  }
}

export async function stashPop(): Promise<void> {
  const result = await runGitCommand(["stash", "pop"]);
  if (!result.success) {
    throw new Error(`Failed to pop stash: ${result.stderr}`);
  }
}
