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

  // 예선/본선별 라운드 넘버링을 위한 카운터
  let swissIdx = 0;
  let elimIdx = 0;

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
      {/* 대회 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              {EVENT_LABELS[group.eventCategory] ?? group.eventCategory}
            </span>
            <span className="text-sm text-muted">{formatRelativeDate(group.date)}</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold">{group.deckName}</h2>
          <p className="text-sm text-muted">{group.gameName}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            <span className="text-success">{wins}</span>
            <span className="mx-0.5 text-muted">-</span>
            <span className="text-danger">{losses}</span>
          </p>
          <p className="text-xs text-muted">{group.matches.length}R</p>
        </div>
      </div>

      {/* 라운드 타임라인 */}
      <div className="relative mt-5 ml-3">
        {/* 세로 연결선 */}
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-line" />

        <div className="space-y-0">
          {group.matches.map((match, idx) => {
            const isElim = match.tournamentPhase === "elimination";
            const prevMatch = idx > 0 ? group.matches[idx - 1] : null;
            const phaseChanged = prevMatch && prevMatch.tournamentPhase !== match.tournamentPhase;

            // 라운드 번호 계산 (null은 swiss 취급)
            let roundNum: number;
            if (isElim) {
              elimIdx++;
              roundNum = elimIdx;
            } else {
              swissIdx++;
              roundNum = swissIdx;
            }

            return (
              <div key={match.id}>
                {/* 본선 전환 라벨 */}
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

                <div className="relative flex gap-4 pb-4 last:pb-0">
                  {/* 도트 */}
                  <div className="relative z-10 mt-1.5 shrink-0">
                    <div
                      className={`size-[11px] rounded-full border-2 ${
                        match.isMatchWin
                          ? "border-success bg-success"
                          : "border-danger bg-danger"
                      }`}
                    />
                  </div>

                  {/* 라운드 카드 */}
                  <div className="flex-1 rounded-2xl border border-line px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted">
                          {showPhaseLabels && isElim ? `T${roundNum}` : `R${roundNum}`}
                        </span>
                        <span className="font-medium">vs {match.opponentDeckName}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          match.isMatchWin
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {match.isMatchWin ? "승" : "패"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {match.matchFormat.toUpperCase()} · {match.playOrder === "first" ? "선공" : "후공"}
                      {match.memo ? ` · ${match.memo}` : ""}
                    </p>
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

      {/* 다음 라운드 추가 */}
      <div className="mt-3 ml-3 flex gap-4">
        <div className="relative z-10 mt-1 shrink-0">
          <div className="size-[11px] rounded-full border-2 border-dashed border-line bg-surface" />
        </div>
        <Link
          href={`/matches/new?${new URLSearchParams({
            event: group.eventCategory,
            date: group.date.toISOString().slice(0, 10),
            deckId: group.firstDeckId,
            gameId: group.firstGameId,
            round: String(group.matches.length + 1),
            phase: group.hasElimination ? "elimination" : "swiss",
          }).toString()}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          + 라운드 추가
        </Link>
      </div>
    </article>
  );
}
