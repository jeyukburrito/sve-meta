import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { SubmitButton } from "@/components/submit-button";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createTag, deleteTag } from "./actions";

export const dynamic = "force-dynamic";

type TagsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const user = await requireUser();
  const display = getUserDisplayInfo(user);
  const params = searchParams ? await searchParams : undefined;
  const errorMessage = typeof params?.error === "string" ? params.error : undefined;
  const tags = await prisma.tag.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          matches: true,
        },
      },
    },
  });

  return (
    <AppShell
      title="태그 관리"
      headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-lg font-semibold">태그 추가</h2>
          <p className="mt-2 text-sm text-muted">
            기록에 붙일 태그를 만들어 분류를 정리합니다.
          </p>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : null}
          <form action={createTag} className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              태그 이름
              <input
                name="name"
                type="text"
                required
                maxLength={30}
                className="rounded-2xl border border-line bg-surface px-4 py-3 text-ink"
                placeholder="예: 선공, 지역예선"
              />
            </label>
            <div>
              <SubmitButton label="태그 추가" />
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">등록된 태그</h2>
            </div>
            <span className="rounded-full bg-paper px-3 py-1 text-sm font-medium">
              총 {tags.length}개
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {tags.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
                아직 등록된 태그가 없습니다.
              </div>
            ) : null}
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex flex-col gap-3 rounded-2xl border border-line px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <span className="rounded-full border border-line bg-paper px-3 py-1 text-sm font-medium">
                    #{tag.name}
                  </span>
                  <p className="mt-2 text-sm text-muted">연결된 기록 {tag._count.matches}건</p>
                </div>
                <form action={deleteTag}>
                  <input type="hidden" name="tagId" value={tag.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-danger/30 px-4 py-2 text-sm font-medium text-danger"
                  >
                    태그 삭제
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
