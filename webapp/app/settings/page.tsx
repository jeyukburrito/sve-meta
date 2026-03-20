import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";

import { signOut } from "../login/actions";

export default async function SettingsPage() {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);

  return (
    <AppShell
      title="설정"
      description="게임, 덱, 태그, 내보내기, 세션 종료를 한 번에 관리합니다."
      headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}
    >
      <div className="mx-auto flex max-w-md flex-col gap-4 pb-8">
        <section className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Control Room
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">설정 허브</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            게임, 덱, 태그, 백업 내보내기, 세션 종료까지 한 번에 관리합니다.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <article className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Deck Ops</p>
            <h3 className="mt-2 text-lg font-semibold">게임 관리</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              추적용 게임 카테고리를 정리합니다.
            </p>
            <Link
              href="/settings/games"
              className="mt-4 inline-flex rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white"
            >
              관리 화면
            </Link>
          </article>
          <article className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Deck Ops</p>
            <h3 className="mt-2 text-lg font-semibold">덱 관리</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              게임별로 사용하는 덱을 정리합니다.
            </p>
            <Link
              href="/settings/decks"
              className="mt-4 inline-flex rounded-full border border-line px-4 py-2.5 text-sm font-bold text-ink"
            >
              관리 화면
            </Link>
          </article>
        </section>

        <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
          <SettingsLink
            href="/settings/tags"
            label="태그 관리"
            description="경기 분류용 태그를 생성하고 정리합니다."
          />
          <SettingsLink
            href="/settings/export"
            label="CSV 내보내기"
            description="조건에 맞는 기록을 CSV로 받습니다."
          />
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-paper"
            >
              <span>
                <span className="block text-sm font-semibold text-ink">로그아웃</span>
                <span className="mt-1 block text-xs text-muted">현재 세션을 종료합니다.</span>
              </span>
              <span className="rounded-full bg-danger/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-danger">
                Exit
              </span>
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

function SettingsLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-paper"
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
      </span>
      <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 text-muted" aria-hidden="true">
        <path
          d="M9 18l6-6-6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
