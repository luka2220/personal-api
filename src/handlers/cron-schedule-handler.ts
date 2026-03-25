import { EmailService } from '../shared/email';

/** Executes when the cron schedule is triggered via the wrangler config */
export default async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext
) {
  console.info('Cron Job Running');

  // Generate the Github data here

  const emailService = new EmailService(
    'piplicaluka64@gmail.com',
    'daily-diff@lukapiplica.net',
    env.DailyDiffEmail
  );

  emailService.config({
    senderName: 'daily-diff',
    subject: 'Daily Diff Email',
    messageContentType: 'text/plain',
    data: 'Github data',
  });

  try {
    await emailService.send();
  } catch (error) {
    console.error('An error occurred sending the daily diff email.', error);
    return new Response('An error occurred sending the daily diff email.');
  }

  return new Response('Hello Send Email World!');
}
