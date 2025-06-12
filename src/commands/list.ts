import { BackupInfo, STAGED_COMMIT_MESSAGE, UNSTAGED_COMMIT_MESSAGE } from "../types.ts";
import { getBackupBranches, isGitRepository, runGitCommand } from "../utils/git.ts";
import { formatRelativeTime, parseBackupDate } from "../utils/date.ts";

async function getBackupInfo(branchName: string): Promise<BackupInfo> {
  const info: BackupInfo = {
    name: branchName,
    branch: branchName,
    date: new Date(),
    stagedCommit: '',
    unstagedCommit: '',
  };

  // Extract date from branch name
  const dateMatch = branchName.match(/(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})/);
  if (dateMatch) {
    const parsedDate = parseBackupDate(dateMatch[1]);
    if (parsedDate) {
      info.date = parsedDate;
    }
  }

  // Get commits on the backup branch
  const logResult = await runGitCommand([
    "log",
    "--oneline",
    "--no-merges",
    `${branchName}`,
    "--not",
    "--all",
    `--exclude=${branchName}`,
  ]);

  if (logResult.success) {
    const commits = logResult.stdout.trim().split("\n").filter((line) => line.length > 0);

    for (const commit of commits) {
      const [hash, ...messageParts] = commit.split(" ");
      const message = messageParts.join(" ");

      if (message.startsWith(STAGED_COMMIT_MESSAGE)) {
        info.stagedCommit = hash;
        const descMatch = message.match(/ - (.+)$/);
        if (descMatch) {
          info.description = descMatch[1];
        }
      } else if (message.startsWith(UNSTAGED_COMMIT_MESSAGE)) {
        info.unstagedCommit = hash;
        if (!info.description) {
          const descMatch = message.match(/ - (.+)$/);
          if (descMatch) {
            info.description = descMatch[1];
          }
        }
      }
    }
  }

  return info;
}

export async function listBackups(): Promise<void> {
  // Verify we're in a git repository
  if (!await isGitRepository()) {
    throw new Error("Not in a git repository");
  }

  const branches = await getBackupBranches();

  if (branches.length === 0) {
    console.log("No backups found");
    return;
  }

  console.log("Available backups:\n");

  // Get info for each backup
  const backupInfos = await Promise.all(
    branches.map((branch) => getBackupInfo(branch)),
  );

  // Sort by date (newest first)
  backupInfos.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Display backups
  for (const info of backupInfos) {
    console.log(`• ${info.branch}`);
    console.log(`  Created: ${formatRelativeTime(info.date)} (${info.date.toLocaleString()})`);
    if (info.description) {
      console.log(`  Description: ${info.description}`);
    }

    const changes: string[] = [];
    if (info.stagedCommit) changes.push("staged");
    if (info.unstagedCommit) changes.push("unstaged");
    if (changes.length > 0) {
      console.log(`  Contains: ${changes.join(" and ")} changes`);
    }
    console.log();
  }

  console.log(`Total: ${backupInfos.length} backup${backupInfos.length > 1 ? "s" : ""}`);
  console.log("\nTo restore a backup, run:");
  console.log("  git-backup restore [backup-name]");
}
