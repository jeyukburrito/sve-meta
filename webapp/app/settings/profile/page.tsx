import Link from "next/link";

import { Prisma } from "@prisma/client";

import { AppShell } from "@/components/app-shell";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { HeaderActions } from "@/components/header-actions";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/format-date";
import { prisma } from "@/lib/prisma";

import { deleteAccount } from "./actions";

export const dynamic = "force-dynamic";

type ProfileStats = {
  total: number;
  wins: number;
  rate: number | null;
  lastPlayedAt: Date | null;
  deckCount: number;
  tagCount: number;
  gameCount: number;
};

type MatchStatsRow = {
  total: bigint | number;
  wins: bigint | number;
  lastPlayedAt: Date | null;
};

function bigintToNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(value);
}

async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [matchRows, deckCount, tagCount, gameCount] = await Promise.all([
    prisma.$queryRaw<MatchStatsRow[]>(Prisma.sql`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE "isMatchWin")::bigint AS wins,
        MAX("playedAt") AS "lastPlayedAt"
      FROM "match_results"
      WHERE "userId" = CAST(${userId} AS uuid)
    `),
    prisma.deck.count({
      where: { userId, isActive: true },
    }),
    prisma.tag.count({
      where: { userId },
    }),
    prisma.game.count({
      where: { userId },
    }),
  ]);

  const row = matchRows[0];
  const total = row ? bigintToNumber(row.total) : 0;
  const wins = row ? bigintToNumber(row.wins) : 0;
  const lastPlayedAt = row?.lastPlayedAt ?? null;
  const rate = total === 0 ? null : Math.round((wins / total) * 100);

  return { total, wins, rate, lastPlayedAt, deckCount, tagCount, gameCount };
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-success" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function SettingsLink({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2 text-muted">
        {count !== undefined ? <span className="text-xs">{count}개</span> : null}
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}

export default async function ProfilePage() {
  const authUser = await requireUser();
  const display = getUserDisplayInfo(authUser);

  const [profile, stats] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: authUser.id,
      },
    }),
    getProfileStats(authUser.id),
  ]);

  return (
    <AppShell title="프로필" headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="mx-auto max-w-2xl">
        <article className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent ring-2 ring-accent ring-offset-2 ring-offset-surface">
              {display.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={display.avatarUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl font-bold">
                  {display.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{profile?.name ?? display.name ?? "미설정"}</h2>
            <p className="mt-1 text-sm text-muted">{profile?.email ?? authUser.email ?? "-"}</p>
          </div>
        </article>

        <section className="mt-4">
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted">내 기록</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="총 매치" value={`${stats.total}전`} />
            <StatCard
              label="승률"
              value={stats.rate !== null ? `${stats.rate}%` : "-"}
              accent={stats.rate !== null && stats.rate >= 50}
            />
            <StatCard label="등록 덱" value={`${stats.deckCount}개`} />
            <StatCard
              label="마지막 플레이"
              value={stats.lastPlayedAt ? formatRelativeDate(stats.lastPlayedAt) : "-"}
            />
          </div>
        </section>

        <section className="mt-4">
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted">관리</h2>
          <article className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm divide-y divide-line">
            <SettingsLink href="/settings/decks" label="덱 관리" count={stats.deckCount} />
            <SettingsLink href="/settings/games" label="게임 관리" count={stats.gameCount} />
            <SettingsLink href="/settings/tags" label="태그 관리" count={stats.tagCount} />
          </article>
        </section>

        <section className="mt-4">
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted">계정 정보</h2>
          <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
            <dl className="space-y-0 divide-y divide-line">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-muted">가입일</dt>
                <dd className="font-medium">{formatDate(profile?.createdAt ?? null)}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="mt-4">
          <h2 className="mb-3 px-1 text-sm font-semibold text-danger">위험 구역</h2>
          <article className="rounded-3xl border border-danger/20 bg-surface p-5 shadow-sm">
            <form action={deleteAccount}>
              <p className="mb-4 text-sm text-muted">
                회원 탈퇴 시 계정, 카드게임, 덱, 경기 기록이 모두 삭제되며 복구할 수 없습니다.
              </p>
              <DeleteAccountButton />
            </form>
          </article>
        </section>
      </section>
    </AppShell>
  );
}
