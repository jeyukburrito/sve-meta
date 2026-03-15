import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { HeaderActions } from "@/components/header-actions";
import { TournamentTimeline } from "@/components/tournament-timeline";
import { groupMatchesForDisplay } from "@/lib/group-matches";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/format-date";
import {
  MATCHES_PAGE_SIZE,
  countMatchesForUser,
  listMatchFilterOptions,
  listMatchesForUser,
  parseMatchFilters,
} from "@/lib/matches";
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
  const eventQuery = filters.event;
  const pageQuery = typeof params?.page === "string" ? Number(params.page) : 1;
  const currentPage = Number.isFinite(pageQuery) && pageQuery > 0 ? Math.floor(pageQuery) : 1;

  const [filterOptions, totalCount, rows] = await Promise.all([
    listMatchFilterOptions(user.id),
    countMatchesForUser(user.id, filters),
    listMatchesForUser(user.id, filters, currentPage),
  ]);
  const { games, decks } = filterOptions;
  const totalPages = Math.max(1, Math.ceil(totalCount / MATCHES_PAGE_SIZE));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const buildPageHref = (page: number) => {
    const query = new URLSearchParams();

    if (opponentQuery) query.set("opponent", opponentQuery);
    if (gameIdQuery) query.set("gameId", gameIdQuery);
    if (deckIdQuery) query.set("deckId", deckIdQuery);
    if (formatQuery) query.set("format", formatQuery);
    if (eventQuery) query.set("event", eventQuery);
    if (page > 1) query.set("page", String(page));

    return `/matches${query.toString() ? `?${query.toString()}` : ""}`;
  };

  const displayItems = groupMatchesForDisplay(rows);

  return (
    <AppShell title="기록 목록" headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5">
          <input
            name="opponent"
            defaultValue={opponentQuery}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
            placeholder="상대 덱 검색"
          />
          <AutoSubmitSelect
            name="gameId"
            defaultValue={gameIdQuery}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
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
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
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
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          >
            <option value="">형식 전체</option>
            <option value="bo1">BO1</option>
            <option value="bo3">BO3</option>
          </AutoSubmitSelect>
          <AutoSubmitSelect
            name="event"
            defaultValue={eventQuery}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
          >
            <option value="">분류 전체</option>
            <option value="friendly">친선전</option>
            <option value="shop">매장대회</option>
            <option value="cs">CS</option>
          </AutoSubmitSelect>
        </form>
      </section>

      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted">
          <p>총 {totalCount}건</p>
          <p>
            {currentPage} / {totalPages} 페이지
          </p>
        </div>
        {displayItems.length === 0 ? (
          <article className="rounded-3xl border border-dashed border-line bg-surface p-6 text-sm text-muted shadow-sm">
            아직 저장된 대전 기록이 없습니다.
          </article>
        ) : null}
        {displayItems.map((item) =>
          item.type === "tournament" ? (
            <TournamentTimeline
              key={item.group.key}
              group={item.group}
              deleteAction={deleteMatchResult}
            />
          ) : (
            <article
              key={item.match.id}
              className="rounded-3xl border border-line bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">
                    {formatRelativeDate(item.match.playedAt)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {item.match.myDeck.name} vs {item.match.opponentDeckName}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-muted">{item.match.myDeck.game.name}</p>
                  <p className="mt-2 text-sm text-muted">
                    {item.match.matchFormat.toUpperCase()} · {item.match.isMatchWin ? "승" : "패"} ·{" "}
                    {item.match.playOrder === "first" ? "선공" : "후공"} · 선후공 결정{" "}
                    {item.match.didChoosePlayOrder ? "O" : "X"}
                  </p>
                  {item.match.memo ? <p className="mt-2 text-sm text-muted">{item.match.memo}</p> : null}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    item.match.isMatchWin
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {item.match.isMatchWin ? "승" : "패"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/matches/${item.match.id}/edit`}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium"
                >
                  수정
                </Link>
                <form action={deleteMatchResult}>
                  <input type="hidden" name="matchId" value={item.match.id} />
                  <DeleteMatchButton />
                </form>
              </div>
            </article>
          ),
        )}
        {totalCount > MATCHES_PAGE_SIZE ? (
          <div className="flex items-center justify-between rounded-3xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-sm text-muted">한 번에 {MATCHES_PAGE_SIZE}건씩 표시합니다.</div>
            <div className="flex gap-2">
              {prevPage ? (
                <Link
                  href={buildPageHref(prevPage)}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium"
                >
                  이전
                </Link>
              ) : (
                <span className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted">
                  이전
                </span>
              )}
              {nextPage ? (
                <Link
                  href={buildPageHref(nextPage)}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium"
                >
                  다음
                </Link>
              ) : (
                <span className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted">
                  다음
                </span>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
