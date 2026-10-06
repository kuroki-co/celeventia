"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";

import { completeOnboardingSchema, createEventSchema } from "./schema";

export type CreateEventState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string | undefined>;
};

export type CompleteOnboardingState = {
  error?: string;
};

export async function createPersonalEvent(
  _prevState: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const values = {
    partnerOneName: getStringValue(formData, "partnerOneName") ?? "",
    partnerTwoName: getStringValue(formData, "partnerTwoName") ?? "",
    nameOrder: getStringValue(formData, "nameOrder"),
    hasDate: getStringValue(formData, "hasDate"),
    eventDate: getStringValue(formData, "eventDate"),
    eventTimezone: "America/Lima",
    city: getStringValue(formData, "city"),
  };
  const parsed = createEventSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      fieldErrors: getFieldErrors(parsed.error),
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
          : "No pudimos crear la invitación. Inténtalo nuevamente.",
      values,
    };
  }

  revalidatePath("/admin/personal");
  revalidatePath("/admin/personal/onboarding");
  redirect("/admin/personal/onboarding");
}

export async function completeOnboarding(
  _prevState: CompleteOnboardingState,
  formData: FormData,
): Promise<CompleteOnboardingState> {
  const parsed = completeOnboardingSchema.safeParse({
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    return { error: "No pudimos confirmar tu invitación." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("events")
    .update({ is_configured: true })
    .eq("id", parsed.data.eventId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      error: "No pudimos finalizar el primer ingreso. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/admin/personal");
  revalidatePath("/admin/personal/invitacion/preview");
  redirect("/admin/personal/invitacion/preview");
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function getFieldErrors(error: {
  issues: Array<{ message: string; path: Array<PropertyKey> }>;
}) {
  return error.issues.reduce<Record<string, string>>((errors, issue) => {
    const [field] = issue.path;

    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }

    return errors;
  }, {});
}
