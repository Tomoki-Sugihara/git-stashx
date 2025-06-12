import { getBackupBranches, isGitRepository } from "../utils/git.ts";
import { formatRelativeTime } from "../utils/date.ts";
import { getBackupInfo } from "../utils/backup.ts";

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
