import * as z from "zod";

/** Schema of a repo update operation */
export const UpdateReposOperation = z.object({
  names: z.array(z.string()),
  branches: z.array(z.string()),
});

/** Body for replacing a repo's branch list (e.g. PUT) */
export const BranchesPayload = z.object({
  branches: z.array(z.string()),
});

/** Schema of a branch insert operation (append); identifies target repo */
export const BranchInsertOperation = z.object({
  repo: z.string(),
  branches: z.array(z.string()),
});
