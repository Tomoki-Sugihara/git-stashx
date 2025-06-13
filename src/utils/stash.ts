import { STAGED_COMMIT_MESSAGE, StashInfo, UNSTAGED_COMMIT_MESSAGE } from "../types.ts";
import { runGitCommand } from "./git.ts";
import { parseStashDate } from "./date.ts";

export async function getStashInfo(branchName: string): Promise<StashInfo> {
  let stagedCommit: string = "";
  let unstagedCommit: string = "";
  let date: Date = new Date();
  let description: string = "";

  // Extract date from branch name
  const dateMatch = branchName.match(/(\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2})/);
  if (dateMatch) {
    const parsedDate = parseStashDate(dateMatch[1]);
    if (parsedDate) {
      date = parsedDate;
    }
  }

  // Get commits on the stash branch (latest 2 commits only)
  const logResult = await runGitCommand([
    "log",
    "-n",
    "2",
    "--oneline",
    branchName,
  ]);

  if (logResult.success) {
    const commits = logResult.stdout.trim().split("\n").filter((line) => line.length > 0);

    for (const commit of commits) {
      const [hash, ...messageParts] = commit.split(" ");
      const message = messageParts.join(" ");

      if (message.startsWith(STAGED_COMMIT_MESSAGE)) {
        stagedCommit = hash;
        const descMatch = message.match(/ - (.+)$/);
        if (descMatch) {
          description = descMatch[1];
        }
      } else if (message.startsWith(UNSTAGED_COMMIT_MESSAGE)) {
        unstagedCommit = hash;
        if (!description) {
          const descMatch = message.match(/ - (.+)$/);
          if (descMatch) {
            description = descMatch[1];
          }
        }
      }
    }
  }

  return {
    name: branchName,
    branch: branchName,
    date: date,
    description: description,
    stagedCommit: stagedCommit,
    unstagedCommit: unstagedCommit,
  };
}
