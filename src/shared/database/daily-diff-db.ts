import type {
  Repos,
  RepoData,
} from "../../services/daily-diff/daily-diff-types";
import { uniqueOrdered } from "../../services/daily-diff/daily-diff-utils";
import { DBOperationError } from "../custom-errors";

type RepoDB = Env["DAILY_DIFF"];

/** Class for interacting with the Daily Diff DB */
export class DailyDiffDB {
  private db: RepoDB;

  constructor(db: RepoDB) {
    this.db = db;
  }

  /** Fetches the repo data from the database */
  async fetchRepoData(): Promise<Repos> {
    try {
      const data = (await this.db.get<Repos>("repos", "json")) ?? [];

      return data;
    } catch (error) {
      console.error(
        "An error occurred fetching repo data from the database: ",
        error,
      );

      throw new DBOperationError(
        "Failed to fetch repo data from the database",
        {
          table: "repos",
          operation: "get",
        },
      );
    }
  }

  /** Returns a signle repo and it's data by name or undefined none exist */
  async fetchRepoByName(name: string): Promise<RepoData | undefined> {
    try {
      const repos = await this.fetchRepoData();
      return repos.find((r) => r.name === name);
    } catch (error) {
      console.error(
        "An error occurred fetching repo data from the database: ",
        error,
      );

      throw new DBOperationError(
        "Failed to fetch repo data from the database",
        {
          table: "repos",
          operation: "get",
        },
      );
    }
  }

  /** Saves the repo data to the database */
  async saveRepoData(data: RepoData) {
    try {
      const currentRepos = await this.fetchRepoData();
      const currentRepo = currentRepos.find((r) => r.name === data.name);

      if (!currentRepo) {
        currentRepos.push(data);
        await this.db.put("repos", JSON.stringify(currentRepos));
      } else {
        const branches = uniqueOrdered([
          ...currentRepo.branches,
          ...data.branches,
        ]);

        const idx = currentRepos.indexOf(currentRepo);
        currentRepos[idx] = {
          ...currentRepos[idx],
          branches,
        };

        await this.db.put("repos", JSON.stringify(currentRepos));
      }
    } catch (error) {
      console.error(
        "An error occurred saving repo data to the database: ",
        error,
      );

      throw new DBOperationError("Failed to save repo data to the database", {
        table: "repos",
        operation: "put",
      });
    }
  }
}
