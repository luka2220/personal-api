import type { DailyCommitsBranchRow } from "./github";

/** Plain-text body listing commits grouped by repo → branch (US/Eastern in headers). */
export function formatDailyCommitsEmailBody(
  rows: DailyCommitsBranchRow[],
  authorLogin: string,
): string {
  const generatedAt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  const lines: string[] = [
    "Daily commit summary",
    "====================",
    "",
    `Generated: ${generatedAt} (US/Eastern)`,
    `GitHub author filter: ${authorLogin}`,
    "",
  ];

  if (rows.length === 0) {
    lines.push(
      "No commits were found in the last 24 hours for any tracked repository branch.",
      "",
      "If you expected activity, check branch names in KV and that commits match GH_AUTHOR.",
    );
    return lines.join("\n").trimEnd() + "\n";
  }

  const byRepo = new Map<string, DailyCommitsBranchRow[]>();
  for (const row of rows) {
    const list = byRepo.get(row.repo) ?? [];
    list.push(row);
    byRepo.set(row.repo, list);
  }

  const repoNames = [...byRepo.keys()].sort((a, b) => a.localeCompare(b));

  for (const repo of repoNames) {
    lines.push(`Repository: ${repo}`);
    lines.push("-".repeat(Math.min(repo.length + 14, 76)));
    lines.push("");

    const branches = (byRepo.get(repo) ?? []).sort((a, b) =>
      a.branch.localeCompare(b.branch),
    );

    for (const { branch, commits } of branches) {
      lines.push(`  Branch: ${branch}`);
      lines.push("");

      commits.forEach((c, i) => {
        const raw = (c.message ?? "").trimEnd();
        const msgLines = (raw || "(no subject)").split(/\r?\n/);
        const [first, ...rest] = msgLines;
        const headline = (first ?? "").trim() || "(no subject)";

        lines.push(`  ${i + 1}. ${headline}`);
        for (const continuation of rest) {
          lines.push(continuation.trim() === "" ? "" : `      ${continuation}`);
        }
        if (c.timestampEst) {
          lines.push(`      When: ${c.timestampEst}`);
        }
        if (c.url) {
          lines.push(`      ${c.url}`);
        }
        lines.push("");
      });
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

export function dailyDiffEmailSubject(): string {
  const d = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
  }).format(new Date());
  return `Daily diff — ${d}`;
}
