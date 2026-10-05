"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/shared/supabase/server";
import { evaluatePublicationReadiness } from "../evaluate-readiness/evaluatePublicationReadiness";
import { getRequiredPersonalInvitationEvent } from "../get-personal-invitation/data";

export type PublishInvitationState = {
  success?: string;
  error?: string;
};

export async function publishInvitation(): Promise<PublishInvitationState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitas iniciar sesion." };
  }

  const event = await getRequiredPersonalInvitationEvent(supabase);
  const readiness = evaluatePublicationReadiness(event);

  if (!readiness.ready) {
    return { error: "La invitacion todavia tiene requisitos pendientes." };
  }

  const snapshot = {
    content: event.content,
    coupleName: event.coupleName,
    dateLabel: event.dateLabel,
    mainInvitationMessage: event.mainInvitationMessage,
    mainLocationName: event.mainLocationName,
    mainLocationTime: event.mainLocationTime,
    paletteId: event.paletteId,
    revision: event.draftRevision,
    themeId: event.themeId,
  };

  const { error } = await supabase
    .from("events")
    .update({
      published_revision: event.draftRevision,
      published_snapshot: snapshot,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  if (error) {
    return { error: "No pudimos publicar la invitacion." };
  }

  revalidatePath("/admin/personal/invitacion/publicar");
  revalidatePath("/admin/personal/invitados");
  revalidatePath(`/i/${event.slug}`);

  return { success: "Invitacion publicada." };
}
