"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/shared/supabase/server";

import { normalizePhone } from "../create-recipient/phone";
import { createRecipientSchema } from "../create-recipient/schema";
import { getRequiredPersonalEventId } from "../list-recipients/data";

const updateRecipientSchema = createRecipientSchema.extend({
  recipientId: z.string().uuid(),
});

export type UpdateRecipientState = {
  error?: string;
  success?: string;
};

type RecipientWithRsvp = {
  id: string;
  rsvps:
    | {
        attendee_count: number;
        response: "confirmed" | "declined";
      }
    | Array<{
        attendee_count: number;
        response: "confirmed" | "declined";
      }>
    | null;
};

export async function updateRecipient(
  _prevState: UpdateRecipientState,
  formData: FormData,
): Promise<UpdateRecipientState> {
  const parsed = updateRecipientSchema.safeParse({
    displayName: formData.get("displayName"),
    maxGuests: formData.get("maxGuests"),
    phone: formData.get("phone"),
    recipientId: formData.get("recipientId"),
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

  const eventId = await getRequiredPersonalEventId(supabase);
  const { data: recipient, error: recipientError } = await supabase
    .from("invitation_recipients")
    .select("id, rsvps(response, attendee_count)")
    .eq("id", parsed.data.recipientId)
    .eq("event_id", eventId)
    .single<RecipientWithRsvp>();

  if (recipientError || !recipient) {
    return {
      error: "No pudimos encontrar ese invitado en tu boda.",
    };
  }

  const confirmedRsvp = Array.isArray(recipient.rsvps)
    ? recipient.rsvps.find((rsvp) => rsvp.response === "confirmed")
    : recipient.rsvps?.response === "confirmed"
      ? recipient.rsvps
      : null;
  const confirmedGuests = confirmedRsvp?.attendee_count ?? 0;

  if (parsed.data.maxGuests < confirmedGuests) {
    return {
      error: `No puedes bajar a ${parsed.data.maxGuests} pases porque ya hay ${confirmedGuests} asistentes confirmados.`,
    };
  }

  const normalizedPhone = normalizePhone(parsed.data.phone ?? "");
  const { error } = await supabase
    .from("invitation_recipients")
    .update({
      display_name: parsed.data.displayName,
      max_guests: parsed.data.maxGuests,
      normalized_phone: normalizedPhone,
      phone: parsed.data.phone?.trim() || null,
    })
    .eq("id", parsed.data.recipientId)
    .eq("event_id", eventId);

  if (error) {
    return {
      error: "No pudimos actualizar el invitado. Intentalo nuevamente.",
    };
  }

  revalidatePath("/admin/personal/invitados");
  revalidatePath("/admin/personal/confirmaciones");

  return {
    success: "Invitado actualizado.",
  };
}
