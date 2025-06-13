import { STAGED_COMMIT_MESSAGE, STASH_PREFIX, UNSTAGED_COMMIT_MESSAGE } from "../types.ts";
import {
  addAllFiles,
  checkoutBranch,
  commit,
  createBranch,
  getCurrentBranch,
  getFileStatus,
  hasChanges,
  isGitRepository,
} from "../utils/git.ts";
import { formatStashDate } from "../utils/date.ts";

export async function saveStash(description?: string): Promise<void> {
  // Verify we're in a git repository
  if (!await isGitRepository()) {
    throw new Error("Not in a git repository");
  }

  // Check if there are any changes to stash
  if (!await hasChanges()) {
    console.log("No changes to stash");
    return;
  }

  const originalBranch = await getCurrentBranch();
  const stashBranchName = `${STASH_PREFIX}${formatStashDate()}`;

  console.log(`Creating stash branch: ${stashBranchName}`);

  try {
    // Get file status before creating stash
    const fileStatus = await getFileStatus();

    // Create and switch to stash branch
    await createBranch(stashBranchName);

    // First commit: staged changes
    if (fileStatus.staged.length > 0) {
      console.log("Committing staged changes...");
      let message = STAGED_COMMIT_MESSAGE;
      if (description) {
        message += ` - ${description}`;
      }
      const stagedCommit = await commit(message);
      console.log(`  Created commit: ${stagedCommit}`);
    }

    // Second commit: unstaged changes and untracked files
    if (fileStatus.unstaged.length > 0 || fileStatus.untracked.length > 0) {
      console.log("Committing unstaged changes and untracked files...");

      // Add all remaining changes
      await addAllFiles();

      let message = UNSTAGED_COMMIT_MESSAGE;
      if (description) {
        message += ` - ${description}`;
      }
      const unstagedCommit = await commit(message);
      console.log(`  Created commit: ${unstagedCommit}`);
    }

    // Return to original branch
    await checkoutBranch(originalBranch);

    console.log("\nStash created successfully!");
    console.log(`Branch: ${stashBranchName}`);
    if (description) {
      console.log(`Description: ${description}`);
    }
    console.log("\nTo restore this stash, run:");
    console.log(`  git-stashx restore ${stashBranchName}`);
  } catch (error) {
    // Try to return to original branch if something went wrong
    try {
      await checkoutBranch(originalBranch);
    } catch {
      // Ignore error if we can't return
    }
    throw error;
  }
}
