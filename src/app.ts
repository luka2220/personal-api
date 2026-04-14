import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { JwtVariables } from "hono/jwt";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";

import scheduled from "./handlers/cron-schedule-handler";
import { DeepidvService, DailyDiffService, AuthService } from "./services";

function isPublicRoute(path: string, method: string): boolean {
  if (method === "GET" && path === "/") {
    return true;
  }
  if (method === "POST" && path === "/api/v1/authentication/login") {
    return true;
  }
  if (path.startsWith("/api/v1/deepidv")) {
    return true;
  }
  return false;
}

const app = new Hono<{ Bindings: Env; Variables: JwtVariables }>();

app.use(logger());

app.use(async (c, next) => {
  if (isPublicRoute(c.req.path, c.req.method)) {
    return next();
  }
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: "HS256",
  });
  return jwtMiddleware(c, next);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.log("An error occurred in the global router: ", err);
  return c.text("Something went wrong", 500);
});

app.get("/", (c) => {
  // Possibly return a simple static page here
  return c.text("Hello Hono!");
});

// v1 api
app.route("/api/v1/deepidv", DeepidvService);
app.route("/api/v1/daily-diff", DailyDiffService);
app.route("/api/v1/authentication", AuthService);

export default {
  fetch: app.fetch,
  scheduled, // Cron Job Handler
};
