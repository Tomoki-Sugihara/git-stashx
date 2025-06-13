import { getStashBranches, isGitRepository } from "../utils/git.ts";
import { formatRelativeTime } from "../utils/date.ts";
import { getStashInfo } from "../utils/stash.ts";

export async function listStashs(): Promise<void> {
  // Verify we're in a git repository
  if (!await isGitRepository()) {
    throw new Error("Not in a git repository");
  }

  const branches = await getStashBranches();

  if (branches.length === 0) {
    console.log("No stashs found");
    return;
  }

  console.log("Available stashs:\n");

  // Get info for each stash
  const stashInfos = await Promise.all(
    branches.map((branch) => getStashInfo(branch)),
  );

  // Sort by date (newest first)
  stashInfos.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Display stashs
  for (const info of stashInfos) {
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

  console.log(`Total: ${stashInfos.length} stash${stashInfos.length > 1 ? "s" : ""}`);
  console.log("\nTo restore a stash, run:");
  console.log("  git-stashx restore [stash-name]");
}
