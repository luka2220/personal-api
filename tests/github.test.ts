import { beforeAll, test } from "bun:test";

import type { Repos } from "../src/services/daily-diff/daily-diff-types";
import { DailyDiffDB } from "../src/shared/database/daily-diff-db";
import { GithubService } from "../src/shared/github";
import { createKVMock } from "./mocks/kv-namespace.mock";

// Mock repo data
const MOCK_REPOS: Repos = [
  {
    name: "deepidv-backend-cdk",
    branches: ["dev", "preprod", "main", "DIDV-103"],
  },
  {
    name: "deepidv-backoffice",
    branches: ["dev", "preprod", "main", "DIDV-103"],
  },
  {
    name: "deepidv-verify-ts",
    branches: ["dev", "preprod", "main", "DIDV-103"],
  },
  { name: "deepidv-open-api", branches: ["dev", "main"] },
  { name: "deepidv-shared-deps", branches: ["main"] },
];

let gh: GithubService;
let db: DailyDiffDB;

beforeAll(async () => {
  const kvMock = createKVMock({
    repos: JSON.stringify(MOCK_REPOS),
  });
  db = new DailyDiffDB(kvMock);
  const repos = await db.fetchRepoData();

  gh = new GithubService({
    apiUrl: process.env.GH_API_URL,
    author: process.env.GH_AUTHOR,
    repoOwner: process.env.GH_REPO_OWNER,
    token: process.env.GH_TOKEN,
    repos,
  });
});

test("Github Service", async () => {
  const commits = await gh.getDailyCommits();
  console.dir(commits, { color: true, depth: null });
});
