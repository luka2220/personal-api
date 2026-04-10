/** Single repo entry*/
export interface RepoData {
  name: string;
  branches: string[];
}

/** Represents a map of repo names to their branch lists in the Daily Diff DB */
export type Repos = RepoData[];
