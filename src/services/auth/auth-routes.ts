import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { sign } from "hono/jwt";

import { LoginAuthorizeSchema } from "./auth-schemas";

const TOKEN_TTL_SEC = 60 * 60 * 24;

export const AuthService = new Hono<{ Bindings: Env }>();

AuthService.onError((err, c) => {
  console.error("An error occurred in the auth service: ", err);
  return c.json({ message: "Something went wrong" }, 500);
});

AuthService.post(
  "/login",
  zValidator("json", LoginAuthorizeSchema),
  async (c) => {
    const data = c.req.valid("json");

    console.info("RequestReached");
    console.dir(data);

    if (
      data.email !== c.env.VALID_EMAIL ||
      data.password !== c.env.VALID_PASSWORD
    ) {
      return c.newResponse("Invalid Login", 401);
    }

    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC;
    const token = await sign(
      { sub: data.email, exp },
      c.env.JWT_SECRET,
      "HS256",
    );
    return c.json({ token });
  },
);
