import { AppShell } from "@/components/app-shell";
import { HeaderActions } from "@/components/header-actions";
import { getUserDisplayInfo, requireUser } from "@/lib/auth";
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
  const display = getUserDisplayInfo(authUser);
  const profile = await prisma.user.findUnique({
    where: {
      id: authUser.id,
    },
  });

  return (
    <AppShell title="프로필" headerRight={<HeaderActions avatarUrl={display.avatarUrl} name={display.name} />}>
      <section className="mx-auto max-w-sm">
        <article className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-accent/10 text-accent">
              {display.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={display.avatarUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-bold">
                  {display.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{profile?.name ?? display.name ?? "미설정"}</h2>
            <p className="mt-1 text-sm text-muted">{profile?.email ?? authUser.email ?? "-"}</p>
          </div>
          <dl className="mt-6 border-t border-line pt-4">
            <div className="flex items-center justify-between py-2 text-sm">
              <dt className="text-muted">가입일</dt>
              <dd className="font-medium">{formatDate(profile?.createdAt ?? null)}</dd>
            </div>
          </dl>
        </article>
      </section>
    </AppShell>
  );
}
