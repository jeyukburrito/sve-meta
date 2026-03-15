import { z } from "zod";

export const matchResultSchema = z
  .object({
    playedAt: z.string().min(1),
    gameId: z.string().uuid(),
    myDeckId: z.string().uuid(),
    tournamentSessionId: z.string().uuid().optional(),
    opponentDeckName: z.string().trim().min(1).max(120),
    eventCategory: z.enum(["friendly", "shop", "cs"]),
    tournamentPhase: z.enum(["swiss", "elimination"]).optional(),
    playOrder: z.enum(["first", "second"]),
    didChoosePlayOrder: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),
    matchFormat: z.enum(["bo1", "bo3"]),
    result: z.enum(["win", "lose"]),
    memo: z.string().max(1000).optional().or(z.literal("")),
    tagIds: z.array(z.string().uuid()).max(10).default([]),
  });

export type MatchResultInput = z.infer<typeof matchResultSchema>;
