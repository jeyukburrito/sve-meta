type MatchRow = {
  id: string;
  playedAt: Date;
  opponentDeckName: string;
  eventCategory: string;
  tournamentPhase: string | null;
  matchFormat: string;
  isMatchWin: boolean;
  playOrder: string;
  didChoosePlayOrder: boolean;
  memo: string | null;
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
    const key = `${dateStr}_${match.eventCategory}_${match.myDeck.name}`;

    if (!tournamentMap.has(key)) {
      tournamentMap.set(key, {
        key,
        date: match.playedAt,
        eventCategory: match.eventCategory,
        deckName: match.myDeck.name,
        gameName: match.myDeck.game.name,
        firstDeckId: match.myDeck.id,
        firstGameId: match.myDeck.gameId,
        matches: [],
        hasSwiss: false,
        hasElimination: false,
      });
    }

    const group = tournamentMap.get(key)!;
    group.matches.push(match);

    if (match.tournamentPhase === "elimination") {
      group.hasElimination = true;
    } else {
      group.hasSwiss = true;
    }
  }

  // 대회 그룹 내 매치를 생성순 정렬 (라운드 순)
  for (const group of tournamentMap.values()) {
    group.matches.sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime() || a.id.localeCompare(b.id));
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
