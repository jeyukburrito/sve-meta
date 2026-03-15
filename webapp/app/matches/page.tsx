import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/format-date";
import { listMatchesForUser, parseMatchFilters } from "@/lib/matches";
import { prisma } from "@/lib/prisma";
import { deleteMatchResult } from "./actions";

export const dynamic = "force-dynamic";

type MatchesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const filters = parseMatchFilters(params);
  const opponentQuery = filters.opponent;
  const gameIdQuery = filters.gameId;
  const deckIdQuery = filters.deckId;
  const formatQuery = filters.format;

  const [games, decks, rows] = await Promise.all([
    prisma.game.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.deck.findMany({
      where: {
        userId: user.id,
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
    listMatchesForUser(user.id, filters),
  ]);

  return (
    <AppShell title="기록 목록" headerRight={<ProfileAvatar avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-4">
          <input
            name="opponent"
            defaultValue={opponentQuery}
            className="rounded-2xl border border-line px-4 py-3"
            placeholder="상대 덱 검색"
          />
          <AutoSubmitSelect
            name="gameId"
            defaultValue={gameIdQuery}
            className="rounded-2xl border border-line px-4 py-3"
          >
            <option value="">카드게임 전체</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect
            name="deckId"
            defaultValue={deckIdQuery}
            className="rounded-2xl border border-line px-4 py-3"
          >
            <option value="">내 덱 전체</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.game.name} · {deck.name}
              </option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSelect
            name="format"
            defaultValue={formatQuery}
            className="rounded-2xl border border-line px-4 py-3"
          >
            <option value="">형식 전체</option>
            <option value="bo1">BO1</option>
            <option value="bo3">BO3</option>
          </AutoSubmitSelect>
        </form>
      </section>

      <section className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-neutral-500 shadow-sm">
            아직 저장된 대전 기록이 없습니다.
          </article>
        ) : null}
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-3xl border border-line bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">
                  {formatRelativeDate(row.playedAt)}
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {row.myDeck.name} vs {row.opponentDeckName}
                </h2>
                <p className="mt-2 text-sm font-medium text-neutral-500">{row.myDeck.game.name}</p>
                <p className="mt-2 text-sm text-neutral-600">
                  {row.matchFormat.toUpperCase()} · {row.isMatchWin ? "승" : "패"} ·{" "}
                  {row.playOrder === "first" ? "선공" : "후공"} · 선후공 결정{" "}
                  {row.didChoosePlayOrder ? "O" : "X"}
                </p>
                {row.memo ? <p className="mt-2 text-sm text-neutral-500">{row.memo}</p> : null}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  row.isMatchWin
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {row.isMatchWin ? "승" : "패"}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/matches/${row.id}/edit`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium"
              >
                수정
              </Link>
              <form action={deleteMatchResult}>
                <input type="hidden" name="matchId" value={row.id} />
                <DeleteMatchButton />
              </form>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
