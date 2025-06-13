export interface GitCommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

export interface StashInfo {
  name: string;
  branch: string;
  date: Date;
  description?: string;
  stagedCommit: string;
  unstagedCommit: string;
}

export interface FileStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export const STASH_PREFIX = "stash/";
export const STAGED_COMMIT_MESSAGE = "Staged changes";
export const UNSTAGED_COMMIT_MESSAGE = "Unstaged changes";
