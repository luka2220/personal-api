import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import * as z from "zod";

export const DeepidvService = new Hono();

const TestWebhookSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().min(0).max(100),
});

DeepidvService.post("/wh", zValidator("json", TestWebhookSchema), (c) => {
  const data = c.req.valid("json");
  const signature = c.req.header("deepidv-signature");
  console.log("Data sent from deepidv: ", data);
  console.log("Deepidv Signature: ", signature);
  return c.text("Pinged webhook endpoint");
});
