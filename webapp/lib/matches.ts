import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MatchFilters = {
  opponent: string;
  gameId: string;
  deckId: string;
  format: string;
};

export function parseMatchFilters(searchParams?: URLSearchParams | Record<string, string | string[] | undefined>): MatchFilters {
  const read = (key: string) => {
    if (!searchParams) {
      return "";
    }

    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key)?.trim() ?? "";
    }

    const value = searchParams[key];
    return typeof value === "string" ? value.trim() : "";
  };

  return {
    opponent: read("opponent"),
    gameId: read("gameId"),
    deckId: read("deckId"),
    format: read("format"),
  };
}

export function buildMatchWhere(userId: string, filters: MatchFilters): Prisma.MatchResultWhereInput {
  return {
    userId,
    ...(filters.gameId ? { myDeck: { gameId: filters.gameId } } : {}),
    ...(filters.opponent
      ? {
          opponentDeckName: {
            contains: filters.opponent,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(filters.deckId ? { myDeckId: filters.deckId } : {}),
    ...(filters.format === "bo1" || filters.format === "bo3" ? { matchFormat: filters.format } : {}),
  };
}

export async function listMatchesForUser(userId: string, filters: MatchFilters) {
  return prisma.matchResult.findMany({
    where: buildMatchWhere(userId, filters),
    orderBy: {
      playedAt: "desc",
    },
    include: {
      myDeck: {
        select: {
          name: true,
          game: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}
