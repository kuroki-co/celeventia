"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";

export async function markRecipientShared(recipientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { error } = await supabase
    .from("invitation_recipients")
    .update({
      share_status: "shared",
      shared_at: new Date().toISOString(),
    })
    .eq("id", recipientId)
    .not("share_status", "in", "(confirmed,declined)");

  if (error) {
    throw new Error("No se pudo registrar el estado compartido.");
  }

  revalidatePath("/admin/personal/invitados");
}
