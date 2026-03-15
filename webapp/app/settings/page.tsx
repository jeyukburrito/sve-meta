import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();

  return (
    <AppShell title="설정" description="계정, 덱 관리, 내보내기 기능을 모읍니다.">
      <section className="space-y-4">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">카드게임 관리</h2>
          <p className="mt-2 text-sm text-neutral-600">
            원하는 카드게임 이름을 직접 등록하고, 덱과 경기 기록을 게임별로 분류합니다.
          </p>
          <Link
            href="/settings/games"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            카드게임 관리 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">덱 관리</h2>
          <p className="mt-2 text-sm text-neutral-600">
            자주 쓰는 덱 이름을 등록해 입력 속도를 높입니다.
          </p>
          <Link
            href="/settings/decks"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            덱 관리 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">CSV 내보내기</h2>
          <p className="mt-2 text-sm text-neutral-600">
            기록 목록 화면에서 현재 필터 기준으로 CSV 파일을 바로 내려받을 수 있습니다.
          </p>
          <Link
            href="/matches"
            className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-medium"
          >
            기록 목록 열기
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">세션</h2>
          <p className="mt-2 text-sm text-neutral-600">
            공유 테스트 중에도 계정 분리를 유지하기 위해 로그아웃은 서버에서 처리합니다.
          </p>
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
