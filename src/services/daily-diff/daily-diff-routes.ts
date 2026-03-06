import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { UpdateReposOperation } from './daily-diff-schemas';
import z from 'zod';

export const DailyDiffService = new Hono<{ Bindings: Env }>();

/** Adds a new repo to fetch data for */
DailyDiffService.post(
  '/repos',
  zValidator('json', UpdateReposOperation),
  async (c) => {
    const data = c.req.valid('json');

    let repos = await c.env.DAILY_DIFF.get('repos')
      .then(async (data) => {
        if (data) {
          return data;
        }

        const initialized_data = JSON.stringify([]);
        await c.env.DAILY_DIFF.put('repos', initialized_data);

        return initialized_data;
      })
      .then((res) => {
        const parsed_data = JSON.parse(res);
        const result = z.array(z.string()).safeParse(parsed_data);

        if (!result.success) {
          return [];
        }

        return result.data;
      });

    repos.push(...data.names.filter((name) => !repos.includes(name)));

    await c.env.DAILY_DIFF.put('repos', JSON.stringify(repos));

    return c.json({ success: true }, 200);
  }
);
