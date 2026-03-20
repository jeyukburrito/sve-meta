import { AppShell } from "@/components/app-shell";
import { EventCategorySelect } from "@/components/event-category-select";
import { GameDeckFields } from "@/components/game-deck-fields";
import { HeaderActions } from "@/components/header-actions";
import { MatchDetailControls } from "@/components/match-detail-controls";
import { MatchResultInput } from "@/components/match-result-input";
import { SubmitButton } from "@/components/submit-button";
import { TagSelector } from "@/components/tag-selector";
import { TournamentBanner } from "@/components/tournament-banner";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createMatchResult } from "../actions";

type NewMatchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMatchPage({ searchParams }: NewMatchPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;

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

  const [decks, tags, continuedTournament, phaseCount] = await Promise.all([
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
    prisma.tag.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
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
  const eliminationUrl =
    isContinue && isActiveTournament
      ? `/matches/new?${new URLSearchParams({
          event: continueEvent!,
          date: continueDate ?? today,
          gameId: continueGame ?? "",
          deckId: continueDeck ?? "",
          phase: "elimination",
          tournamentId: continueTournamentId ?? "",
        }).toString()}`
      : null;
  const submitDisabled =
    decks.length === 0 || isEndedTournament || hasInvalidTournamentContinuation;
  const submitLabel =
    isContinue && roundNumber
      ? `${phaseLabel} R${roundNumber} 기록 저장`
      : isEndedTournament || hasInvalidTournamentContinuation
        ? "대회 종료"
        : "경기 저장";

  return (
    <AppShell
      title="경기 입력"
      headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}
    >
      <div className="mx-auto flex max-w-md flex-col gap-4 pb-28">
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
          <div className="rounded-3xl bg-surface-container-low p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-danger">
              Tournament Notice
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">대회 입력을 계속할 수 없습니다</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {isEndedTournament
                ? "종료된 대회입니다. 기존 경기 기록은 수정할 수 있지만, 새로운 라운드는 추가할 수 없습니다."
                : "이어진 대회 세션을 찾을 수 없습니다. 기록 목록에서 현재 상태를 다시 확인해주세요."}
            </p>
          </div>
        ) : null}

        <form action={createMatchResult} className="space-y-4">
          {isContinue && continueTournamentId ? (
            <>
              <input type="hidden" name="tournamentPhase" value={phase} />
              <input type="hidden" name="tournamentSessionId" value={continueTournamentId} />
            </>
          ) : null}

          <section className="grid gap-3 rounded-3xl bg-surface-container-low p-4 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                  New Record
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">경기 입력</h2>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
                Tactical
              </span>
            </div>

            <div className="grid gap-3 rounded-2xl bg-paper p-3">
              <EventCategorySelect defaultValue={continueEvent ?? "friendly"} />
              <label className="grid gap-2 text-sm font-semibold">
                날짜
                <input
                  name="playedAt"
                  type="date"
                  required
                  defaultValue={today}
                  className="rounded-2xl bg-surface px-4 py-3 text-ink shadow-sm"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-3 rounded-3xl bg-surface-container-low p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">
              Match Setup
            </p>
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
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-semibold">
                상대 덱명
                <input
                  name="opponentDeckName"
                  type="text"
                  required
                  className="rounded-2xl bg-surface px-4 py-3 text-ink shadow-sm"
                />
              </label>
            </div>
          </section>

          <MatchResultInput />
          <MatchDetailControls />

          <section className="grid gap-3 rounded-3xl bg-surface-container-low p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Notes</p>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                Optional
              </span>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              메모
              <textarea
                name="memo"
                rows={3}
                className="min-h-28 rounded-2xl bg-surface px-4 py-3 text-ink shadow-sm"
              />
            </label>
            <TagSelector tags={tags} />
          </section>

          {errorMessage ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}

          {decks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-paper p-4 text-sm text-danger">
              먼저 설정에서 덱과 게임을 1개 이상 등록해야 경기를 기록할 수 있습니다.
            </p>
          ) : null}

          <div className="fixed inset-x-0 bottom-24 z-40 bg-surface/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg">
            <div className="mx-auto max-w-md">
              <SubmitButton label={submitLabel} disabled={submitDisabled} />
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
