import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(value);
}

export default async function ProfilePage() {
  const authUser = await requireUser();
  const [profile, gameCount, deckCount, matchCount] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: authUser.id,
      },
    }),
    prisma.game.count({
      where: {
        userId: authUser.id,
      },
    }),
    prisma.deck.count({
      where: {
        userId: authUser.id,
      },
    }),
    prisma.matchResult.count({
      where: {
        userId: authUser.id,
      },
    }),
  ]);

  return (
    <AppShell title="프로필" description="계정 정보와 현재 누적 사용 현황을 확인합니다.">
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">계정</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-neutral-500">이름</dt>
              <dd className="font-medium">{profile?.name ?? "미설정"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">이메일</dt>
              <dd className="font-medium">{profile?.email ?? authUser.email ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">가입일</dt>
              <dd className="font-medium">{formatDate(profile?.createdAt ?? null)}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">사용 현황</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-neutral-500">카드 게임</dt>
              <dd className="font-medium">{gameCount}개</dd>
            </div>
            <div>
              <dt className="text-neutral-500">내 덱</dt>
              <dd className="font-medium">{deckCount}개</dd>
            </div>
            <div>
              <dt className="text-neutral-500">경기 기록</dt>
              <dd className="font-medium">{matchCount}건</dd>
            </div>
          </dl>
        </article>
      </section>
    </AppShell>
  );
}
