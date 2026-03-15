import { AppShell } from "@/components/app-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createGame, deleteGame, updateGame } from "./actions";

export const dynamic = "force-dynamic";

type GamesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;
  const games = await prisma.game.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      _count: {
        select: {
          decks: true,
        },
      },
    },
  });

  return (
    <AppShell title="카드게임 관리">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">카드게임 추가</h2>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}
          <form action={createGame} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              카드게임 이름
              <input
                name="name"
                type="text"
                required
                maxLength={60}
                className="rounded-2xl border border-line px-4 py-3"
                placeholder="Shadowverse EVOLVE"
              />
            </label>
            <div>
              <SubmitButton label="카테고리 저장" />
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">등록된 카드게임</h2>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-sm font-medium">
              총 {games.length}개
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {games.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-neutral-500">
                아직 등록된 카드게임이 없습니다.
              </div>
            ) : null}
            {games.map((game) => (
              <div
                key={game.id}
                className="rounded-2xl border border-line px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{game.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">연결된 덱 {game._count.decks}개</p>
                  </div>
                  <div className="flex flex-col gap-2 md:items-end">
                    <form action={updateGame} className="flex gap-2">
                      <input type="hidden" name="gameId" value={game.id} />
                      <input
                        name="name"
                        type="text"
                        defaultValue={game.name}
                        maxLength={60}
                        className="rounded-full border border-line px-4 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-4 py-2 text-sm font-medium"
                      >
                        이름 변경
                      </button>
                    </form>
                    <form action={deleteGame}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-danger/30 px-4 py-2 text-sm font-medium text-danger"
                      >
                        카테고리 삭제
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
