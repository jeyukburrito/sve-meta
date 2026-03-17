import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(30),
});

export const deleteTagSchema = z.object({
  tagId: z.string().uuid(),
});
