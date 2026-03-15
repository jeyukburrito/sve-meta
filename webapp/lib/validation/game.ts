import { z } from "zod";

export const createGameSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const updateGameSchema = z.object({
  gameId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
});

export const deleteGameSchema = z.object({
  gameId: z.string().uuid(),
});
