import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const stats = [
  { label: "전체 승률", value: "0%", hint: "기록이 쌓이면 자동 계산됩니다." },
  { label: "최근 7일", value: "0전 0승", hint: "주간 메타 감각을 빠르게 확인합니다." },
  { label: "선공 승률", value: "0%", hint: "선공/후공 분리 통계를 별도로 집계합니다." },
  { label: "BO3 승률", value: "0%", hint: "매치 기준 성과를 확인합니다." },
];

export default async function DashboardPage() {
  await requireUser();

  return (
    <AppShell title="대시보드" description="기본 통계 요약과 최근 전적 흐름을 확인합니다.">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">자주 만난 상대 덱</h2>
          <p className="mt-2 text-sm text-neutral-600">
            MVP에서는 서버 계산 결과를 여기에 표시합니다.
          </p>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">내 덱별 승률</h2>
          <p className="mt-2 text-sm text-neutral-600">
            등록한 덱 기준으로 누적 승률을 요약합니다.
          </p>
        </article>
      </section>
    </AppShell>
  );
}
