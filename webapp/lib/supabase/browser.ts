"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireEnv } from "@/lib/env";

export function createClient() {
  const env = requireEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
