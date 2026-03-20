"use client";

import { useEffect, useMemo, useState } from "react";

import { SelectSheetField } from "@/components/select-sheet-field";

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
      <SelectSheetField
        name="gameId"
        label="Game"
        value={selectedGameId}
        placeholder="카드 게임을 선택해 주세요."
        options={availableGames.map((game) => ({
          value: game.id,
          label: game.name,
        }))}
        onChange={setSelectedGameId}
      />
      <SelectSheetField
        name="myDeckId"
        label="Deck"
        value={selectedDeckId}
        placeholder={selectedGameId ? "덱을 선택해 주세요." : "먼저 게임을 선택해 주세요."}
        options={filteredDecks.map((deck) => ({
          value: deck.id,
          label: deck.name,
          description: deck.gameName,
        }))}
        onChange={setSelectedDeckId}
        disabled={!selectedGameId}
      />
    </>
  );
}
