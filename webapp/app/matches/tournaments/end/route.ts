import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const tournamentSessionId = String(formData.get("tournamentSessionId") || "");

  if (!tournamentSessionId) {
    return NextResponse.redirect(new URL("/matches?error=tournament_not_found", request.url));
  }

  await prisma.tournamentSession.updateMany({
    where: {
      id: tournamentSessionId,
      userId: user.id,
      endedAt: null,
    },
    data: {
      endedAt: new Date(),
    },
  });

  revalidatePath("/matches");
  revalidatePath("/matches/new");
  revalidatePath("/dashboard");

  return NextResponse.redirect(new URL("/matches?message=tournament_ended", request.url));
}
