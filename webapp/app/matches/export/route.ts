import { NextResponse } from "next/server";

import { syncUserProfile } from "@/lib/auth";
import { buildCsv } from "@/lib/csv";
import { listMatchesForUser, parseMatchFilters } from "@/lib/matches";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await syncUserProfile(user);

  const url = new URL(request.url);
  const filters = parseMatchFilters(url.searchParams);
  const rows = await listMatchesForUser(user.id, filters);

  const csv = buildCsv(
    [
      "date",
      "game",
      "my_deck",
      "opponent_deck",
      "format",
      "result",
      "play_order",
      "play_order_choice",
      "memo",
    ],
    rows.map((row) => [
      row.playedAt.toISOString().slice(0, 10),
      row.myDeck.game.name,
      row.myDeck.name,
      row.opponentDeckName,
      row.matchFormat.toUpperCase(),
      row.isMatchWin ? "win" : "lose",
      row.playOrder === "first" ? "first" : "second",
      row.didChoosePlayOrder ? "O" : "X",
      row.memo ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="match-results.csv"',
      "Cache-Control": "no-store",
    },
  });
}
