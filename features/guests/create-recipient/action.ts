"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";

import { getRequiredPersonalEventId } from "../list-recipients/data";
import {
  getRecipientFieldErrors,
  getRecipientFormValues,
  type RecipientFieldErrors,
  type RecipientFormValues,
} from "../recipient-form";
import { normalizePhone } from "./phone";
import { createRecipientSchema } from "./schema";

export type CreateRecipientState = {
  error?: string;
  fieldErrors?: RecipientFieldErrors;
  success?: string;
  values?: RecipientFormValues;
};

export async function createRecipient(
  _prevState: CreateRecipientState,
  formData: FormData,
): Promise<CreateRecipientState> {
  const values = getRecipientFormValues(formData);
  const parsed = createRecipientSchema.safeParse({
    displayName: values.displayName,
    maxGuests: values.maxGuests,
    phone: values.phone,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      fieldErrors: getRecipientFieldErrors(parsed.error.flatten().fieldErrors),
      values,
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
  const normalizedPhone = normalizePhone(parsed.data.phone ?? "");

  const { error } = await supabase.from("invitation_recipients").insert({
    display_name: parsed.data.displayName,
    event_id: eventId,
    max_guests: parsed.data.maxGuests,
    normalized_phone: normalizedPhone,
    phone: parsed.data.phone?.trim() || null,
  });

  if (error) {
    return {
      error: "No pudimos crear el invitado. Inténtalo nuevamente.",
      values,
    };
  }

  revalidatePath("/admin/personal/invitados");

  return {
    success: "Invitado añadido.",
  };
}
