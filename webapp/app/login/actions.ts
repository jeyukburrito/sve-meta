"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeRedirectPath, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured) {
    redirect("/login?error=config_missing");
  }

  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const nextPath = getSafeRedirectPath(formData.get("next")?.toString());

  if (!origin) {
    redirect("/login?error=origin_missing");
  }

  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_start_failed");
  }

  redirect(data.url);
}

export async function signOut() {
  if (!isSupabaseConfigured) {
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
