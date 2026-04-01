import { stat } from "node:fs/promises";
import { join } from "node:path";
import { simpleGit, type FileStatusResult, type SimpleGit } from "simple-git";
import type { GitFileEntry, GitStatusResult } from "./types.js";
import { appendGitEvent } from "./git-events-log.js";

/** True only if `<projectRoot>/.git` exists (not merely inside a parent repo). */
export async function hasLocalGitRepository(projectRoot: string): Promise<boolean> {
  try {
    await stat(join(projectRoot, ".git"));
    return true;
  } catch {
    return false;
  }
}

export class GitService {
  private readonly git: SimpleGit;

  constructor(private readonly projectRoot: string) {
    this.git = simpleGit({ baseDir: projectRoot });
  }

  async isRepository(): Promise<boolean> {
    return hasLocalGitRepository(this.projectRoot);
  }

  async init(projectId: string): Promise<void> {
    await this.git.init();
    await appendGitEvent(this.projectRoot, {
      type: "git.init",
      projectId,
    });
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.revparse(["--abbrev-ref", "HEAD"]);
      return branch.trim();
    } catch {
      return "(no commits)";
    }
  }

  async createBranch(branchName: string, projectId: string): Promise<void> {
    await this.git.checkoutLocalBranch(branchName);
    await appendGitEvent(this.projectRoot, {
      type: "git.branch.create",
      projectId,
      branch: branchName,
    });
  }

  async checkout(branchName: string, projectId: string): Promise<void> {
    await this.git.checkout(branchName);
    await appendGitEvent(this.projectRoot, {
      type: "git.checkout",
      projectId,
      branch: branchName,
    });
  }

  async status(): Promise<GitStatusResult> {
    const s = await this.git.status();
    const files: GitFileEntry[] = s.files.map((f: FileStatusResult) => ({
      path: f.path,
      index: f.index,
      working_dir: f.working_dir,
    }));
    return {
      current: s.current ?? null,
      tracking: s.tracking ?? null,
      ahead: s.ahead,
      behind: s.behind,
      files,
      isClean: s.isClean(),
    };
  }

  async addAll(projectId: string): Promise<void> {
    await this.git.add(".");
    await appendGitEvent(this.projectRoot, {
      type: "git.add",
      projectId,
      paths: ["."],
    });
  }

  async add(paths: string[], projectId: string): Promise<void> {
    await this.git.add(paths);
    await appendGitEvent(this.projectRoot, {
      type: "git.add",
      projectId,
      paths,
    });
  }

  async commit(message: string, projectId: string): Promise<void> {
    await this.git.commit(message);
    await appendGitEvent(this.projectRoot, {
      type: "git.commit",
      projectId,
      message,
    });
  }

  /** Unstaged diff (working tree vs index). */
  async diff(): Promise<string> {
    return this.git.diff();
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const s = await this.status();
    return !s.isClean;
  }

}

export function createGitService(projectRoot: string): GitService {
  return new GitService(projectRoot);
}
