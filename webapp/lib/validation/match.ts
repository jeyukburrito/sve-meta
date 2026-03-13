import { z } from "zod";

export const matchResultSchema = z
  .object({
    playedAt: z.string().min(1),
    myDeckId: z.string().uuid(),
    opponentDeckName: z.string().trim().min(1).max(120),
    playOrder: z.enum(["first", "second"]),
    matchFormat: z.enum(["bo1", "bo3"]),
    wins: z.coerce.number().int().min(0).max(2),
    losses: z.coerce.number().int().min(0).max(2),
    eventType: z.enum(["ranked", "shop", "friendly", "tournament"]),
    memo: z.string().max(1000).optional().or(z.literal("")),
    tagIds: z.array(z.string().uuid()).max(10).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.matchFormat === "bo1") {
      const validBo1 = (value.wins === 1 && value.losses === 0) || (value.wins === 0 && value.losses === 1);
      if (!validBo1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BO1 score must be 1:0 or 0:1.",
          path: ["wins"],
        });
      }
    }

    if (value.matchFormat === "bo3") {
      const validBo3 =
        (value.wins === 2 && (value.losses === 0 || value.losses === 1)) ||
        (value.losses === 2 && (value.wins === 0 || value.wins === 1));
      if (!validBo3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BO3 score must be 2:0, 2:1, 1:2, or 0:2.",
          path: ["wins"],
        });
      }
    }
  });

export type MatchResultInput = z.infer<typeof matchResultSchema>;
