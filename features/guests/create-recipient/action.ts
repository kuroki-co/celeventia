"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";

import { ensurePersonalEventId } from "../list-recipients/data";
import { normalizePhone } from "./phone";
import { createRecipientSchema } from "./schema";

export type CreateRecipientState = {
  error?: string;
  success?: string;
};

export async function createRecipient(
  _prevState: CreateRecipientState,
  formData: FormData,
): Promise<CreateRecipientState> {
  const parsed = createRecipientSchema.safeParse({
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    maxGuests: formData.get("maxGuests"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const eventId = await ensurePersonalEventId(supabase);
  const normalizedPhone = normalizePhone(parsed.data.phone ?? "");

  const { error } = await supabase.from("invitation_recipients").insert({
    event_id: eventId,
    display_name: parsed.data.displayName,
    phone: parsed.data.phone?.trim() || null,
    normalized_phone: normalizedPhone,
    max_guests: parsed.data.maxGuests,
  });

  if (error) {
    return {
      error: "No pudimos crear el destinatario. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/admin/personal/invitados");

  return {
    success: "Destinatario creado.",
  };
}
