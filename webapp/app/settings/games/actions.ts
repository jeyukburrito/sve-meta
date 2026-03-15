"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGameSchema, deleteGameSchema, updateGameSchema } from "@/lib/validation/game";

function withMessage(type: "error" | "message", value: string) {
  return `/settings/games?${type}=${encodeURIComponent(value)}`;
}

export async function createGame(formData: FormData) {
  const user = await requireUser();
  const parsed = createGameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "카드게임 이름을 확인해 주세요."));
  }

  try {
    await prisma.game.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
      },
    });
  } catch (error) {
    const isUniqueViolation =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002";

    redirect(
      withMessage(
        "error",
        isUniqueViolation ? "같은 이름의 카드게임이 이미 있습니다." : "카드게임 저장에 실패했습니다.",
      ),
    );
  }

  revalidatePath("/settings/games");
  revalidatePath("/settings/decks");
  revalidatePath("/matches/new");
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  redirect(withMessage("message", "카드게임 카테고리를 추가했습니다."));
}

export async function updateGame(formData: FormData) {
  const user = await requireUser();
  const parsed = updateGameSchema.safeParse({
    gameId: formData.get("gameId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "카드게임 이름을 확인해 주세요."));
  }

  try {
    const result = await prisma.game.updateMany({
      where: {
        id: parsed.data.gameId,
        userId: user.id,
      },
      data: {
        name: parsed.data.name,
      },
    });

    if (result.count === 0) {
      redirect(withMessage("error", "수정할 카드게임을 찾을 수 없습니다."));
    }
  } catch (error) {
    const isUniqueViolation =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002";

    redirect(
      withMessage(
        "error",
        isUniqueViolation ? "같은 이름의 카드게임이 이미 있습니다." : "카드게임 수정에 실패했습니다.",
      ),
    );
  }

  revalidatePath("/settings/games");
  revalidatePath("/settings/decks");
  revalidatePath("/matches/new");
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  redirect(withMessage("message", "카드게임 이름을 수정했습니다."));
}

export async function deleteGame(formData: FormData) {
  const user = await requireUser();
  const parsed = deleteGameSchema.safeParse({
    gameId: formData.get("gameId"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "삭제할 카드게임 정보가 올바르지 않습니다."));
  }

  const game = await prisma.game.findFirst({
    where: {
      id: parsed.data.gameId,
      userId: user.id,
    },
    include: {
      _count: {
        select: {
          decks: true,
        },
      },
    },
  });

  if (!game) {
    redirect(withMessage("error", "삭제할 카드게임을 찾을 수 없습니다."));
  }

  if (game._count.decks > 0) {
    redirect(withMessage("error", "연결된 덱이 있는 카드게임은 삭제할 수 없습니다."));
  }

  await prisma.game.delete({
    where: {
      id: game.id,
    },
  });

  revalidatePath("/settings/games");
  revalidatePath("/settings/decks");
  revalidatePath("/matches/new");
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  redirect(withMessage("message", "카드게임 카테고리를 삭제했습니다."));
}
