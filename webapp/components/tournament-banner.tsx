"use client";

type TournamentBannerProps = {
  eventLabel: string;
  phaseLabel: string;
  roundNumber: number;
  isElimination: boolean;
  eliminationUrl: string | null;
};

export function TournamentBanner({
  eventLabel,
  phaseLabel,
  roundNumber,
  isElimination,
  eliminationUrl,
}: TournamentBannerProps) {
  return (
    <div className="mb-4 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-accent">
          {eventLabel} {phaseLabel} 라운드 {roundNumber} 입력 중
        </span>
        <div className="flex gap-2">
          {!isElimination && eliminationUrl ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("예선을 마치고 본선(토너먼트)으로 넘어가시겠습니까?")) {
                  window.location.href = eliminationUrl;
                }
              }}
              className="rounded-full border border-accent/30 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
            >
              본선 진행
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (window.confirm("대회 기록 입력을 종료하시겠습니까?")) {
                window.location.href = "/matches";
              }
            }}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-line"
          >
            대회 종료
          </button>
        </div>
      </div>
    </div>
  );
}
