"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/shared/supabase/server";

import { getRequiredPersonalEventId } from "../list-recipients/data";

const deleteRecipientSchema = z.object({
  recipientId: z.string().uuid(),
});

export type DeleteRecipientState = {
  error?: string;
  success?: string;
};

export async function deleteRecipient(
  recipientId: string,
): Promise<DeleteRecipientState> {
  const parsed = deleteRecipientSchema.safeParse({ recipientId });

  if (!parsed.success) {
    return { error: "No pudimos identificar el invitado." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const eventId = await getRequiredPersonalEventId(supabase);
  const { data: deletedRows, error } = await supabase
    .from("invitation_recipients")
    .delete()
    .eq("id", parsed.data.recipientId)
    .eq("event_id", eventId)
    .select("id");

  if (error) {
    return { error: "No pudimos eliminar el invitado. Inténtalo nuevamente." };
  }

  if (!deletedRows?.length) {
    return { error: "No pudimos encontrar ese invitado en tu boda." };
  }

  revalidatePath("/admin/personal");
  revalidatePath("/admin/personal/invitados");
  revalidatePath("/admin/personal/confirmaciones");

  return { success: "Invitado eliminado." };
}
