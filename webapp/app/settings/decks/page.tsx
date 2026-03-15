import { AppShell } from "@/components/app-shell";
import { ColorPicker } from "@/components/color-picker";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SubmitButton } from "@/components/submit-button";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

import { createDeck, toggleDeckState } from "./actions";

type DeckSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeckSettingsPage({ searchParams }: DeckSettingsPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;
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
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
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
    <AppShell title="내 덱 관리" headerRight={<ProfileAvatar avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">덱 추가</h2>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}
          <form action={createDeck} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              카드게임
              <select
                name="gameId"
                required
                defaultValue=""
                className="rounded-2xl border border-line px-4 py-3"
              >
                <option value="">카드게임을 선택하세요</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              덱 이름
              <input
                name="name"
                type="text"
                required
                maxLength={60}
                className="rounded-2xl border border-line px-4 py-3"
                placeholder="예: 어그로 덱"
              />
            </label>
            <ColorPicker name="color" />
            <label className="grid gap-2 text-sm font-medium">
              메모
              <textarea
                name="memo"
                rows={4}
                maxLength={300}
                className="rounded-2xl border border-line px-4 py-3"
              />
            </label>
            <div>
              {games.length === 0 ? (
                <p className="mb-3 text-sm text-danger">
                  먼저 카드게임 카테고리를 1개 이상 등록해야 덱을 만들 수 있습니다.
                </p>
              ) : null}
              <SubmitButton label="덱 저장" disabled={games.length === 0} />
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">등록된 덱</h2>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-sm font-medium">
              총 {decks.length}개
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {decks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-neutral-500">
                아직 등록된 덱이 없습니다.
              </div>
            ) : null}
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block size-3 rounded-full border border-black/10"
                      style={{ backgroundColor: deck.color ?? "#e2e8f0" }}
                    />
                    <span className="font-medium">{deck.name}</span>
                    <span className="rounded-full bg-paper px-2 py-1 text-xs font-medium text-neutral-600">
                      {deck.game.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        deck.isActive
                          ? "bg-success/10 text-success"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {deck.isActive ? "활성" : "비활성"}
                    </span>
                  </div>
                  {deck.memo ? <p className="mt-2 text-sm text-neutral-600">{deck.memo}</p> : null}
                </div>
                <form action={toggleDeckState}>
                  <input type="hidden" name="deckId" value={deck.id} />
                  <input
                    type="hidden"
                    name="nextState"
                    value={deck.isActive ? "inactive" : "active"}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2 text-sm font-medium"
                  >
                    {deck.isActive ? "비활성화" : "재활성화"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
