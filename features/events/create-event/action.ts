"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";

import { completeOnboardingSchema, createEventSchema } from "./schema";

export type CreateEventState = {
  error?: string;
};

export async function createPersonalEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const parsed = createEventSchema.safeParse({
    partnerOneName: getStringValue(formData, "partnerOneName") ?? "",
    partnerTwoName: getStringValue(formData, "partnerTwoName") ?? "",
    nameOrder: getStringValue(formData, "nameOrder"),
    hasDate: getStringValue(formData, "hasDate"),
    eventDate: getStringValue(formData, "eventDate"),
    eventTimezone: getStringValue(formData, "eventTimezone") || "America/Lima",
    city: getStringValue(formData, "city"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { error } = await supabase.rpc("create_personal_event", {
    p_city: parsed.data.city || null,
    p_event_date:
      parsed.data.hasDate === "yes" ? parsed.data.eventDate || null : null,
    p_event_timezone: parsed.data.eventTimezone || "America/Lima",
    p_name_order: parsed.data.nameOrder,
    p_partner_one_name: parsed.data.partnerOneName,
    p_partner_two_name: parsed.data.partnerTwoName,
  });

  if (error) {
    return {
      error:
        error.message === "PARTNER_NAMES_REQUIRED"
          ? "Ingresa ambos nombres."
          : "No pudimos crear la invitacion. Intentalo nuevamente.",
    };
  }

  revalidatePath("/admin/personal");
  revalidatePath("/admin/personal/onboarding");
  redirect("/admin/personal/onboarding");
}

export async function completeOnboarding(formData: FormData) {
  const parsed = completeOnboardingSchema.safeParse({
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  await supabase
    .from("events")
    .update({ is_configured: true })
    .eq("id", parsed.data.eventId);

  revalidatePath("/admin/personal");
  revalidatePath("/admin/personal/invitacion/preview");
  redirect("/admin/personal/invitacion/preview");
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}
