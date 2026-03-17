import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MatchFilters = {
  opponent: string;
  gameId: string;
  deckId: string;
  format: string;
  event: string;
};

export const MATCHES_PAGE_SIZE = 30;

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
    event: read("event"),
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
    ...(filters.event === "friendly" || filters.event === "shop" || filters.event === "cs"
      ? { eventCategory: filters.event }
      : {}),
  };
}

export async function listMatchesForUser(userId: string, filters: MatchFilters, page?: number) {
  const safePage =
    page !== undefined && Number.isFinite(page) && page > 0 ? Math.floor(page) : undefined;

  return prisma.matchResult.findMany({
    where: buildMatchWhere(userId, filters),
    orderBy: [
      { playedAt: "desc" },
      { createdAt: "desc" },
    ],
    ...(safePage
      ? {
          skip: (safePage - 1) * MATCHES_PAGE_SIZE,
          take: MATCHES_PAGE_SIZE,
        }
      : {}),
    include: {
      myDeck: {
        select: {
          id: true,
          name: true,
          gameId: true,
          game: {
            select: {
              name: true,
            },
          },
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      tournamentSession: {
        select: {
          id: true,
          endedAt: true,
        },
      },
    },
  });
}

export async function countMatchesForUser(userId: string, filters: MatchFilters) {
  return prisma.matchResult.count({
    where: buildMatchWhere(userId, filters),
  });
}

export async function listMatchFilterOptions(userId: string) {
  const [games, decks] = await Promise.all([
    prisma.game.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.deck.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        game: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return { games, decks };
}
