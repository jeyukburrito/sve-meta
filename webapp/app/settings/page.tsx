import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";

import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);

  return (
    <AppShell title="설정" description="계정, 데이터, 카드게임 구성을 여기서 관리합니다." headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="space-y-4">
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold">프로필</h2>
          <p className="mt-2 text-sm text-muted">
            {user.email ?? "현재 로그인한 계정"} 정보를 확인합니다.
          </p>
          <Link
            href="/settings/profile"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            프로필 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold">카드게임 관리</h2>
          <p className="mt-2 text-sm text-muted">추적할 카드게임 카테고리를 관리합니다.</p>
          <Link
            href="/settings/games"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            카드게임 관리 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold">덱 관리</h2>
          <p className="mt-2 text-sm text-muted">카드게임별로 사용하는 덱을 정리합니다.</p>
          <Link
            href="/settings/decks"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            덱 관리 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold">CSV 내보내기</h2>
          <p className="mt-2 text-sm text-muted">필터를 고른 뒤 CSV 파일로 경기 기록을 내려받습니다.</p>
          <Link
            href="/settings/export"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            내보내기 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold">로그아웃</h2>
          <p className="mt-2 text-sm text-muted">현재 계정 세션을 종료합니다.</p>
          <form action={signOut} className="mt-4">
            <button
              type="submit"
              className="rounded-full border border-line px-4 py-2 text-sm font-medium"
            >
              로그아웃
            </button>
          </form>
        </article>
      </section>
    </AppShell>
  );
}
