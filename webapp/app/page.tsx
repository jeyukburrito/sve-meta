import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <section className="max-w-xl rounded-[2rem] border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Match Tracker
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">
          섀도우버스 이볼브 개인 전적 관리
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-600">
          대전 결과를 빠르게 기록하고, 덱별 승률과 선공/후공 통계를 모바일에서 바로 확인하는
          개인용 웹앱입니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
          >
            대시보드 보기
          </Link>
          <Link
            href="/matches/new"
            className="rounded-full border border-line px-5 py-3 text-sm font-semibold"
          >
            결과 입력 시작
          </Link>
        </div>
      </section>
    </main>
  );
}
