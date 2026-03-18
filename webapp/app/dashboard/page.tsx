import { AppShell } from "@/components/app-shell";
import { CategoryFilter } from "@/components/category-filter";
import { DashboardCharts } from "@/components/dashboard-charts";
import { HeaderActions } from "@/components/header-actions";
import { MatchupMatrix } from "@/components/matchup-matrix";
import { PeriodFilter } from "@/components/period-filter";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { getDashboardData, getMatchupMatrix } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
      headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}
    >
      <section className="mb-6 space-y-3">
        <PeriodFilter activePeriod={period} defaultFrom={from} defaultTo={to} />
        <CategoryFilter activeCategory={category} />
      </section>

      <DashboardCharts
        myDeckSlices={myDeckSlices}
        opponentSlices={opponentSlices}
        totalMatches={totalMatches}
      />

      <section className="mt-4">
        <MatchupMatrix matchupCells={matchupCells} />
      </section>
    </AppShell>
  );
}
