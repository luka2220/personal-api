import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { DBOperationError } from "../../shared/custom-errors";
import { getDB } from "../../shared/database";
import {
  UpdateReposOperation,
  BranchInsertOperation,
  BranchesPayload,
} from "./daily-diff-schemas";

export const DailyDiffService = new Hono<{ Bindings: Env }>();

/** DailyDiff Service Error Handling */
DailyDiffService.onError((err, c) => {
  if (err instanceof DBOperationError) {
    console.error("A DB operation error occurred: ", err);
    return c.json({ message: "Database error" }, 500);
  }

  console.error("An error occurred in the daily diff service: ", err);
  return c.json({ message: "Something went wrong" }, 500);
});

type RepoData = string[];
type RepoBranchData = Record<string, string[]>;

function uniqueOrdered(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((n) => {
    if (seen.has(n)) {
      return false;
    }
    seen.add(n);
    return true;
  });
}

function omitRepoFromBranches(
  branches: RepoBranchData,
  name: string,
): RepoBranchData {
  return Object.fromEntries(
    Object.entries(branches).filter(([k]) => k !== name),
  );
}

function uniqBranches(branches: string[]): string[] {
  return Array.from(new Set(branches));
}

async function loadReposAndBranches(
  env: Env,
): Promise<[RepoData, RepoBranchData]> {
  const repoPromise = getDB<RepoData>(env.DAILY_DIFF, "repos", "json").then(
    (record) => record ?? [],
  );
  const branchPromise = getDB<RepoBranchData>(
    env.DAILY_DIFF,
    "branches",
    "json",
  ).then((record) => record ?? {});
  return Promise.all([repoPromise, branchPromise]);
}

/** Adds repos and stores the same branch list for each new repo */
DailyDiffService.post(
  "/repos",
  zValidator("json", UpdateReposOperation),
  async (c) => {
    const data = c.req.valid("json");
    const [repos, branches] = await loadReposAndBranches(c.env);

    const payloadNames = uniqueOrdered(data.names);
    const conflicting = payloadNames.filter((name) => repos.includes(name));
    if (conflicting.length > 0) {
      return c.json(
        {
          message: "One or more repos are already registered",
          repos: conflicting,
        },
        409,
      );
    }

    const dedupedBranches = uniqBranches(data.branches);
    for (const name of payloadNames) {
      repos.push(name);
      branches[name] = [...dedupedBranches];
    }

    await Promise.all([
      c.env.DAILY_DIFF.put("repos", JSON.stringify(repos)),
      c.env.DAILY_DIFF.put("branches", JSON.stringify(branches)),
    ]);

    return c.json({ success: true }, 200);
  },
);

/** Gets the list of all repos */
DailyDiffService.get("/repos", async (c) => {
  const repos = await getDB<RepoData>(c.env.DAILY_DIFF, "repos", "json").then(
    (record) => record ?? [],
  );

  return c.json({ repos }, 200);
});

/** Gets branch names for a repo */
DailyDiffService.get("/repos/:name/branches", async (c) => {
  const name = c.req.param("name");
  const [repos, branches] = await loadReposAndBranches(c.env);

  if (!repos.includes(name)) {
    return c.json({ message: "Repo not found", repo: name }, 404);
  }

  return c.json({ repo: name, branches: branches[name] ?? [] }, 200);
});

/** Replaces the branch list for a repo */
DailyDiffService.put(
  "/repos/:name/branches",
  zValidator("json", BranchesPayload),
  async (c) => {
    const name = c.req.param("name");
    const body = c.req.valid("json");
    const [repos, branches] = await loadReposAndBranches(c.env);

    if (!repos.includes(name)) {
      return c.json({ message: "Repo not found", repo: name }, 404);
    }

    branches[name] = uniqBranches(body.branches);
    await c.env.DAILY_DIFF.put("branches", JSON.stringify(branches));

    return c.json({ success: true, repo: name, branches: branches[name] }, 200);
  },
);

/** Removes all branch entries for a repo from the branches map */
DailyDiffService.delete("/repos/:name/branches", async (c) => {
  const name = c.req.param("name");
  const [repos, branches] = await loadReposAndBranches(c.env);

  if (!repos.includes(name)) {
    return c.json({ message: "Repo not found", repo: name }, 404);
  }

  const nextBranches = omitRepoFromBranches(branches, name);
  await c.env.DAILY_DIFF.put("branches", JSON.stringify(nextBranches));

  return c.json({ success: true }, 200);
});

/** Removes a single branch string from a repo's list */
DailyDiffService.delete("/repos/:name/branches/:branch", async (c) => {
  const name = c.req.param("name");
  const branchSegment = c.req.param("branch");
  const branch = decodeURIComponent(branchSegment);
  const [repos, branches] = await loadReposAndBranches(c.env);

  if (!repos.includes(name)) {
    return c.json({ message: "Repo not found", repo: name }, 404);
  }

  const list = branches[name] ?? [];
  if (!list.includes(branch)) {
    return c.json({ message: "Branch not found", repo: name, branch }, 404);
  }

  branches[name] = list.filter((b) => b !== branch);
  await c.env.DAILY_DIFF.put("branches", JSON.stringify(branches));

  return c.json({ success: true, repo: name, branches: branches[name] }, 200);
});

/** Removes a repo from the repos list and its branches entry */
DailyDiffService.delete("/repos/:name", async (c) => {
  const name = c.req.param("name");

  const [repos, branches] = await loadReposAndBranches(c.env);

  const newRepos = repos.filter((repo) => repo !== name);
  const nextBranches = omitRepoFromBranches(branches, name);

  await Promise.all([
    c.env.DAILY_DIFF.put("repos", JSON.stringify(newRepos)),
    c.env.DAILY_DIFF.put("branches", JSON.stringify(nextBranches)),
  ]);

  return c.json({ success: true }, 200);
});

/** Appends branch names to a repo's list */
DailyDiffService.post(
  "/branch",
  zValidator("json", BranchInsertOperation),
  async (c) => {
    const body = c.req.valid("json");
    const [repos, branches] = await loadReposAndBranches(c.env);

    if (!repos.includes(body.repo)) {
      return c.json({ message: "Repo not found", repo: body.repo }, 404);
    }

    branches[body.repo] = uniqBranches([
      ...(branches[body.repo] ?? []),
      ...body.branches,
    ]);
    await c.env.DAILY_DIFF.put("branches", JSON.stringify(branches));

    return c.json(
      { success: true, repo: body.repo, branches: branches[body.repo] },
      200,
    );
  },
);
