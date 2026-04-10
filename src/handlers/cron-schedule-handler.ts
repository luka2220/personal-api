import { DailyDiffDB } from "../shared/database/daily-diff-db";
import { EmailService } from "../shared/email";
import {
  dailyDiffEmailSubject,
  formatDailyCommitsEmailBody,
} from "../shared/format-daily-commits-email";
import { GithubService } from "../shared/github";

/** Executes when the cron schedule is triggered via the wrangler config */
export default async function scheduled(
  _controller: ScheduledController,
  env: Env,
  _ctx: ExecutionContext,
) {
  console.info("Cron Job Running");

  const db = new DailyDiffDB(env.DAILY_DIFF);
  const repos = await db.fetchRepoData();

  const github = new GithubService({
    apiUrl: env.GH_API_URL,
    author: env.GH_AUTHOR,
    repoOwner: env.GH_REPO_OWNER,
    token: env.GH_TOKEN,
    repos,
  });

  let body: string;
  try {
    const rows = await github.getDailyCommits();
    body = formatDailyCommitsEmailBody(rows, env.GH_AUTHOR);
  } catch (error) {
    console.error("An error occurred fetching daily commits.", error);
    return new Response("An error occurred fetching daily commits.");
  }

  const emailService = new EmailService(
    "piplicaluka64@gmail.com",
    "daily-diff@lukapiplica.net",
    env.DailyDiffEmail,
  );

  emailService.config({
    senderName: "daily-diff",
    subject: dailyDiffEmailSubject(),
    messageContentType: "text/plain",
    data: body,
  });

  try {
    await emailService.send();
  } catch (error) {
    console.error("An error occurred sending the daily diff email.", error);
    return new Response("An error occurred sending the daily diff email.");
  }

  return new Response("Daily diff email sent.");
}
