import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewMatchPage() {
  const user = await requireUser();
  const decks = await prisma.deck.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AppShell
      title="결과 입력"
      description="모바일에서 빠르게 기록하는 것이 최우선입니다."
    >
      <form className="grid gap-4 rounded-3xl border border-line bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          날짜
          <input type="date" className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          내 덱
          <select name="myDeckId" className="rounded-2xl border border-line px-4 py-3" required>
            <option value="">덱을 선택하세요</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          상대 덱
          <input type="text" className="rounded-2xl border border-line px-4 py-3" placeholder="엘프 콤보" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          경기 형식
          <select className="rounded-2xl border border-line px-4 py-3">
            <option>BO1</option>
            <option>BO3</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          선공 / 후공
          <select className="rounded-2xl border border-line px-4 py-3">
            <option>선공</option>
            <option>후공</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          이벤트 유형
          <select className="rounded-2xl border border-line px-4 py-3">
            <option>랭크전</option>
            <option>매장</option>
            <option>친선전</option>
            <option>대회</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          승 수
          <input type="number" min="0" className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          패 수
          <input type="number" min="0" className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          메모
          <textarea
            rows={4}
            className="rounded-2xl border border-line px-4 py-3"
            placeholder="후공에서 mulligan 판단이 애매했음"
          />
        </label>
        <div className="md:col-span-2">
          {decks.length === 0 ? (
            <p className="mb-3 text-sm text-danger">
              먼저 설정에서 내 덱을 1개 이상 등록해야 결과를 기록할 수 있습니다.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={decks.length === 0}
            className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            저장 준비
          </button>
        </div>
      </form>
    </AppShell>
  );
}
