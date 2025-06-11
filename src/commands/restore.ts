import { BackupInfo, STAGED_COMMIT_MESSAGE, UNSTAGED_COMMIT_MESSAGE } from "../types.ts";
import {
  branchExists,
  cherryPick,
  getBackupBranches,
  hasChanges,
  isGitRepository,
  resetMixed,
  resetSoft,
  runGitCommand,
} from "../utils/git.ts";
import { formatRelativeTime, parseBackupDate } from "../utils/date.ts";
import { confirm, select } from "../utils/prompt.ts";

async function getBackupInfo(branchName: string): Promise<BackupInfo> {
  const info: BackupInfo = {
    name: branchName,
    branch: branchName,
    date: new Date(),
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

  // Confirm restoration
  const confirmed = await confirm("\nProceed with restoration?", true);
  if (!confirmed) {
    console.log("Restoration cancelled");
    return;
  }

  try {
    let hasRestoredStaged = false;
    let hasRestoredUnstaged = false;

    // Restore staged changes
    if (backupInfo.stagedCommit) {
      console.log("\nRestoring staged changes...");
      await cherryPick(backupInfo.stagedCommit);
      hasRestoredStaged = true;
      console.log("  ✓ Staged changes restored");
    }

    // Restore unstaged changes
    if (backupInfo.unstagedCommit) {
      console.log("Restoring unstaged changes...");
      await cherryPick(backupInfo.unstagedCommit);
      hasRestoredUnstaged = true;
      console.log("  ✓ Unstaged changes restored");
    }

    // Reset to restore the original staging state
    if (hasRestoredStaged && hasRestoredUnstaged) {
      // Both commits were applied, need to unstage the second commit
      console.log("Restoring original staging state...");
      await resetMixed("HEAD~1");
      console.log("  ✓ Original staging state restored");
    } else if (hasRestoredStaged && !hasRestoredUnstaged) {
      // Only staged commit was applied, need to unstage it
      console.log("Restoring original staging state...");
      await resetSoft("HEAD~1");
      console.log("  ✓ Original staging state restored");
    }

    console.log("\nBackup restored successfully!");
  } catch (error) {
    console.error("\nError during restoration:", error.message);
    console.error("You may need to resolve conflicts manually.");
    throw error;
  }
}
