import type { RepoData } from "../services/daily-diff/daily-diff-types";
import { GithubOperationError } from "./custom-errors";

interface GithubResourceData {
  token: string;
  apiUrl: string;
  repoOwner: string;
  author: string;
  repos: RepoData[];
}

/** Shape produced by `getDailyCommits`: one object per repo `{ [repoName]: branchResults[] }`. */
type FetchedReposFromGithub = Record<
  string,
  (Record<string, unknown> | undefined)[]
>[];

/** Single commit after parsing GitHub list-commits JSON. */
export interface ParsedGithubCommit {
  message: string;
  timestampEst: string;
  url: string;
}

export interface DailyCommitsBranchRow {
  repo: string;
  branch: string;
  commits: ParsedGithubCommit[];
}

interface GithubCommitApiItem {
  html_url?: string;
  commit?: {
    message?: string;
    author?: { date?: string } | null;
    committer?: { date?: string } | null;
  } | null;
}

function formatCommitTimestampEst(isoUtc: string | undefined): string {
  if (!isoUtc) {
    return "";
  }
  const ms = Date.parse(isoUtc);
  if (Number.isNaN(ms)) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(ms));
}

function isGithubCommitApiItem(value: unknown): value is GithubCommitApiItem {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (!("commit" in value)) {
    return true;
  }
  const commit = (value as { commit: unknown }).commit;
  if (commit === undefined || commit === null) {
    return true;
  }
  return typeof commit === "object";
}

function commitArrayFromUnknown(value: unknown): GithubCommitApiItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  if (!value.every(isGithubCommitApiItem)) {
    return null;
  }
  return value;
}

export class GithubService {
  private githubData: GithubResourceData;

  constructor(ghData: GithubResourceData) {
    this.githubData = ghData;
  }

  /** Fetches the daily commits accross all repos */
  public async getDailyCommits() {
    const { repos, apiUrl, repoOwner, token, author } = this.githubData;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      const fetchedReposFromGithub = await Promise.all(
        repos.map(async (repo) => {
          const branchesAndCommits = await Promise.all(
            repo.branches.map(async (branch) => {
              try {
                const response = await fetch(
                  `${apiUrl}/repos/${repoOwner}/${repo.name}/commits?author=${author}&since=${since}&sha=${branch}`,
                  {
                    headers: {
                      Accept: "application/vnd.github+json",
                      Authorization: `Bearer ${token}`,
                      "X-GitHub-Api-Version": "2026-03-10",
                      "User-Agent": "personal-api-daily-diff",
                    },
                  },
                );
                const commits = await response.json();
                return { [branch]: commits };
              } catch (error) {
                console.error("An error occurred fetching a github commit: ", {
                  ...(error instanceof Error && { error }),
                  branch,
                  repo,
                });
              }
            }),
          );

          return { [repo.name]: branchesAndCommits };
        }),
      );

      return this.parseGithubBranchCommits(fetchedReposFromGithub);
    } catch (error) {
      console.error("An error occurred fetching daily commits: ", error);
      throw new GithubOperationError("Failed to fetch the daily commits");
    }
  }

  /** Parses the fetched branches commits to store the data in a cleaner structure */
  private parseGithubBranchCommits(
    githubData: FetchedReposFromGithub,
  ): DailyCommitsBranchRow[] {
    const rows: DailyCommitsBranchRow[] = [];

    for (const ghData of githubData) {
      for (const [repo, data] of Object.entries(ghData)) {
        for (const branchData of data) {
          if (!branchData) {
            continue;
          }

          for (const [branch, rawCommits] of Object.entries(branchData)) {
            const commitList = commitArrayFromUnknown(rawCommits);
            if (commitList === null || commitList.length === 0) {
              continue;
            }

            const commits: ParsedGithubCommit[] = commitList.map((item) => {
              const dateIso =
                item.commit?.author?.date ??
                item.commit?.committer?.date ??
                undefined;

              return {
                message: item.commit?.message ?? "",
                timestampEst: formatCommitTimestampEst(dateIso),
                url: item.html_url ?? "",
              };
            });

            rows.push({ repo, branch, commits });
          }
        }
      }
    }

    return rows;
  }
}
