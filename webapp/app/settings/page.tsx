import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();

  return (
    <AppShell title="설정">
      <section className="space-y-4">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">카드게임 관리</h2>
          <Link
            href="/settings/games"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            카드게임 관리 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">덱 관리</h2>
          <Link
            href="/settings/decks"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            덱 관리 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">CSV 내보내기</h2>
          <Link
            href="/matches"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            기록 목록 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">로그아웃</h2>
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
