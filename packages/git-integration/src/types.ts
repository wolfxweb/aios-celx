/** One path in `git status --porcelain` semantics (simplified). */
export type GitFileEntry = {
  path: string;
  /** Staging area state (e.g. `M`, `A`, ` `). */
  index: string;
  /** Working tree state. */
  working_dir: string;
};

/** Result of inspecting the working tree (local only). */
export type GitStatusResult = {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  files: GitFileEntry[];
  isClean: boolean;
};

/** Handle for a managed project directory (always `projects/<id>/`). */
export class GitRepository {
  constructor(readonly projectRoot: string) {}

  /** Absolute path to the Git work tree root (same as project root). */
  get root(): string {
    return this.projectRoot;
  }
}
