"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDeckSchema, toggleDeckSchema } from "@/lib/validation/deck";

function withMessage(type: "error" | "message", value: string) {
  return `/settings/decks?${type}=${encodeURIComponent(value)}`;
}

export async function createDeck(formData: FormData) {
  const user = await requireUser();
  const parsed = createDeckSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "덱 이름 또는 입력값을 확인해 주세요."));
  }

  try {
    await prisma.deck.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        color: parsed.data.color || null,
        memo: parsed.data.memo || null,
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
        isUniqueViolation ? "같은 이름의 덱이 이미 있습니다." : "덱 저장에 실패했습니다.",
      ),
    );
  }

  revalidatePath("/settings/decks");
  revalidatePath("/matches/new");
  redirect(withMessage("message", "덱을 추가했습니다."));
}

export async function toggleDeckState(formData: FormData) {
  const user = await requireUser();
  const parsed = toggleDeckSchema.safeParse({
    deckId: formData.get("deckId"),
    nextState: formData.get("nextState"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "덱 상태 변경 요청이 올바르지 않습니다."));
  }

  await prisma.deck.updateMany({
    where: {
      id: parsed.data.deckId,
      userId: user.id,
    },
    data: {
      isActive: parsed.data.nextState === "active",
    },
  });

  revalidatePath("/settings/decks");
  revalidatePath("/matches/new");
  redirect(
    withMessage(
      "message",
      parsed.data.nextState === "active"
        ? "덱을 다시 활성화했습니다."
        : "덱을 비활성화했습니다.",
    ),
  );
}
