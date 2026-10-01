"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/shared/supabase/server";

import { submitRsvpSchema } from "./schema";

export type SubmitRsvpState = {
  error?: string;
  success?: string;
};

export async function submitRsvp(
  _prevState: SubmitRsvpState,
  formData: FormData,
): Promise<SubmitRsvpState> {
  const names = formData
    .getAll("attendeeNames")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const parsed = submitRsvpSchema.safeParse({
    slug: formData.get("slug"),
    token: formData.get("token"),
    response: formData.get("response"),
    attendeeCount: formData.get("attendeeCount") ?? 0,
    attendeeNames: names,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa tu respuesta.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_public_rsvp", {
    p_slug: parsed.data.slug,
    p_token: parsed.data.token,
    p_response: parsed.data.response,
    p_attendee_count: parsed.data.attendeeCount,
    p_attendee_names: parsed.data.attendeeNames,
  });

  if (error) {
    return {
      error:
        error.message === "ATTENDEE_COUNT_EXCEEDS_PASSES"
          ? "La cantidad de asistentes supera los pases disponibles."
          : "No pudimos guardar tu respuesta. Inténtalo nuevamente.",
    };
  }

  revalidatePath(`/i/${parsed.data.slug}`);

  return {
    success: "Tu respuesta fue guardada.",
  };
}
