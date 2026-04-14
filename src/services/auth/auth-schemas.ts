import * as z from "zod";

/** Authentication schema for authorizing login */
export const LoginAuthorizeSchema = z.object({
  email: z.email().min(8),
  password: z.string().min(8),
});
