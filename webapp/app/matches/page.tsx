import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const sampleRows = [
  {
    date: "2026-03-13",
    myDeck: "미드레인지 로얄",
    opponent: "콤보 엘프",
    result: "승",
    detail: "BO3 · 2:1 · 선공",
  },
  {
    date: "2026-03-12",
    myDeck: "램프 드래곤",
    opponent: "ナイトメア",
    result: "패",
    detail: "BO1 · 0:1 · 후공",
  },
];

export default async function MatchesPage() {
  await requireUser();

  return (
    <AppShell title="기록 목록" description="기간, 덱, 태그 기준으로 전적을 필터링합니다.">
      <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-2xl border border-line px-4 py-3" placeholder="상대 덱 검색" />
          <input className="rounded-2xl border border-line px-4 py-3" placeholder="내 덱" />
          <input className="rounded-2xl border border-line px-4 py-3" placeholder="태그" />
          <input className="rounded-2xl border border-line px-4 py-3" placeholder="기간" />
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {sampleRows.map((row) => (
          <article
            key={`${row.date}-${row.myDeck}-${row.opponent}`}
            className="rounded-3xl border border-line bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-500">{row.date}</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {row.myDeck} vs {row.opponent}
                </h2>
                <p className="mt-2 text-sm text-neutral-600">{row.detail}</p>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {row.result}
              </span>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
