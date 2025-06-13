import {
  branchExists,
  cherryPick,
  getStashBranches,
  hasChanges,
  isGitRepository,
  resetMixed,
  resetSoft,
} from "../utils/git.ts";
import { formatRelativeTime } from "../utils/date.ts";
import { select } from "../utils/prompt.ts";
import { getStashInfo } from "../utils/stash.ts";

async function selectStash(): Promise<string | null> {
  const branches = await getStashBranches();

  if (branches.length === 0) {
    console.log("No stashs found");
    return null;
  }

  // Get info for each stash
  const stashInfos = await Promise.all(
    branches.map((branch) => getStashInfo(branch)),
  );

  // Sort by date (newest first)
  stashInfos.sort((a, b) => b.date.getTime() - a.date.getTime());

  const options = stashInfos.map((info) => ({
    value: info.branch,
    label: `${info.branch} (${formatRelativeTime(info.date)})${
      info.description ? ` - ${info.description}` : ""
    }`,
  }));

  return await select("Select a stash to restore:", options);
}

export async function restoreStash(stashName?: string): Promise<void> {
  // Verify we're in a git repository
  if (!await isGitRepository()) {
    throw new Error("Not in a git repository");
  }

  // Check for uncommitted changes
  if (await hasChanges()) {
    throw new Error(
      "Cannot restore stash: working directory has uncommitted changes.\n" +
        "Please commit or stash your changes first.",
    );
  }

  // Select stash if not provided
  if (!stashName) {
    const selected = await selectStash();
    if (!selected) {
      return;
    }
    stashName = selected;
  }

  // Verify stash exists
  if (!await branchExists(stashName)) {
    throw new Error(`stash branch not found: ${stashName}`);
  }

  // Get stash information
  const stashInfo = await getStashInfo(stashName);

  console.log(`\nRestoring stash: ${stashName}`);
  if (stashInfo.description) {
    console.log(`Description: ${stashInfo.description}`);
  }
  console.log(`Created: ${formatRelativeTime(stashInfo.date)}`);

  try {
    console.log("Restoring staged changes...");
    await cherryPick(stashInfo.stagedCommit);
    console.log("  ✓ Staged changes restored");

    console.log("Restoring unstaged changes...");
    await cherryPick(stashInfo.unstagedCommit);
    console.log("  ✓ Unstaged changes restored");

    console.log("Restoring original staging state...");
    await resetMixed("HEAD~1");
    console.log("  ✓ Original staging state restored");

    console.log("Restoring original staging state...");
    await resetSoft("HEAD~1");
    console.log("  ✓ Original staging state restored");

    console.log("\nStash restored successfully!");
  } catch (error) {
    console.error("\nError during restoration:", (error as Error).message);
    console.error("You may need to resolve conflicts manually.");
    throw error;
  }
}
