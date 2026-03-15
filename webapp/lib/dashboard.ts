import type { MatchResult } from "@prisma/client";

type DashboardRow = Pick<
  MatchResult,
  "playedAt" | "opponentDeckName" | "isMatchWin" | "myDeckId"
> & {
  myDeck: {
    name: string;
    game: {
      name: string;
    };
  };
};

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
};

export function filterByPeriod(rows: DashboardRow[], opts: FilterOptions): DashboardRow[] {
  const { period, from, to } = opts;

  if (period === "all") return rows;

  if (period === "custom") {
    return rows.filter((row) => {
      if (from && row.playedAt < new Date(from + "T00:00:00")) return false;
      if (to) {
        const end = new Date(to + "T00:00:00");
        end.setDate(end.getDate() + 1);
        if (row.playedAt >= end) return false;
      }
      return true;
    });
  }

  const now = new Date();
  const cutoff = new Date(now);
  if (period === "7d") {
    cutoff.setDate(now.getDate() - 7);
  } else {
    cutoff.setDate(now.getDate() - 30);
  }

  return rows.filter((row) => row.playedAt >= cutoff);
}

export function buildDonutData(rows: DashboardRow[]) {
  const deckMap = new Map<string, { total: number; wins: number }>();
  const opponentMap = new Map<string, { total: number; wins: number }>();

  for (const row of rows) {
    const deckName = row.myDeck.name;
    const d = deckMap.get(deckName) ?? { total: 0, wins: 0 };
    d.total += 1;
    d.wins += row.isMatchWin ? 1 : 0;
    deckMap.set(deckName, d);

    const o = opponentMap.get(row.opponentDeckName) ?? { total: 0, wins: 0 };
    o.total += 1;
    o.wins += row.isMatchWin ? 1 : 0;
    opponentMap.set(row.opponentDeckName, o);
  }

  const toSlices = (map: Map<string, { total: number; wins: number }>): DonutSlice[] =>
    [...map.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, s]) => ({
        name,
        value: s.total,
        wins: s.wins,
        rate: s.total === 0 ? 0 : Math.round((s.wins / s.total) * 100),
      }));

  return {
    myDeckSlices: toSlices(deckMap),
    opponentSlices: toSlices(opponentMap),
    totalMatches: rows.length,
  };
}
