import * as z from 'zod';
import { Hono } from 'hono';

/** Schema of a repo update operation */
export const UpdateReposOperation = z.object({
  names: z.array(z.string()),
});
