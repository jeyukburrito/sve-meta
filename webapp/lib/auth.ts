import { redirect } from "next/navigation";

import type { User as SupabaseUser } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function ensureUserProfile(user: SupabaseUser) {
  await prisma.user.createMany({
    data: [
      {
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
      },
    ],
    skipDuplicates: true,
  });
}

export function getUserDisplayInfo(user: SupabaseUser) {
  return {
    name: (user.user_metadata?.name ?? user.user_metadata?.full_name ?? null) as string | null,
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
    email: user.email ?? null,
  };
}

export async function requireUser() {
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
}
