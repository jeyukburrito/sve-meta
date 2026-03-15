import { z } from "zod";

export const createDeckSchema = z.object({
  gameId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  color: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{6})$/, "Color must be a 6-digit hex code.")
    .optional()
    .or(z.literal("")),
  memo: z.string().trim().max(300).optional().or(z.literal("")),
});

export const toggleDeckSchema = z.object({
  deckId: z.string().uuid(),
  nextState: z.enum(["active", "inactive"]),
});
