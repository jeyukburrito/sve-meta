import { cache } from "react";
import { redirect } from "next/navigation";

import type { User as SupabaseUser } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase 인증 유저를 Prisma users 테이블에 동기화한다.
 *
 * - createMany + skipDuplicates 대신 upsert를 사용:
 *   Transaction Pooler(pgbouncer) 환경에서 불필요한 INSERT 시도를 줄인다.
 * - email/name이 OAuth 재인증 등으로 바뀔 수 있으므로 update도 수행한다.
 */
export async function ensureUserProfile(user: SupabaseUser) {
  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;

  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? "",
      name,
    },
    update: {
      email: user.email ?? "",
      name,
    },
  });
}

export function getUserDisplayInfo(user: SupabaseUser) {
  return {
    name: (user.user_metadata?.name ?? user.user_metadata?.full_name ?? null) as string | null,
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
    email: user.email ?? null,
  };
}

/**
 * 현재 요청의 인증된 유저를 반환한다.
 *
 * react.cache()로 래핑되어 있어 동일 요청(렌더 트리) 내에서
 * requireUser()를 여러 번 호출해도 Supabase 세션 조회 + DB 동기화는
 * 단 한 번만 실행된다. (서버리스 connection 절약)
 */
export const requireUser = cache(async function requireUser() {
  if (!isSupabaseConfigured) {
    redirect("/login?error=config_missing");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureUserProfile(user);

  return user;
});
