"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";
import { getRequiredPersonalEventId } from "../list-recipients/data";

export async function markRecipientShared(recipientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const eventId = await getRequiredPersonalEventId(supabase);
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("status, published_snapshot")
    .eq("id", eventId)
    .single<{ published_snapshot: unknown; status: string }>();

  if (eventError || !event?.published_snapshot || event.status !== "published") {
    return {
      error: "Publica la invitación antes de compartir enlaces.",
    };
  }

  const { error } = await supabase
    .from("invitation_recipients")
    .update({
      share_status: "shared",
      shared_at: new Date().toISOString(),
    })
    .eq("id", recipientId)
    .eq("event_id", eventId)
    .in("share_status", ["not_shared", "shared"]);

  if (error) {
    return { error: "No se pudo registrar el estado compartido." };
  }

  revalidatePath("/admin/personal/invitados");

  return { success: "WhatsApp abierto." };
}
