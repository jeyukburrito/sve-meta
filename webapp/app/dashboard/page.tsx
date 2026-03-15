import { AppShell } from "@/components/app-shell";
import { DashboardCharts } from "@/components/dashboard-charts";
import { PeriodFilter } from "@/components/period-filter";
import { requireUser } from "@/lib/auth";
import { buildDonutData, filterByPeriod } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : undefined;
  const period = typeof params?.period === "string" ? params.period : "all";
  const from = typeof params?.from === "string" ? params.from : undefined;
  const to = typeof params?.to === "string" ? params.to : undefined;

  const rows = await prisma.matchResult.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      playedAt: "desc",
    },
    include: {
      myDeck: {
        select: {
          name: true,
          game: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const filtered = filterByPeriod(rows, { period, from, to });
  const { myDeckSlices, opponentSlices, totalMatches } = buildDonutData(filtered);

  return (
    <AppShell title="대시보드" description="기간별 덱 분포와 상대 덱 통계를 확인합니다.">
      <section className="mb-6">
        <PeriodFilter activePeriod={period} defaultFrom={from} defaultTo={to} />
      </section>

      <DashboardCharts
        myDeckSlices={myDeckSlices}
        opponentSlices={opponentSlices}
        totalMatches={totalMatches}
      />
    </AppShell>
  );
}
