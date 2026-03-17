type MatchRow = {
  id: string;
  playedAt: Date;
  createdAt: Date;
  opponentDeckName: string;
  eventCategory: string;
  tournamentPhase: string | null;
  tournamentSessionId: string | null;
  matchFormat: string;
  isMatchWin: boolean;
  playOrder: string;
  didChoosePlayOrder: boolean;
  memo: string | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  tournamentSession: {
    id: string;
    endedAt: Date | null;
  } | null;
  myDeckId: string;
  myDeck: {
    id: string;
    name: string;
    gameId: string;
    game: { name: string };
  };
};

export type TournamentGroup = {
  key: string;
  date: Date;
  eventCategory: string;
  deckName: string;
  gameName: string;
  firstDeckId: string;
  firstGameId: string;
  tournamentSessionId: string | null;
  endedAt: Date | null;
  matches: MatchRow[];
  hasSwiss: boolean;
  hasElimination: boolean;
};

export type DisplayItem =
  | { type: "tournament"; group: TournamentGroup; sortDate: Date }
  | { type: "single"; match: MatchRow; sortDate: Date };

export function groupMatchesForDisplay(matches: MatchRow[]): DisplayItem[] {
  const tournamentMap = new Map<string, TournamentGroup>();
  const singles: MatchRow[] = [];

  for (const match of matches) {
    if (match.eventCategory === "friendly") {
      singles.push(match);
      continue;
    }

    const dateStr = match.playedAt.toISOString().slice(0, 10);
    const key =
      match.tournamentSessionId ?? `${dateStr}_${match.eventCategory}_${match.myDeck.name}`;

    if (!tournamentMap.has(key)) {
      tournamentMap.set(key, {
        key,
        date: match.playedAt,
        eventCategory: match.eventCategory,
        deckName: match.myDeck.name,
        gameName: match.myDeck.game.name,
        firstDeckId: match.myDeck.id,
        firstGameId: match.myDeck.gameId,
        tournamentSessionId: match.tournamentSessionId,
        endedAt: match.tournamentSession?.endedAt ?? null,
        matches: [],
        hasSwiss: false,
        hasElimination: false,
      });
    }

    const group = tournamentMap.get(key)!;
    group.matches.push(match);
    group.endedAt = group.endedAt ?? match.tournamentSession?.endedAt ?? null;

    if (match.tournamentPhase === "elimination") {
      group.hasElimination = true;
    } else {
      group.hasSwiss = true;
    }
  }

  for (const group of tournamentMap.values()) {
    group.matches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const items: DisplayItem[] = [];

  for (const group of tournamentMap.values()) {
    items.push({ type: "tournament", group, sortDate: group.date });
  }

  for (const match of singles) {
    items.push({ type: "single", match, sortDate: match.playedAt });
  }

  items.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  return items;
}
