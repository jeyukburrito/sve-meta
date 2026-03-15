import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const [games, decks] = await Promise.all([
    prisma.game.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.deck.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        game: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <AppShell title="데이터 내보내기" description="필요한 조건만 골라 CSV 파일로 내려받습니다." headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
        <form action="/matches/export" method="get" className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            카드 게임
            <select name="gameId" className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink">
              <option value="">전체</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            내 덱
            <select name="deckId" className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink">
              <option value="">전체</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.game.name} · {deck.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            경기 형식
            <select name="format" className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink">
              <option value="">전체</option>
              <option value="bo1">BO1</option>
              <option value="bo3">BO3</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            대회 분류
            <select name="event" className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink">
              <option value="">전체</option>
              <option value="friendly">친선전</option>
              <option value="shop">매장대회</option>
              <option value="cs">CS</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            상대 덱 검색
            <input
              name="opponent"
              type="text"
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
              placeholder="상대 덱 이름 일부"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
            >
              CSV 다운로드
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
