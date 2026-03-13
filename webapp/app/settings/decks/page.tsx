import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

import { createDeck, toggleDeckState } from "./actions";

type DeckSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeckSettingsPage({ searchParams }: DeckSettingsPageProps) {
  const user = await requireUser();
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;
  const successMessage = typeof params?.message === "string" ? params.message : undefined;
  const decks = await prisma.deck.findMany({
    where: {
      userId: user.id,
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <AppShell title="내 덱 관리" description="입력 화면에서 선택할 덱 목록을 유지합니다.">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">덱 추가</h2>
          <p className="mt-2 text-sm text-neutral-600">
            경기 입력 화면에서 선택할 덱을 먼저 등록합니다. 이름은 사용자별로 유일해야 합니다.
          </p>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm text-accent">
              {successMessage}
            </div>
          ) : null}
          <form action={createDeck} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              덱 이름
              <input
                name="name"
                type="text"
                required
                maxLength={60}
                className="rounded-2xl border border-line px-4 py-3"
                placeholder="로얄 미드레인지"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              대표 색상
              <input
                name="color"
                type="text"
                maxLength={7}
                className="rounded-2xl border border-line px-4 py-3"
                placeholder="#0e6d53"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              메모
              <textarea
                name="memo"
                rows={4}
                maxLength={300}
                className="rounded-2xl border border-line px-4 py-3"
                placeholder="주력 덱, 테스트 목적 등"
              />
            </label>
            <div>
              <button
                type="submit"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
              >
                덱 저장
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">등록된 덱</h2>
              <p className="mt-2 text-sm text-neutral-600">
                기록이 연결된 덱은 삭제 대신 비활성화하는 흐름을 기본으로 사용합니다.
              </p>
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
                      style={{ backgroundColor: deck.color ?? "#d8cdbf" }}
                    />
                    <span className="font-medium">{deck.name}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        deck.isActive
                          ? "bg-accent/10 text-accent"
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
