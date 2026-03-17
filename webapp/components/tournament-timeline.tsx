"use client";

import Link from "next/link";

import { formatRelativeDate } from "@/lib/format-date";
import type { TournamentGroup } from "@/lib/group-matches";

type TournamentTimelineProps = {
  group: TournamentGroup;
  deleteAction: (formData: FormData) => void;
};

const EVENT_LABELS: Record<string, string> = {
  shop: "매장대회",
  cs: "CS",
};

export function TournamentTimeline({ group, deleteAction }: TournamentTimelineProps) {
  const wins = group.matches.filter((m) => m.isMatchWin).length;
  const losses = group.matches.length - wins;
  const showPhaseLabels = group.hasSwiss && group.hasElimination;
  const isEnded = Boolean(group.endedAt);
  const groupDateStr = group.date.toISOString().slice(0, 10);
  const nextSwissRound =
    group.matches.filter((match) => match.tournamentPhase !== "elimination").length + 1;
  const nextEliminationRound =
    group.matches.filter((match) => match.tournamentPhase === "elimination").length + 1;

  let swissIdx = 0;
  let elimIdx = 0;

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        isEnded ? "border-line bg-line/10" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              {EVENT_LABELS[group.eventCategory] ?? group.eventCategory}
            </span>
            <span className="text-sm text-muted">{formatRelativeDate(group.date)}</span>
            {isEnded ? (
              <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
                대회 종료
              </span>
            ) : null}
          </div>
          <h2 className="mt-1 text-lg font-semibold">{group.deckName}</h2>
          <p className="text-sm text-muted">{group.gameName}</p>
          {isEnded ? (
            <p className="mt-2 text-sm text-muted">
              종료된 대회입니다. 기존 기록만 수정할 수 있습니다.
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold leading-none">
            <span className="text-success">{wins}</span>
            <span className="mx-0.5 text-muted">-</span>
            <span className="text-danger">{losses}</span>
          </p>
          <p className="mt-1 text-xs text-muted">{group.matches.length}R</p>
        </div>
      </div>

      <div className="relative mt-5 ml-3">
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-line" />
        <div className="space-y-0">
          {group.matches.map((match, idx) => {
            const isElim = match.tournamentPhase === "elimination";
            const prevMatch = idx > 0 ? group.matches[idx - 1] : null;
            const phaseChanged = prevMatch && prevMatch.tournamentPhase !== match.tournamentPhase;

            let roundNum: number;
            if (isElim) {
              elimIdx += 1;
              roundNum = elimIdx;
            } else {
              swissIdx += 1;
              roundNum = swissIdx;
            }

            return (
              <div key={match.id}>
                {showPhaseLabels && (idx === 0 || phaseChanged) ? (
                  <div className="relative flex items-center gap-3 pb-3">
                    <div className="relative z-10 shrink-0">
                      <div className="size-[11px]" />
                    </div>
                    <span className="text-xs font-semibold text-muted">
                      {isElim ? "본선 (토너먼트)" : "예선 (스위스)"}
                    </span>
                  </div>
                ) : null}

                <div className="relative flex items-start gap-4 pb-4 last:pb-0">
                  <div className="relative z-10 mt-1.5 shrink-0">
                    <div
                      className={`size-[11px] rounded-full border-2 ${
                        match.isMatchWin
                          ? "border-success bg-success"
                          : "border-danger bg-danger"
                      }`}
                    />
                  </div>

                  <div className="flex-1 rounded-2xl border border-line px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">
                          {showPhaseLabels && isElim ? `T${roundNum}` : `R${roundNum}`}
                        </span>
                        <span className="font-medium">vs {match.opponentDeckName}</span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${
                          match.isMatchWin
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {match.isMatchWin ? "승" : "패"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {match.matchFormat.toUpperCase()} ·{" "}
                      {match.playOrder === "first" ? "선공" : "후공"}
                      {match.memo ? ` · ${match.memo}` : ""}
                    </p>
                    {match.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {match.tags.map(({ tag }) => (
                          <span
                            key={tag.id}
                            className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-muted"
                          >
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        href={`/matches/${match.id}/edit`}
                        className="text-xs text-muted underline-offset-2 hover:underline"
                      >
                        수정
                      </Link>
                      <form action={deleteAction} className="flex">
                        <input type="hidden" name="matchId" value={match.id} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!window.confirm("이 라운드 기록을 삭제하시겠습니까?")) {
                              e.preventDefault();
                            }
                          }}
                          className="text-xs text-danger underline-offset-2 hover:underline"
                        >
                          삭제
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isEnded && group.tournamentSessionId ? (
        <div className="mt-3 ml-3 flex gap-4">
          <div className="relative z-10 mt-1 shrink-0">
            <div className="size-[11px] rounded-full border-2 border-dashed border-line bg-surface" />
          </div>
          <Link
            href={`/matches/new?${new URLSearchParams({
              event: group.eventCategory,
              date: groupDateStr,
              deckId: group.firstDeckId,
              gameId: group.firstGameId,
              phase: group.hasElimination ? "elimination" : "swiss",
              tournamentId: group.tournamentSessionId,
            }).toString()}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            +{" "}
            {group.hasElimination
              ? `본선 라운드 ${nextEliminationRound} 추가`
              : `예선 라운드 ${nextSwissRound} 추가`}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
