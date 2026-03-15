type TournamentBannerProps = {
  eventLabel: string;
  phaseLabel: string;
  roundNumber: number;
  isElimination: boolean;
  tournamentSessionId: string;
  eliminationUrl: string | null;
};

export function TournamentBanner({
  eventLabel,
  phaseLabel,
  roundNumber,
  isElimination,
  tournamentSessionId,
  eliminationUrl,
}: TournamentBannerProps) {
  return (
    <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-accent">
          {eventLabel} {phaseLabel} 라운드 {roundNumber} 입력 중
        </span>
        <div className="flex gap-2">
          {!isElimination && eliminationUrl ? (
            <a
              href={eliminationUrl}
              className="rounded-full border border-accent/30 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
            >
              본선 진행
            </a>
          ) : null}
          <form action="/matches/tournaments/end" method="post">
            <input type="hidden" name="tournamentSessionId" value={tournamentSessionId} />
            <button
              type="submit"
              className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-line"
            >
              대회 종료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
