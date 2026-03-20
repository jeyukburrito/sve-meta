import { AppShell } from "@/components/app-shell";
import { CategoryFilter } from "@/components/category-filter";
import { DashboardCharts } from "@/components/dashboard-charts";
import { HeaderActions } from "@/components/header-actions";
import { PeriodFilter } from "@/components/period-filter";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { getDashboardData, getMatchupMatrix } from "@/lib/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function filterLabel(value: string, kind: "period" | "category") {
  if (kind === "period") {
    if (value === "7d") return "최근 7일";
    if (value === "30d") return "최근 30일";
    if (value === "custom") return "사용자 지정";
    return "전체 기간";
  }

  if (value === "friendly") return "친선";
  if (value === "shop") return "매장대회";
  if (value === "cs") return "CS";
  return "전체 이벤트";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const period = typeof params?.period === "string" ? params.period : "all";
  const from = typeof params?.from === "string" ? params.from : undefined;
  const to = typeof params?.to === "string" ? params.to : undefined;
  const category = typeof params?.category === "string" ? params.category : "all";

  const [{ myDeckSlices, opponentSlices, totalMatches }, matchupCells] = await Promise.all([
    getDashboardData(user.id, {
      period,
      from,
      to,
      category,
    }),
    getMatchupMatrix(user.id, {
      period,
      from,
      to,
      category,
    }),
  ]);

  return (
    <AppShell
      title="대시보드"
      description="기록 흐름과 상성을 한 화면에서 요약합니다."
      headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}
    >
      <section className="mb-5 overflow-hidden rounded-[32px] bg-surface-container-low p-6 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-accent">Overview</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Tactical Editorial 대시보드
            </h2>
            <p className="max-w-xl text-sm leading-6 text-muted">
              최근 전적, 주력 덱, 상대 분포, 상성 흐름을 카드형 레이아웃으로 빠르게 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {filterLabel(period, "period")}
            </span>
            <span className="rounded-full bg-line/40 px-3 py-1 text-xs font-semibold text-muted">
              {filterLabel(category, "category")}
            </span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">
              {totalMatches} 경기
            </span>
          </div>
        </div>
      </section>

      <section className="mb-5 space-y-3 rounded-[32px] bg-surface-container-low p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">Filters</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">기간과 범위를 조정합니다</h3>
          </div>
        </div>
        <div className="space-y-4">
          <PeriodFilter activePeriod={period} defaultFrom={from} defaultTo={to} />
          <CategoryFilter activeCategory={category} />
        </div>
      </section>

      <DashboardCharts
        myDeckSlices={myDeckSlices}
        opponentSlices={opponentSlices}
        matchupCells={matchupCells}
        totalMatches={totalMatches}
      />
    </AppShell>
  );
}
