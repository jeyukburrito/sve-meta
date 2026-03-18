"use client";

import { useMemo, useState } from "react";

import type { MatchupCell } from "@/lib/dashboard";

type MatchupMatrixProps = {
  matchupCells: MatchupCell[];
};

function rateClassName(rate: number, total: number) {
  if (total < 3) return "bg-line text-muted";
  if (rate >= 70) return "bg-success/10 text-success";
  if (rate >= 50) return "bg-accent/10 text-accent";
  if (rate >= 30) return "bg-danger/10 text-danger";
  return "bg-danger/20 text-danger";
}

export function MatchupMatrix({ matchupCells }: MatchupMatrixProps) {
  const myDecks = useMemo(
    () => Array.from(new Set(matchupCells.map((cell) => cell.myDeck))),
    [matchupCells],
  );
  const opponentDecks = useMemo(
    () => Array.from(new Set(matchupCells.map((cell) => cell.opponentDeck))),
    [matchupCells],
  );
  const [selectedMyDeck, setSelectedMyDeck] = useState<string>(myDecks[0] ?? "");
  const [isTableView, setIsTableView] = useState(false);

  const rowsByMyDeck = useMemo(() => {
    const map = new Map<string, MatchupCell[]>();
    for (const cell of matchupCells) {
      const rows = map.get(cell.myDeck) ?? [];
      rows.push(cell);
      map.set(cell.myDeck, rows);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => b.rate - a.rate || b.total - a.total || a.opponentDeck.localeCompare(b.opponentDeck));
    }
    return map;
  }, [matchupCells]);

  if (matchupCells.length === 0) {
    return (
      <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold">상성 매트릭스</h2>
        <p className="mt-4 text-sm text-muted">표시할 데이터가 없습니다.</p>
      </article>
    );
  }

  const selectedRows = rowsByMyDeck.get(selectedMyDeck) ?? [];
  const matrixMap = new Map<string, MatchupCell>();
  for (const cell of matchupCells) {
    matrixMap.set(`${cell.myDeck}::${cell.opponentDeck}`, cell);
  }

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">상성 매트릭스</h2>
        <button
          type="button"
          onClick={() => setIsTableView((v) => !v)}
          className="text-xs font-medium text-accent underline underline-offset-2"
        >
          {isTableView ? "목록 보기" : "전체 보기"}
        </button>
      </div>

      {!isTableView ? (
        <div className="mt-4 space-y-4">
          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {myDecks.map((deck) => {
                const active = selectedMyDeck === deck;
                return (
                  <button
                    key={deck}
                    type="button"
                    onClick={() => setSelectedMyDeck(deck)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-accent bg-accent text-white"
                        : "border-line bg-surface text-ink"
                    }`}
                  >
                    {deck}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-line">
            {selectedRows.length === 0 ? (
              <div className="px-4 py-4 text-sm text-muted">기록 없음</div>
            ) : (
              selectedRows.map((row) => (
                <div
                  key={`${row.myDeck}:${row.opponentDeck}`}
                  className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-0"
                >
                  <span className="truncate text-sm font-medium">{row.opponentDeck}</span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rateClassName(row.rate, row.total)}`}>
                      {row.total < 3 ? "표본 부족" : `${row.rate}%`}
                    </span>
                    <span className="text-xs text-muted">
                      {row.wins}승 {row.total - row.wins}패
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-max border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-paper px-3 py-2 text-left text-xs font-medium text-muted">
                  내 덱 \ 상대 덱
                </th>
                {opponentDecks.map((opponent) => (
                  <th key={opponent} className="bg-paper px-2 py-2 text-center text-xs font-medium text-muted">
                    {opponent}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myDecks.map((myDeck) => (
                <tr key={myDeck}>
                  <th className="sticky left-0 bg-surface px-3 py-1.5 text-left text-xs font-medium text-ink">
                    {myDeck}
                  </th>
                  {opponentDecks.map((opponent) => {
                    const cell = matrixMap.get(`${myDeck}::${opponent}`);
                    if (!cell) {
                      return (
                        <td key={`${myDeck}:${opponent}`} className="min-w-[64px] px-2 py-1.5 text-center text-xs text-muted">
                          -
                        </td>
                      );
                    }

                    return (
                      <td key={`${myDeck}:${opponent}`} className="min-w-[64px] px-2 py-1.5 text-center text-xs">
                        <span className={`rounded-full px-2 py-1 font-semibold ${rateClassName(cell.rate, cell.total)}`}>
                          {cell.total < 3 ? "표본 부족" : `${cell.rate}%`}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
