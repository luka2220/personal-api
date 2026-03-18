import { EmailMessage } from 'cloudflare:email';

import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { createMimeMessage } from 'mimetext';
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
  // Cron Job Handler
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    console.info('Cron Job Running');

    const msg = createMimeMessage();

    msg.setSender({ name: 'daily-diff', addr: 'daily-diff@lukapiplica.net' });
    msg.setRecipient('piplicaluka64@gmail.com');
    msg.setSubject('Test email coming from cloudflare worker');
    msg.addMessage({
      contentType: 'text/plain',
      data: `Congratulations, you just sent an email from a worker.`,
    });

    const message = new EmailMessage(
      'daily-diff@lukapiplica.net',
      'piplicaluka64@gmail.com',
      msg.asRaw()
    );

    try {
      await env.DailyDiffEmail.send(message);
    } catch (e) {
      console.error('Error sending email: ', e);
      return new Response('An error occurred sending an email');
    }

    return new Response('Hello Send Email World!');
  },
};
