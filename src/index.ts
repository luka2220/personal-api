import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { DeepidvService, DailyDiffService } from './services';

const app = new Hono<{ Bindings: Env }>();

app.use(logger());

app.get('/', (c) => {
  // Possibly return a simple static page here
  return c.text('Hello Hono!');
});

// v1 api
app.route('/v1/deepidv', DeepidvService);
app.route('/v1/daily-diff', DailyDiffService);

export default app;
