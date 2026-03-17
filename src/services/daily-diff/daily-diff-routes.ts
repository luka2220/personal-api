import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { UpdateReposOperation } from './daily-diff-schemas';
import { getDB } from '../../shared/database';

export const DailyDiffService = new Hono<{ Bindings: Env }>();

/** DailyDiff Service Error Handling */
DailyDiffService.onError((err, c) => {
  if (err instanceof DBOperationError) {
    console.error('A DB operation error occurred: ', err);
    return c.json({ message: 'Database error' }, 500);
  }

  console.error('An error occurred in the daily diff service: ', err);
  return c.json({ message: 'Something went wrong' }, 500);
});

type RepoData = Array<string>;

/** Adds a new repo to fetch data for */
DailyDiffService.post(
  '/repos',
  zValidator('json', UpdateReposOperation),
  async (c) => {
    const data = c.req.valid('json');

    const repos = await getDB<RepoData>(c.env.DAILY_DIFF, 'repos', 'json').then(
      (record) => (!record ? [] : record),
    );

    repos.push(...data.names.filter((name) => !repos.includes(name)));
    await c.env.DAILY_DIFF.put('repos', JSON.stringify(repos));

    return c.json({ success: true }, 200);
  },
);

/** Removes a repo from the repos list */
DailyDiffService.delete('/repos/:name', async (c) => {
  const name = c.req.param('name');

  const repos = await getDB<RepoData>(c.env.DAILY_DIFF, 'repos', 'json').then(
    (record) => (!record ? [] : record),
  );

  const new_repos = repos.filter((repo) => repo !== name);
  await c.env.DAILY_DIFF.put('repos', JSON.stringify(new_repos));

  return c.json({ success: true }, 200);
});

/** Gets the list of all repos */
DailyDiffService.get('/repos', async (c) => {
  const repos = await getDB<RepoData>(c.env.DAILY_DIFF, 'repos', 'json').then(
    (record) => (!record ? [] : record),
  );

  return c.json({ repos }, 200);
});
