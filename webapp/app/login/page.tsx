import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/env";

import { signInWithGoogle } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, string> = {
  config_missing: "Supabase 환경 변수가 설정되지 않았습니다.",
  oauth_start_failed: "Google 로그인 시작에 실패했습니다.",
  oauth_callback_failed: "로그인 콜백 처리에 실패했습니다.",
  origin_missing: "현재 배포 주소를 확인할 수 없습니다.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const errorParam = typeof params?.error === "string" ? params.error : undefined;
  const nextParam = typeof params?.next === "string" ? params.next : "/dashboard";
  const errorMessage = errorParam ? errorMessages[errorParam] : undefined;

  return (
    <AppShell
      title="로그인"
      description="개인 데이터는 사용자별로 분리되며, Google 로그인만 허용합니다."
    >
      <section className="max-w-lg rounded-3xl border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Google 로그인</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          경기 기록과 통계는 계정별로 분리됩니다. QA 계정을 추가하더라도 다른 사용자의 데이터를
          보지 못하도록 RLS를 기준으로 구성합니다.
        </p>
        {!isSupabaseConfigured ? (
          <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            `.env.local`에 Supabase 설정이 없어 로그인 버튼을 비활성화했습니다.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
        <form action={signInWithGoogle} className="mt-6">
          <input type="hidden" name="next" value={nextParam} />
          <button
            type="submit"
            disabled={!isSupabaseConfigured}
            className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            Google로 로그인
          </button>
        </form>
        <Link
          href="/"
          className="mt-4 inline-flex text-sm font-medium text-neutral-600 underline-offset-4 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </section>
    </AppShell>
  );
}
