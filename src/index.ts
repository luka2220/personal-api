import { Hono } from "hono";

import { DeepidvService } from "./services";
import { logger } from "hono/logger";

const app = new Hono();

const BaseRoute = "/api/v1";
const createRoute = (r: string) => `${BaseRoute}/${r}`;

app.use(logger());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route(createRoute("deepidv"), DeepidvService);

export default app;
