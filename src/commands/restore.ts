import {
  branchExists,
  cherryPick,
  getBackupBranches,
  hasChanges,
  isGitRepository,
  resetMixed,
  resetSoft,
} from "../utils/git.ts";
import { formatRelativeTime } from "../utils/date.ts";
import { select } from "../utils/prompt.ts";
import { getBackupInfo } from "../utils/backup.ts";

async function selectBackup(): Promise<string | null> {
  const branches = await getBackupBranches();

  if (branches.length === 0) {
    console.log("No backups found");
    return null;
  }

  // Get info for each backup
  const backupInfos = await Promise.all(
    branches.map((branch) => getBackupInfo(branch)),
  );

  // Sort by date (newest first)
  backupInfos.sort((a, b) => b.date.getTime() - a.date.getTime());

  const options = backupInfos.map((info) => ({
    value: info.branch,
    label: `${info.branch} (${formatRelativeTime(info.date)})${
      info.description ? ` - ${info.description}` : ""
    }`,
  }));

  return await select("Select a backup to restore:", options);
}

export async function restoreBackup(backupName?: string): Promise<void> {
  // Verify we're in a git repository
  if (!await isGitRepository()) {
    throw new Error("Not in a git repository");
  }

  // Check for uncommitted changes
  if (await hasChanges()) {
    throw new Error(
      "Cannot restore backup: working directory has uncommitted changes.\n" +
        "Please commit or stash your changes first.",
    );
  }

  // Select backup if not provided
  if (!backupName) {
    const selected = await selectBackup();
    if (!selected) {
      return;
    }
    backupName = selected;
  }

  // Verify backup exists
  if (!await branchExists(backupName)) {
    throw new Error(`Backup branch not found: ${backupName}`);
  }

  // Get backup information
  const backupInfo = await getBackupInfo(backupName);

  console.log(`\nRestoring backup: ${backupName}`);
  if (backupInfo.description) {
    console.log(`Description: ${backupInfo.description}`);
  }
  console.log(`Created: ${formatRelativeTime(backupInfo.date)}`);

  try {
    console.log("Restoring staged changes...");
    await cherryPick(backupInfo.stagedCommit);
    console.log("  ✓ Staged changes restored");

    console.log("Restoring unstaged changes...");
    await cherryPick(backupInfo.unstagedCommit);
    console.log("  ✓ Unstaged changes restored");

    console.log("Restoring original staging state...");
    await resetMixed("HEAD~1");
    console.log("  ✓ Original staging state restored");

    console.log("Restoring original staging state...");
    await resetSoft("HEAD~1");
    console.log("  ✓ Original staging state restored");

    console.log("\nBackup restored successfully!");
  } catch (error) {
    console.error("\nError during restoration:", (error as Error).message);
    console.error("You may need to resolve conflicts manually.");
    throw error;
  }
}
