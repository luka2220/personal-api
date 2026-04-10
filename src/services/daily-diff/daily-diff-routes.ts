import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { DBOperationError } from "../../shared/custom-errors";
import { DailyDiffDB } from "../../shared/database/daily-diff-db";
import { CreateReposOperation } from "./daily-diff-schemas";

export const DailyDiffService = new Hono<{
  Bindings: Env;
  Variables: { dailyDiffDB: DailyDiffDB };
}>();

// Middleware to inject the DailyDiffDB instance into the context
DailyDiffService.use(async (c, next) => {
  const dailyDiffDB = new DailyDiffDB(c.env.DAILY_DIFF);
  c.set("dailyDiffDB", dailyDiffDB);
  await next();
});

/** DailyDiff Service Error Handling */
DailyDiffService.onError((err, c) => {
  if (err instanceof DBOperationError) {
    console.error("A DB operation error occurred: ", err);
    return c.json({ message: "Database error" }, 500);
  }

  console.error("An error occurred in the daily diff service: ", err);
  return c.json({ message: "Something went wrong" }, 500);
});

/** Endpoint for creating a new repo or updating existing repo branches */
DailyDiffService.post(
  "/repo",
  zValidator("json", CreateReposOperation),
  async (c) => {
    const data = c.req.valid("json");
    const dailyDiffDB = c.get("dailyDiffDB");
    await dailyDiffDB.saveRepoData(data);

    return c.newResponse(null, 200);
  },
);

/** Endpoint for fetching all repo entries */
DailyDiffService.get("/repo", async (c) => {
  const dailyDiffDB = c.get("dailyDiffDB");
  const repoData = await dailyDiffDB.fetchRepoData();
  return c.json(repoData);
});

/** Endpoint for fetching a specific repo entry */
DailyDiffService.get("/repo/:name", async (c) => {
  const name = c.req.param("name");
  const dailyDiffDB = c.get("dailyDiffDB");

  const repoData = await dailyDiffDB.fetchRepoByName(name);
  if (!repoData) {
    return c.json({ message: "Repo not found" }, 404);
  }

  return c.json(repoData);
});
