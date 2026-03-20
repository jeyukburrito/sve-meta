import Link from "next/link";

import type { DonutSlice, MatchupCell } from "@/lib/dashboard";

const COLORS = [
  "#4f46e5",
  "#8f5a20",
  "#3b6fa0",
  "#dc2626",
  "#6b5b95",
  "#d8a347",
  "#2e8b7a",
  "#c06050",
  "#4a7c59",
  "#7a6352",
];

type DashboardChartsProps = {
  myDeckSlices: DonutSlice[];
  opponentSlices: DonutSlice[];
  matchupCells: MatchupCell[];
  totalMatches: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function buildConicGradient(slices: DonutSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return "conic-gradient(#e2e8f0 0% 100%)";
  }

  let cursor = 0;
  const segments = slices.map((slice, index) => {
    const start = cursor;
    const stop = start + (slice.value / total) * 100;
    cursor = stop;
    return `${COLORS[index % COLORS.length]} ${start.toFixed(2)}% ${stop.toFixed(2)}%`;
  });

  if (cursor < 100) {
    segments.push(`#e2e8f0 ${cursor.toFixed(2)}% 100%`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

function ringLabel(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function InfoCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <article className="rounded-[28px] border border-line bg-surface p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-ink">{value}</p>
      {subtext ? <p className="mt-2 text-sm text-muted">{subtext}</p> : null}
    </article>
  );
}

function DistributionCard({
  title,
  slices,
  totalMatches,
  emptyHref,
}: {
  title: string;
  slices: DonutSlice[];
  totalMatches: number;
  emptyHref: string;
}) {
  const hasData = slices.length > 0 && totalMatches > 0;
  const topSlices = slices.slice(0, 4);
  const totalValue = slices.reduce((sum, slice) => sum + slice.value, 0);
  const gradient = buildConicGradient(slices);

  return (
    <article className="rounded-[32px] border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Distribution</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink">{title}</h3>
        </div>
        <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-semibold text-muted">
          {formatNumber(totalValue)} games
        </span>
      </div>

      {hasData ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex items-center justify-center">
            <div
              className="relative flex size-44 items-center justify-center rounded-full"
              style={{ background: gradient }}
            >
              <div className="flex size-28 items-center justify-center rounded-full border border-line bg-surface text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Top</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{topSlices[0]?.name ?? "-"}</p>
                  <p className="text-sm text-muted">
                    {topSlices[0] ? ringLabel(topSlices[0].value, totalMatches) : "0%"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {topSlices.map((slice, index) => (
              <div key={slice.name} className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 truncate text-sm font-medium text-ink">{slice.name}</span>
                <span className="text-xs font-semibold text-muted">
                  {formatNumber(slice.value)} / {slice.rate}%
                </span>
              </div>
            ))}
            {slices.length > topSlices.length ? (
              <div className="rounded-2xl border border-dashed border-line px-3 py-2.5 text-sm text-muted">
                그 외 {slices.length - topSlices.length}개 항목
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[28px] border border-dashed border-line bg-paper px-5 py-8 text-center">
          <p className="text-sm font-medium text-ink">아직 분포 데이터가 없습니다.</p>
          <p className="mt-2 text-sm text-muted">첫 기록을 추가하면 분포와 상성이 채워집니다.</p>
          <Link
            href={emptyHref}
            className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            기록 추가
          </Link>
        </div>
      )}
    </article>
  );
}

export function DashboardCharts({
  myDeckSlices,
  opponentSlices,
  matchupCells,
  totalMatches,
}: DashboardChartsProps) {
  const totalWins = myDeckSlices.reduce((sum, slice) => sum + slice.wins, 0);
  const winRate = totalMatches === 0 ? 0 : Math.round((totalWins / totalMatches) * 100);
  const topMyDeck = myDeckSlices[0];
  const topOpponent = opponentSlices[0];
  const topMatchups = [...matchupCells]
    .sort((a, b) => b.rate - a.rate || b.total - a.total || a.opponentDeck.localeCompare(b.opponentDeck))
    .slice(0, 6);

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="총 기록"
          value={formatNumber(totalMatches)}
          subtext="전체 기간 기준 누적 매치 수"
        />
        <InfoCard
          label="승률"
          value={`${winRate}%`}
          subtext={totalMatches > 0 ? `${formatNumber(totalWins)}승 포함` : "데이터가 더 필요합니다"}
        />
        <InfoCard
          label="주력 덱"
          value={topMyDeck?.name ?? "-"}
          subtext={
            topMyDeck ? `${formatNumber(topMyDeck.value)}경기 · ${topMyDeck.rate}% 승률` : "아직 기록이 없습니다"
          }
        />
        <InfoCard
          label="가장 많은 상대"
          value={topOpponent?.name ?? "-"}
          subtext={
            topOpponent
              ? `${formatNumber(topOpponent.value)}경기 · ${topOpponent.rate}% 승률`
              : "아직 기록이 없습니다"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionCard
          title="내 덱 분포"
          slices={myDeckSlices}
          totalMatches={totalMatches}
          emptyHref="/matches/new"
        />
        <DistributionCard
          title="상대 덱 분포"
          slices={opponentSlices}
          totalMatches={totalMatches}
          emptyHref="/matches/new"
        />
      </div>

      <article className="rounded-[32px] border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Matchups</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink">상성 미리보기</h3>
          </div>
          <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-semibold text-muted">
            Top {topMatchups.length}
          </span>
        </div>

        {topMatchups.length > 0 ? (
          <div className="mt-5 space-y-3">
            {topMatchups.map((cell, index) => (
              <div
                key={`${cell.myDeck}:${cell.opponentDeck}`}
                className="rounded-[24px] border border-line bg-paper px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">
                      #{index + 1}
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-ink">
                      {cell.myDeck} vs {cell.opponentDeck}
                    </h4>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      cell.rate >= 60
                        ? "bg-success/10 text-success"
                        : cell.rate >= 50
                          ? "bg-accent/10 text-accent"
                          : "bg-danger/10 text-danger"
                    }`}
                  >
                    {cell.rate}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${cell.rate}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted">
                  <span>
                    {formatNumber(cell.wins)}승 · {formatNumber(cell.total - cell.wins)}패
                  </span>
                  <span>{formatNumber(cell.total)} 경기</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[28px] border border-dashed border-line bg-paper px-5 py-8 text-center text-sm text-muted">
            상성 미리보기를 만들 데이터가 아직 없습니다.
          </div>
        )}
      </article>
    </section>
  );
}
