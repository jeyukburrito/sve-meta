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

  await prisma.user.delete({
    where: {
      id: user.id,
    },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    throw new Error(`Failed to delete auth user: ${error.message}`);
  }

  await supabase.auth.signOut();
  redirect("/login?message=account_deleted");
}
