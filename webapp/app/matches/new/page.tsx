import { AppShell } from "@/components/app-shell";
import { EventCategorySelect } from "@/components/event-category-select";
import { GameDeckFields } from "@/components/game-deck-fields";
import { HeaderActions } from "@/components/header-actions";
import { MatchResultInput } from "@/components/match-result-input";
import { SubmitButton } from "@/components/submit-button";
import { TournamentBanner } from "@/components/tournament-banner";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createMatchResult } from "../actions";

export const dynamic = "force-dynamic";

type NewMatchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMatchPage({ searchParams }: NewMatchPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;

  // 연속 입력 모드: 이전 대회 기록 저장 후 날짜/덱/대회분류 유지
  const continueEvent = typeof params?.event === "string" ? params.event : undefined;
  const continueDate = typeof params?.date === "string" ? params.date : undefined;
  const continueDeck = typeof params?.deckId === "string" ? params.deckId : undefined;
  const continueGame = typeof params?.gameId === "string" ? params.gameId : undefined;
  const continueTournamentId =
    typeof params?.tournamentId === "string" ? params.tournamentId : undefined;
  const phase = params?.phase === "elimination" ? "elimination" : "swiss";
  const isContinue = continueEvent === "shop" || continueEvent === "cs";
  const isElimination = phase === "elimination";

  const eventLabel = continueEvent === "cs" ? "CS" : "매장대회";
  const phaseLabel = isElimination ? "본선" : "예선";

  const today = continueDate ?? new Date().toISOString().slice(0, 10);
  const [decks, continuedTournament, phaseCount] = await Promise.all([
    prisma.deck.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        game: {
          select: {
            name: true,
          },
        },
      },
    }),
    continueTournamentId
      ? prisma.tournamentSession.findFirst({
          where: {
            id: continueTournamentId,
            userId: user.id,
          },
          select: {
            id: true,
            endedAt: true,
          },
        })
      : Promise.resolve(null),
    continueTournamentId
      ? prisma.matchResult.count({
          where: {
            userId: user.id,
            tournamentSessionId: continueTournamentId,
            tournamentPhase: phase,
          },
        })
      : Promise.resolve(0),
  ]);
  const isActiveTournament = Boolean(continuedTournament && !continuedTournament.endedAt);
  const isEndedTournament = Boolean(continuedTournament?.endedAt);
  const hasInvalidTournamentContinuation = Boolean(continueTournamentId && !continuedTournament);
  const activeTournamentId =
    continuedTournament && !continuedTournament.endedAt ? continuedTournament.id : null;
  const roundNumber = isActiveTournament ? phaseCount + 1 : undefined;

  // 토너먼트 진행 링크 생성 (예선→본선 전환)
  const eliminationUrl = isContinue && isActiveTournament
    ? `/matches/new?${new URLSearchParams({
        event: continueEvent!,
        date: continueDate ?? today,
        gameId: continueGame ?? "",
        deckId: continueDeck ?? "",
        phase: "elimination",
        tournamentId: continueTournamentId ?? "",
      }).toString()}`
    : null;
  const submitDisabled = decks.length === 0 || isEndedTournament || hasInvalidTournamentContinuation;
  const submitLabel =
    isContinue && roundNumber
      ? `${phaseLabel} R${roundNumber} 저장`
      : isEndedTournament || hasInvalidTournamentContinuation
        ? "대회 종료됨"
        : "결과 저장";

  return (
    <AppShell title="결과 입력" headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      {isContinue && activeTournamentId && roundNumber ? (
        <TournamentBanner
          eventLabel={eventLabel}
          phaseLabel={phaseLabel}
          roundNumber={roundNumber}
          isElimination={isElimination}
          tournamentSessionId={activeTournamentId}
          eliminationUrl={eliminationUrl}
        />
      ) : null}
      {isContinue && (isEndedTournament || hasInvalidTournamentContinuation) ? (
        <div className="mb-4 rounded-2xl border border-line bg-line/20 px-4 py-3 text-sm text-muted">
          <p className="font-medium text-muted">대회 종료</p>
          <p className="mt-1">
            {isEndedTournament
              ? "종료된 대회입니다. 기존 경기 기록은 수정할 수 있지만 새 라운드는 추가할 수 없습니다."
              : "이어지는 대회 세션을 찾을 수 없습니다. 기록 목록에서 기존 대회를 확인해 주세요."}
          </p>
        </div>
      ) : null}
      <form
        action={createMatchResult}
        className="grid gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm md:grid-cols-2"
      >
        {errorMessage ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger md:col-span-2">
            {errorMessage}
          </div>
        ) : null}
        {isContinue && continueTournamentId ? (
          <>
            <input type="hidden" name="tournamentPhase" value={phase} />
            <input type="hidden" name="tournamentSessionId" value={continueTournamentId} />
          </>
        ) : null}
        <EventCategorySelect defaultValue={continueEvent ?? "friendly"} />
        <label className="grid gap-2 text-sm font-medium">
          날짜
          <input
            name="playedAt"
            type="date"
            required
            defaultValue={today}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <GameDeckFields
          decks={decks.map((deck) => ({
            id: deck.id,
            name: deck.name,
            gameId: deck.gameId,
            gameName: deck.game.name,
          }))}
          defaultGameId={continueGame}
          defaultDeckId={continueDeck}
        />
        <label className="grid gap-2 text-sm font-medium">
          상대 덱
          <input
            name="opponentDeckName"
            type="text"
            required
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <MatchResultInput />
        <label className="grid gap-2 text-sm font-medium">
          선공 / 후공
          <select name="playOrder" className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink" required>
            <option value="first">선공</option>
            <option value="second">후공</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          선후공 결정여부
          <select
            name="didChoosePlayOrder"
            defaultValue="false"
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
            required
          >
            <option value="true">O</option>
            <option value="false">X</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          메모
          <textarea
            name="memo"
            rows={2}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <div className="md:col-span-2">
          {decks.length === 0 ? (
            <p className="mb-3 text-sm text-danger">
              먼저 설정에서 카드게임과 내 덱을 1개 이상 등록해야 결과를 기록할 수 있습니다.
            </p>
          ) : null}
          <SubmitButton
            label={submitLabel}
            disabled={submitDisabled}
          />
        </div>
      </form>
    </AppShell>
  );
}
