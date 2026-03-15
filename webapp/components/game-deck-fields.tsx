"use client";

import { useEffect, useMemo, useState } from "react";

type GameDeckOption = {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
};

type GameDeckFieldsProps = {
  decks: GameDeckOption[];
  defaultGameId?: string;
  defaultDeckId?: string;
};

export function GameDeckFields({
  decks,
  defaultGameId,
  defaultDeckId,
}: GameDeckFieldsProps) {
  const availableGames = useMemo(() => {
    const gameMap = new Map<string, string>();

    decks.forEach((deck) => {
      gameMap.set(deck.gameId, deck.gameName);
    });

    return Array.from(gameMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [decks]);

  const fallbackGameId = defaultGameId ?? decks[0]?.gameId ?? "";
  const [selectedGameId, setSelectedGameId] = useState(fallbackGameId);

  const filteredDecks = useMemo(
    () => decks.filter((deck) => deck.gameId === selectedGameId),
    [decks, selectedGameId],
  );

  const fallbackDeckId =
    defaultDeckId && decks.some((deck) => deck.id === defaultDeckId)
      ? defaultDeckId
      : filteredDecks[0]?.id ?? "";
  const [selectedDeckId, setSelectedDeckId] = useState(fallbackDeckId);

  useEffect(() => {
    if (!filteredDecks.some((deck) => deck.id === selectedDeckId)) {
      setSelectedDeckId(filteredDecks[0]?.id ?? "");
    }
  }, [filteredDecks, selectedDeckId]);

  return (
    <>
      <label className="grid gap-2 text-sm font-medium">
        카드 게임
        <select
          name="gameId"
          value={selectedGameId}
          onChange={(event) => setSelectedGameId(event.target.value)}
          className="rounded-2xl border border-line px-4 py-3"
          required
        >
          <option value="">카드 게임을 선택하세요</option>
          {availableGames.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        내 덱
        <select
          name="myDeckId"
          value={selectedDeckId}
          onChange={(event) => setSelectedDeckId(event.target.value)}
          className="rounded-2xl border border-line px-4 py-3"
          required
          disabled={!selectedGameId}
        >
          <option value="">덱을 선택하세요</option>
          {filteredDecks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
