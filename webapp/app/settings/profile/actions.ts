"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function deleteAccount() {
  const user = await requireUser();
  const admin = createAdminClient();
  const supabase = await createClient();

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    redirect("/settings/profile?error=delete_failed");
  }

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });

  await supabase.auth.signOut();
  redirect("/login?message=account_deleted");
}
