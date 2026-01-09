import { Hono } from 'hono';

export const DeepidvService = new Hono();

DeepidvService.post('/wh', async (c) => {
  const data = await c.req.json();
  const signature = c.req.header('deepidv-signature');
  console.log('Data sent from deepidv: ', data);
  console.log('Deepidv Signature: ', signature);
  return c.text('Pinged webhook endpoint');
});
