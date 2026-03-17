"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTagSchema, deleteTagSchema } from "@/lib/validation/tag";

function withMessage(type: "error" | "message", value: string) {
  return `/settings/tags?${type}=${encodeURIComponent(value)}`;
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function createTag(formData: FormData) {
  const user = await requireUser();
  const parsed = createTagSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "태그 이름을 확인해 주세요."));
  }

  try {
    await prisma.tag.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
      },
    });
  } catch (error) {
    redirect(
      withMessage(
        "error",
        isUniqueViolation(error) ? "같은 이름의 태그가 이미 있습니다." : "태그 추가에 실패했습니다.",
      ),
    );
  }

  revalidatePath("/settings");
  revalidatePath("/settings/tags");
  revalidatePath("/matches");
  revalidatePath("/matches/new");
  redirect(withMessage("message", "태그를 추가했습니다."));
}

export async function deleteTag(formData: FormData) {
  const user = await requireUser();
  const parsed = deleteTagSchema.safeParse({
    tagId: formData.get("tagId"),
  });

  if (!parsed.success) {
    redirect(withMessage("error", "삭제할 태그 정보가 올바르지 않습니다."));
  }

  const tag = await prisma.tag.findFirst({
    where: {
      id: parsed.data.tagId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!tag) {
    redirect(withMessage("error", "삭제할 태그를 찾을 수 없습니다."));
  }

  await prisma.tag.delete({
    where: {
      id: tag.id,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/tags");
  revalidatePath("/matches");
  revalidatePath("/matches/new");
  redirect(withMessage("message", "태그를 삭제했습니다."));
}
