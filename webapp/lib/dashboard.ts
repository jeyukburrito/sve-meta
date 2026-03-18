import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type DonutSlice = {
  name: string;
  value: number;
  wins: number;
  rate: number;
};

export type FilterOptions = {
  period: string;
  from?: string;
  to?: string;
  category?: string;
};

type AggregateRow = {
  name: string;
  total: bigint | number;
  wins: bigint | number;
};

export type MatchupCell = {
  myDeck: string;
  opponentDeck: string;
  wins: number;
  total: number;
  rate: number;
};

type MatchupRow = {
  myDeck: string;
  opponentDeck: string;
  total: bigint | number;
  wins: bigint | number;
};

function bigintToNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

function toSlices(rows: AggregateRow[]): DonutSlice[] {
  return rows.map((row) => {
    const total = bigintToNumber(row.total);
    const wins = bigintToNumber(row.wins);

    return {
      name: row.name,
      value: total,
      wins,
      rate: total === 0 ? 0 : Math.round((wins / total) * 100),
    };
  });
}

function buildPlayedAtSql(opts: FilterOptions) {
  const { period, from, to } = opts;
  const clauses: Prisma.Sql[] = [];

  if (period === "custom") {
    if (from) {
      clauses.push(Prisma.sql`m."playedAt" >= ${new Date(`${from}T00:00:00`)}`);
    }

    if (to) {
      const end = new Date(`${to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      clauses.push(Prisma.sql`m."playedAt" < ${end}`);
    }
  } else if (period === "7d" || period === "30d") {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - (period === "7d" ? 7 : 30));
    clauses.push(Prisma.sql`m."playedAt" >= ${cutoff}`);
  }

  return clauses;
}

function buildWhereSql(userId: string, opts: FilterOptions) {
  const { category } = opts;
  const clauses = [Prisma.sql`m."userId" = CAST(${userId} AS uuid)`, ...buildPlayedAtSql(opts)];

  if (category === "friendly" || category === "shop" || category === "cs") {
    clauses.push(Prisma.sql`m."eventCategory" = ${category}::"EventCategory"`);
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`;
}

export async function getDashboardData(userId: string, opts: FilterOptions) {
  const whereSql = buildWhereSql(userId, opts);

  const [totalResult, myDeckRows, opponentRows] = await Promise.all([
    prisma.$queryRaw<{ total: bigint | number }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM "match_results" m
      ${whereSql}
    `),
    prisma.$queryRaw<AggregateRow[]>(Prisma.sql`
      SELECT
        d."name" AS name,
        COUNT(*)::bigint AS total,
        SUM(CASE WHEN m."isMatchWin" THEN 1 ELSE 0 END)::bigint AS wins
      FROM "match_results" m
      INNER JOIN "decks" d ON d."id" = m."myDeckId"
      ${whereSql}
      GROUP BY d."name"
      ORDER BY total DESC, d."name" ASC
    `),
    prisma.$queryRaw<AggregateRow[]>(Prisma.sql`
      SELECT
        m."opponentDeckName" AS name,
        COUNT(*)::bigint AS total,
        SUM(CASE WHEN m."isMatchWin" THEN 1 ELSE 0 END)::bigint AS wins
      FROM "match_results" m
      ${whereSql}
      GROUP BY m."opponentDeckName"
      ORDER BY total DESC, m."opponentDeckName" ASC
    `),
  ]);

  return {
    totalMatches: totalResult[0] ? bigintToNumber(totalResult[0].total) : 0,
    myDeckSlices: toSlices(myDeckRows),
    opponentSlices: toSlices(opponentRows),
  };
}

export async function getMatchupMatrix(userId: string, opts: FilterOptions): Promise<MatchupCell[]> {
  const whereSql = buildWhereSql(userId, opts);

  const rows = await prisma.$queryRaw<MatchupRow[]>(Prisma.sql`
    SELECT
      d."name" AS "myDeck",
      m."opponentDeckName" AS "opponentDeck",
      COUNT(*)::bigint AS total,
      SUM(CASE WHEN m."isMatchWin" THEN 1 ELSE 0 END)::bigint AS wins
    FROM "match_results" m
    INNER JOIN "decks" d ON d."id" = m."myDeckId"
    ${whereSql}
    GROUP BY d."name", m."opponentDeckName"
    ORDER BY d."name" ASC, m."opponentDeckName" ASC
  `);

  return rows.map((row) => {
    const total = bigintToNumber(row.total);
    const wins = bigintToNumber(row.wins);

    return {
      myDeck: row.myDeck,
      opponentDeck: row.opponentDeck,
      wins,
      total,
      rate: total === 0 ? 0 : Math.round((wins / total) * 100),
    };
  });
}
