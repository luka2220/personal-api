import * as z from "zod";

/** Schema for creating a new repo entry */
export const CreateReposOperation = z.object({
  name: z.string(),
  branches: z.array(z.string()).min(1),
});
