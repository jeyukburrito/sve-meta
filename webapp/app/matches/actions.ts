"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchResultSchema } from "@/lib/validation/match";

function matchesRedirect(type: "error" | "message", value: string) {
  return `/matches?${type}=${encodeURIComponent(value)}`;
}

function newMatchRedirect(type: "error" | "message", value: string) {
  return `/matches/new?${type}=${encodeURIComponent(value)}`;
}

function editRedirect(matchId: string, type: "error" | "message", value: string) {
  return `/matches/${matchId}/edit?${type}=${encodeURIComponent(value)}`;
}

function dateRangeForDay(value: string) {
  const start = new Date(`${value}T00:00:00`);
  const end = new Date(`${value}T00:00:00`);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

async function ensureOwnedActiveDeck(userId: string, deckId: string) {
  return prisma.deck.findFirst({
    where: {
      id: deckId,
      userId,
      isActive: true,
    },
    select: {
      id: true,
      gameId: true,
    },
  });
}

function deriveScore(matchFormat: "bo1" | "bo3", result: "win" | "lose") {
  if (matchFormat === "bo1") {
    return result === "win" ? { wins: 1, losses: 0 } : { wins: 0, losses: 1 };
  }

  return result === "win" ? { wins: 2, losses: 1 } : { wins: 1, losses: 2 };
}

function parseMatchForm(formData: FormData) {
  return matchResultSchema.safeParse({
    playedAt: formData.get("playedAt"),
    gameId: formData.get("gameId"),
    myDeckId: formData.get("myDeckId"),
    tournamentSessionId: formData.get("tournamentSessionId") || undefined,
    opponentDeckName: formData.get("opponentDeckName"),
    eventCategory: formData.get("eventCategory"),
    tournamentPhase: formData.get("tournamentPhase") || undefined,
    playOrder: formData.get("playOrder"),
    didChoosePlayOrder: formData.get("didChoosePlayOrder"),
    matchFormat: formData.get("matchFormat"),
    result: formData.get("result"),
    memo: formData.get("memo"),
    tagIds: [],
  });
}

async function resolveTournamentSession(params: {
  userId: string;
  myDeckId: string;
  playedAt: string;
  eventCategory: "shop" | "cs";
  tournamentSessionId?: string;
}) {
  const { userId, myDeckId, playedAt, eventCategory, tournamentSessionId } = params;
  const { start } = dateRangeForDay(playedAt);

  if (tournamentSessionId) {
    const existing = await prisma.tournamentSession.findFirst({
      where: {
        id: tournamentSessionId,
        userId,
        myDeckId,
        eventCategory,
      },
      select: {
        id: true,
        endedAt: true,
      },
    });

    if (!existing) {
      return { ok: false as const, error: "이어지는 대회 세션을 찾을 수 없습니다." as const };
    }

    if (existing.endedAt) {
      return {
        ok: false as const,
        error: "종료된 대회입니다. 기존 기록은 수정할 수 있지만 새 라운드는 추가할 수 없습니다." as const,
      };
    }

    return { ok: true as const, sessionId: existing.id };
  }

  const created = await prisma.tournamentSession.create({
    data: {
      userId,
      myDeckId,
      eventCategory,
      playedOn: start,
    },
    select: {
      id: true,
    },
  });

  return { ok: true as const, sessionId: created.id };
}

async function buildNextTournamentRedirect(params: {
  sessionId: string;
  userId: string;
  eventCategory: "shop" | "cs";
  playedAt: string;
  gameId: string;
  myDeckId: string;
  tournamentPhase: "swiss" | "elimination";
}) {
  const { sessionId, userId, eventCategory, playedAt, gameId, myDeckId, tournamentPhase } = params;
  const phaseCount = await prisma.matchResult.count({
    where: {
      userId,
      tournamentSessionId: sessionId,
      tournamentPhase,
    },
  });

  const sp = new URLSearchParams({
    message: "record_created",
    event: eventCategory,
    date: playedAt,
    gameId,
    deckId: myDeckId,
    round: String(phaseCount + 1),
    phase: tournamentPhase,
    tournamentId: sessionId,
  });

  return `/matches/new?${sp.toString()}`;
}

export async function createMatchResult(formData: FormData) {
  const user = await requireUser();
  const parsed = parseMatchForm(formData);

  if (!parsed.success) {
    redirect(newMatchRedirect("error", "입력값을 확인해 주세요."));
  }

  const ownedDeck = await ensureOwnedActiveDeck(user.id, parsed.data.myDeckId);

  if (!ownedDeck) {
    redirect(newMatchRedirect("error", "선택한 덱을 찾을 수 없거나 비활성 상태입니다."));
  }

  if (ownedDeck.gameId !== parsed.data.gameId) {
    redirect(newMatchRedirect("error", "선택한 카드 게임과 덱이 일치하지 않습니다."));
  }

  const score = deriveScore(parsed.data.matchFormat, parsed.data.result);
  let tournamentSessionId: string | null = null;

  if (parsed.data.eventCategory === "shop" || parsed.data.eventCategory === "cs") {
    const resolved = await resolveTournamentSession({
      userId: user.id,
      myDeckId: parsed.data.myDeckId,
      playedAt: parsed.data.playedAt,
      eventCategory: parsed.data.eventCategory,
      tournamentSessionId: parsed.data.tournamentSessionId,
    });

    if (!resolved.ok) {
      redirect(newMatchRedirect("error", resolved.error));
    }

    tournamentSessionId = resolved.sessionId;
  }

  await prisma.matchResult.create({
    data: {
      userId: user.id,
      myDeckId: parsed.data.myDeckId,
      tournamentSessionId,
      playedAt: new Date(parsed.data.playedAt),
      opponentDeckName: parsed.data.opponentDeckName,
      eventCategory: parsed.data.eventCategory,
      tournamentPhase:
        parsed.data.eventCategory === "shop" || parsed.data.eventCategory === "cs"
          ? parsed.data.tournamentPhase ?? "swiss"
          : null,
      playOrder: parsed.data.playOrder,
      didChoosePlayOrder: parsed.data.didChoosePlayOrder,
      matchFormat: parsed.data.matchFormat,
      wins: score.wins,
      losses: score.losses,
      isMatchWin: parsed.data.result === "win",
      memo: parsed.data.memo || null,
    },
  });

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/matches/new");

  // 대회 모드: 저장 후 다음 라운드 입력으로 리다이렉트
  if (
    tournamentSessionId &&
    (parsed.data.eventCategory === "shop" || parsed.data.eventCategory === "cs")
  ) {
    redirect(
      await buildNextTournamentRedirect({
        sessionId: tournamentSessionId,
        userId: user.id,
        eventCategory: parsed.data.eventCategory,
        playedAt: parsed.data.playedAt,
        gameId: parsed.data.gameId,
        myDeckId: parsed.data.myDeckId,
        tournamentPhase: parsed.data.tournamentPhase ?? "swiss",
      }),
    );
  }

  redirect("/matches?message=record_created");
}

export async function updateMatchResult(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") || "");
  const parsed = parseMatchForm(formData);

  if (!matchId) {
    redirect(matchesRedirect("error", "수정할 경기 ID가 없습니다."));
  }

  if (!parsed.success) {
    redirect(editRedirect(matchId, "error", "입력값을 확인해 주세요."));
  }

  const [ownedDeck, existingMatch] = await Promise.all([
    ensureOwnedActiveDeck(user.id, parsed.data.myDeckId),
    prisma.matchResult.findFirst({
      where: {
        id: matchId,
        userId: user.id,
      },
      select: {
        id: true,
        tournamentSessionId: true,
      },
    }),
  ]);

  if (!existingMatch) {
    redirect(matchesRedirect("error", "수정할 대전 기록을 찾을 수 없습니다."));
  }

  if (!ownedDeck) {
    redirect(editRedirect(matchId, "error", "선택한 덱을 찾을 수 없거나 비활성 상태입니다."));
  }

  if (ownedDeck.gameId !== parsed.data.gameId) {
    redirect(editRedirect(matchId, "error", "선택한 카드 게임과 덱이 일치하지 않습니다."));
  }

  const score = deriveScore(parsed.data.matchFormat, parsed.data.result);
  let tournamentSessionId = existingMatch.tournamentSessionId;

  if (parsed.data.eventCategory === "shop" || parsed.data.eventCategory === "cs") {
    const resolved = await resolveTournamentSession({
      userId: user.id,
      myDeckId: parsed.data.myDeckId,
      playedAt: parsed.data.playedAt,
      eventCategory: parsed.data.eventCategory,
      tournamentSessionId: parsed.data.tournamentSessionId ?? existingMatch.tournamentSessionId ?? undefined,
    });

    if (!resolved.ok) {
      redirect(editRedirect(matchId, "error", resolved.error));
    }

    tournamentSessionId = resolved.sessionId;
  } else {
    tournamentSessionId = null;
  }

  const result = await prisma.matchResult.updateMany({
    where: {
      id: matchId,
      userId: user.id,
    },
    data: {
      myDeckId: parsed.data.myDeckId,
      tournamentSessionId,
      playedAt: new Date(parsed.data.playedAt),
      opponentDeckName: parsed.data.opponentDeckName,
      eventCategory: parsed.data.eventCategory,
      tournamentPhase:
        parsed.data.eventCategory === "shop" || parsed.data.eventCategory === "cs"
          ? parsed.data.tournamentPhase ?? "swiss"
          : null,
      playOrder: parsed.data.playOrder,
      didChoosePlayOrder: parsed.data.didChoosePlayOrder,
      matchFormat: parsed.data.matchFormat,
      wins: score.wins,
      losses: score.losses,
      isMatchWin: parsed.data.result === "win",
      memo: parsed.data.memo || null,
    },
  });

  if (result.count === 0) {
    redirect(matchesRedirect("error", "수정 권한이 없거나 대전 기록을 찾을 수 없습니다."));
  }

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}/edit`);
  revalidatePath("/dashboard");
  redirect("/matches?message=record_updated");
}

export async function deleteMatchResult(formData: FormData) {
  const user = await requireUser();
  const matchId = String(formData.get("matchId") || "");

  if (!matchId) {
    redirect(matchesRedirect("error", "삭제할 경기 ID가 없습니다."));
  }

  await prisma.matchResult.deleteMany({
    where: {
      id: matchId,
      userId: user.id,
    },
  });

  revalidatePath("/matches");
  revalidatePath("/dashboard");
  redirect("/matches?message=record_deleted");
}
