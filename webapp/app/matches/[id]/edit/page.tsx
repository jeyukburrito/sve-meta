import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EventCategorySelect } from "@/components/event-category-select";
import { GameDeckFields } from "@/components/game-deck-fields";
import { HeaderActions } from "@/components/header-actions";
import { MatchResultInput } from "@/components/match-result-input";
import { SubmitButton } from "@/components/submit-button";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateMatchResult } from "../../actions";

export const dynamic = "force-dynamic";

type EditMatchPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditMatchPage({ params, searchParams }: EditMatchPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const errorMessage = typeof query?.error === "string" ? query.error : undefined;

  const [match, decks] = await Promise.all([
    prisma.matchResult.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        myDeck: {
          select: {
            gameId: true,
          },
        },
      },
    }),
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
  ]);

  if (!match) {
    notFound();
  }

  return (
    <AppShell title="기록 수정" headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      <div className="mb-4">
        <Link
          href="/matches"
          className="inline-flex text-sm font-medium text-muted underline-offset-4 hover:underline"
        >
          기록 목록으로 돌아가기
        </Link>
      </div>
      <form
        action={updateMatchResult}
        className="grid gap-4 rounded-3xl border border-line bg-surface p-5 shadow-sm md:grid-cols-2"
      >
        <input type="hidden" name="matchId" value={match.id} />
        <input type="hidden" name="tournamentSessionId" value={match.tournamentSessionId ?? ""} />
        <input type="hidden" name="tournamentPhase" value={match.tournamentPhase ?? ""} />
        {errorMessage ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger md:col-span-2">
            {errorMessage}
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          날짜
          <input
            name="playedAt"
            type="date"
            required
            defaultValue={match.playedAt.toISOString().slice(0, 10)}
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
          defaultGameId={match.myDeck.gameId}
          defaultDeckId={match.myDeckId}
        />
        <label className="grid gap-2 text-sm font-medium">
          상대 덱
          <input
            name="opponentDeckName"
            type="text"
            required
            defaultValue={match.opponentDeckName}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <EventCategorySelect defaultValue={match.eventCategory} />
        <MatchResultInput
          defaultFormat={match.matchFormat}
          defaultResult={match.isMatchWin ? "win" : "lose"}
        />
        <label className="grid gap-2 text-sm font-medium">
          선공 / 후공
          <select
            name="playOrder"
            defaultValue={match.playOrder}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
            required
          >
            <option value="first">선공</option>
            <option value="second">후공</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          선후공 결정여부
          <select
            name="didChoosePlayOrder"
            defaultValue={String(match.didChoosePlayOrder)}
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
            rows={4}
            defaultValue={match.memo ?? ""}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          />
        </label>
        <div className="md:col-span-2">
          <SubmitButton label="수정 저장" />
        </div>
      </form>
    </AppShell>
  );
}
