import { Hono } from 'hono';
import { logger } from 'hono/logger';

import scheduled from './handlers/cron-schedule-handler';
import { DeepidvService, DailyDiffService } from './services';

const app = new Hono<{ Bindings: Env }>();

app.use(logger());

app.onError((err, c) => {
  console.log('An error occurred in the global router: ', err);
  return c.text('Something went wrong', 500);
});

app.get('/', (c) => {
  // Possibly return a simple static page here
  return c.text('Hello Hono!');
});

// v1 api
app.route('/api/v1/deepidv', DeepidvService);
app.route('/api/v1/daily-diff', DailyDiffService);

export default {
  fetch: app.fetch,
  scheduled, // Cron Job Handler
};
