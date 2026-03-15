import { AppShell } from "@/components/app-shell";
import { GameDeckFields } from "@/components/game-deck-fields";
import { MatchResultInput } from "@/components/match-result-input";
import { ProfileAvatar } from "@/components/profile-avatar";
import { SubmitButton } from "@/components/submit-button";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createMatchResult } from "../actions";

export const dynamic = "force-dynamic";

type NewMatchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewMatchPage({ searchParams }: NewMatchPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const decks = await prisma.deck.findMany({
    where: {
      userId: user.id,
      isActive: true,
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
  });

  return (
    <AppShell title="결과 입력" headerRight={<ProfileAvatar avatarUrl={display.avatarUrl} name={display.name} />}>
      <form
        action={createMatchResult}
        className="grid gap-4 rounded-3xl border border-line bg-white p-5 shadow-sm md:grid-cols-2"
      >
        {errorMessage ? (
          <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger md:col-span-2">
            {errorMessage}
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          날짜
          <input
            name="playedAt"
            type="date"
            required
            defaultValue={today}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <GameDeckFields
          decks={decks.map((deck) => ({
            id: deck.id,
            name: deck.name,
            gameId: deck.gameId,
            gameName: deck.game.name,
          }))}
        />
        <label className="grid gap-2 text-sm font-medium">
          상대 덱
          <input
            name="opponentDeckName"
            type="text"
            required
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <MatchResultInput />
        <label className="grid gap-2 text-sm font-medium">
          선공 / 후공
          <select name="playOrder" className="rounded-2xl border border-line px-4 py-3" required>
            <option value="first">선공</option>
            <option value="second">후공</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          선후공 결정여부
          <select
            name="didChoosePlayOrder"
            defaultValue="false"
            className="rounded-2xl border border-line px-4 py-3"
            required
          >
            <option value="true">O</option>
            <option value="false">X</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          메모
          <textarea
            name="memo"
            rows={4}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <div className="md:col-span-2">
          {decks.length === 0 ? (
            <p className="mb-3 text-sm text-danger">
              먼저 설정에서 카드게임과 내 덱을 1개 이상 등록해야 결과를 기록할 수 있습니다.
            </p>
          ) : null}
          <SubmitButton label="결과 저장" disabled={decks.length === 0} />
        </div>
      </form>
    </AppShell>
  );
}
