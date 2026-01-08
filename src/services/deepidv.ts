import { Hono } from 'hono';

export const DeepidvService = new Hono();

DeepidvService.post('/wh', async (c) => {
  const data = await c.req.json();
  console.log('Data sent from deepidv: ', data);
  return c.text('Pinged webhook endpoint');
});
