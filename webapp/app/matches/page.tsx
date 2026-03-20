import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { HeaderActions } from "@/components/header-actions";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/format-date";
import { groupMatchesForDisplay, type DisplayItem } from "@/lib/group-matches";
import {
  MATCHES_PAGE_SIZE,
  countMatchesForUser,
  listMatchFilterOptions,
  listMatchesForUser,
  parseMatchFilters,
} from "@/lib/matches";

import { deleteMatchResult } from "./actions";

type MatchesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ChipProps = {
  href: string;
  label: string;
  active?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function chipClassName(active?: boolean) {
  return active
    ? "bg-accent text-white shadow-[0_10px_20px_-8px_rgba(79,70,229,0.45)]"
    : "bg-paper text-muted hover:bg-line/60";
}

function FilterRail({ title, chips }: { title: string; chips: ChipProps[] }) {
  return (
    <section className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">{title}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <Link
            key={`${title}:${chip.href}:${chip.label}`}
            href={chip.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${chipClassName(chip.active)}`}
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function buildMatchHref(
  current: {
    gameId: string | null;
    deckId: string | null;
    format: string | null;
    event: string | null;
  },
  next: Partial<{ gameId: string | null; deckId: string | null; format: string | null; event: string | null; page: number }>,
) {
  const params = new URLSearchParams();
  const gameId = next.gameId ?? current.gameId;
  const deckId = next.deckId ?? current.deckId;
  const format = next.format ?? current.format;
  const event = next.event ?? current.event;
  const page = next.page ?? 1;

  if (gameId) params.set("gameId", gameId);
  if (deckId) params.set("deckId", deckId);
  if (format) params.set("format", format);
  if (event) params.set("event", event);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return `/matches${query ? `?${query}` : ""}`;
}

function MatchStatusPill({ isWin }: { isWin: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        isWin ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
      }`}
    >
      {isWin ? "승리" : "패배"}
    </span>
  );
}

function SingleMatchCard({
  match,
  deleteAction,
}: {
  match: Extract<DisplayItem, { type: "single" }>["match"];
  deleteAction: (formData: FormData) => void;
}) {
  return (
    <article className="rounded-[32px] bg-surface-container-low p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent">
              {match.eventCategory === "friendly"
                ? "친선"
                : match.eventCategory === "shop"
                  ? "매장대회"
                  : "CS"}
            </span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-muted">
              {formatRelativeDate(match.playedAt)}
            </span>
            <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-semibold text-muted">
              {match.matchFormat.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {match.myDeck.name} vs {match.opponentDeckName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {match.myDeck.game.name} · {match.playOrder === "first" ? "선공" : "후공"}
              {match.memo ? ` · ${match.memo}` : ""}
            </p>
          </div>
        </div>
        <MatchStatusPill isWin={match.isMatchWin} />
      </div>

      {match.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {match.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-muted"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-2">
        <Link
          href={`/matches/${match.id}/edit`}
          className="inline-flex rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink"
        >
          수정
        </Link>
        <form action={deleteAction}>
          <input type="hidden" name="matchId" value={match.id} />
          <DeleteMatchButton />
        </form>
      </div>
    </article>
  );
}

function TournamentMatchCard({
  group,
  deleteAction,
}: {
  group: Extract<DisplayItem, { type: "tournament" }>["group"];
  deleteAction: (formData: FormData) => void;
}) {
  const wins = group.matches.filter((match) => match.isMatchWin).length;
  const losses = group.matches.length - wins;
  const isEnded = Boolean(group.endedAt);
  const showPhaseLabels = group.hasSwiss && group.hasElimination;
  const nextSwissRound = group.matches.filter((match) => match.tournamentPhase !== "elimination").length + 1;
  const nextEliminationRound =
    group.matches.filter((match) => match.tournamentPhase === "elimination").length + 1;
  const nextHref = group.tournamentSessionId
    ? `/matches/new?${new URLSearchParams({
        event: group.eventCategory,
        date: group.date.toISOString().slice(0, 10),
        deckId: group.firstDeckId,
        gameId: group.firstGameId,
        phase: group.hasElimination ? "elimination" : "swiss",
        tournamentId: group.tournamentSessionId,
      }).toString()}`
    : null;

  let swissIndex = 0;
  let eliminationIndex = 0;

  return (
    <article
      className={`rounded-[32px] p-5 shadow-sm ${
        isEnded ? "bg-surface-container p-5" : "bg-surface-container-low p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent">
              {group.eventCategory === "shop" ? "매장대회" : "CS"}
            </span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-muted">
              {formatRelativeDate(group.date)}
            </span>
            {isEnded ? (
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
                종료
              </span>
            ) : (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                진행 중
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">{group.deckName}</h2>
            <p className="mt-1 text-sm text-muted">{group.gameName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight text-ink">
            <span className="text-success">{wins}</span>
            <span className="mx-1 text-muted">-</span>
            <span className="text-danger">{losses}</span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            {group.matches.length} rounds
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {group.matches.map((match, index) => {
          const isElimination = match.tournamentPhase === "elimination";
          const phaseChanged = index > 0 && group.matches[index - 1].tournamentPhase !== match.tournamentPhase;
          const roundLabel = isElimination ? `T${++eliminationIndex}` : `R${++swissIndex}`;

          return (
            <div
              key={match.id}
              className={`rounded-[24px] px-4 py-4 ${
                match.isMatchWin ? "bg-success/5" : "bg-paper"
              }`}
            >
              {showPhaseLabels && (index === 0 || phaseChanged) ? (
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-line/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                    {isElimination ? "토너먼트" : "스위스"}
                  </span>
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">{roundLabel}</p>
                  <h3 className="mt-1 truncate text-base font-semibold text-ink">
                    vs {match.opponentDeckName}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {match.matchFormat.toUpperCase()} · {match.playOrder === "first" ? "선공" : "후공"}
                    {match.memo ? ` · ${match.memo}` : ""}
                  </p>
                </div>
                <MatchStatusPill isWin={match.isMatchWin} />
              </div>

              {match.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-2">
                <Link
                  href={`/matches/${match.id}/edit`}
                  className="inline-flex rounded-full bg-surface px-3 py-2 text-sm font-semibold text-ink"
                >
                  수정
                </Link>
                <form action={deleteAction}>
                  <input type="hidden" name="matchId" value={match.id} />
                  <DeleteMatchButton />
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {!isEnded && nextHref ? (
        <div className="mt-4">
          <Link
            href={nextHref}
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            {group.hasElimination ? `토너먼트 R${nextEliminationRound} 추가` : `스위스 R${nextSwissRound} 추가`}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const filters = parseMatchFilters(params);
  const gameIdQuery = filters.gameId;
  const deckIdQuery = filters.deckId;
  const formatQuery = filters.format;
  const eventQuery = filters.event;
  const pageQuery = typeof params?.page === "string" ? Number(params.page) : 1;
  const currentPage = Number.isFinite(pageQuery) && pageQuery > 0 ? Math.floor(pageQuery) : 1;
  const isFiltered = Boolean(gameIdQuery || deckIdQuery || formatQuery || eventQuery);

  const [filterOptions, totalCount, rows] = await Promise.all([
    listMatchFilterOptions(user.id),
    countMatchesForUser(user.id, filters),
    listMatchesForUser(user.id, filters, currentPage),
  ]);

  const { games, decks } = filterOptions;
  const totalPages = Math.max(1, Math.ceil(totalCount / MATCHES_PAGE_SIZE));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;
  const displayItems = groupMatchesForDisplay(rows);

  const buildHref = (next: Partial<{ gameId: string | null; deckId: string | null; format: string | null; event: string | null; page: number }>) =>
    buildMatchHref(
      {
        gameId: gameIdQuery,
        deckId: deckIdQuery,
        format: formatQuery,
        event: eventQuery,
      },
      next,
    );

  const gameChips: ChipProps[] = [
    { href: buildHref({ gameId: null, page: 1 }), label: "전체 게임", active: !gameIdQuery },
    ...games.map((game) => ({
      href: buildHref({ gameId: game.id, page: 1 }),
      label: game.name,
      active: gameIdQuery === game.id,
    })),
  ];

  const deckChips: ChipProps[] = [
    { href: buildHref({ deckId: null, page: 1 }), label: "전체 덱", active: !deckIdQuery },
    ...decks.map((deck) => ({
      href: buildHref({ deckId: deck.id, page: 1 }),
      label: `${deck.game.name} · ${deck.name}`,
      active: deckIdQuery === deck.id,
    })),
  ];

  const formatChips: ChipProps[] = [
    { href: buildHref({ format: null, page: 1 }), label: "전체 형식", active: !formatQuery },
    { href: buildHref({ format: "bo1", page: 1 }), label: "BO1", active: formatQuery === "bo1" },
    { href: buildHref({ format: "bo3", page: 1 }), label: "BO3", active: formatQuery === "bo3" },
  ];

  const eventChips: ChipProps[] = [
    { href: buildHref({ event: null, page: 1 }), label: "전체 이벤트", active: !eventQuery },
    { href: buildHref({ event: "friendly", page: 1 }), label: "친선", active: eventQuery === "friendly" },
    { href: buildHref({ event: "shop", page: 1 }), label: "매장대회", active: eventQuery === "shop" },
    { href: buildHref({ event: "cs", page: 1 }), label: "CS", active: eventQuery === "cs" },
  ];

  return (
    <AppShell
      title="기록 목록"
      description="필터 칩으로 빠르게 좁히고 카드로 읽는 기록 화면입니다."
      headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}
    >
      <section className="mb-5 overflow-hidden rounded-[32px] bg-surface-container-low p-6 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-accent">Records</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">기록을 카드로 읽습니다</h2>
            <p className="max-w-xl text-sm leading-6 text-muted">
              게임, 덱, 형식, 이벤트별 필터를 칩으로 전환하고, 토너먼트와 단일 매치를 같은 언어로 정렬합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {formatNumber(totalCount)} 경기
            </span>
            <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-semibold text-muted">
              {currentPage} / {totalPages}
            </span>
            <Link
              href="/matches/new"
              className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink"
            >
              새 기록
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-5 space-y-4 rounded-[32px] bg-surface-container-low p-5 shadow-sm">
        <FilterRail title="게임" chips={gameChips} />
        <FilterRail title="덱" chips={deckChips} />
        <FilterRail title="형식" chips={formatChips} />
        <FilterRail title="이벤트" chips={eventChips} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1 text-sm text-muted">
          <p>총 {formatNumber(totalCount)}경기</p>
          <p>
            {currentPage} / {totalPages} 페이지
          </p>
        </div>

        {displayItems.length === 0 ? (
          isFiltered ? (
            <article className="rounded-[32px] bg-surface-container-low p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-ink">조건에 맞는 기록이 없습니다.</p>
              <p className="mt-2 text-sm text-muted">필터를 완화하거나 초기화해서 다시 확인해보세요.</p>
              <Link
                href="/matches"
                className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                필터 초기화
              </Link>
            </article>
          ) : (
            <article className="rounded-[32px] bg-surface-container-low p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-ink">아직 등록된 기록이 없습니다.</p>
              <p className="mt-2 text-sm text-muted">첫 경기 결과를 입력하면 목록이 여기에 쌓입니다.</p>
              <Link
                href="/matches/new"
                className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                첫 기록 입력
              </Link>
            </article>
          )
        ) : null}

        {displayItems.map((item) =>
          item.type === "tournament" ? (
            <TournamentMatchCard
              key={item.group.key}
              group={item.group}
              deleteAction={deleteMatchResult}
            />
          ) : (
            <SingleMatchCard
              key={item.match.id}
              match={item.match}
              deleteAction={deleteMatchResult}
            />
          ),
        )}

        {totalCount > MATCHES_PAGE_SIZE ? (
          <div className="flex items-center justify-between rounded-[28px] bg-surface-container-low p-4 shadow-sm">
            <p className="text-sm text-muted">한 페이지에 {MATCHES_PAGE_SIZE}경기씩 보여줍니다.</p>
            <div className="flex gap-2">
              {prevPage ? (
                <Link
                  href={buildHref({ page: prevPage })}
                  className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink"
                >
                  이전
                </Link>
              ) : (
                <span className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-muted">
                  이전
                </span>
              )}
              {nextPage ? (
                <Link
                  href={buildHref({ page: nextPage })}
                  className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink"
                >
                  다음
                </Link>
              ) : (
                <span className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-muted">
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
