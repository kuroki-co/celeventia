"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/shared/supabase/server";
import {
  collectMediaReferences,
  stripTransientMediaUrls,
} from "@/features/media/media-content";
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
    return { error: "Necesitas iniciar sesión." };
  }

  const event = await getRequiredPersonalInvitationEvent(supabase);
  const readiness = evaluatePublicationReadiness(event);

  if (!readiness.ready) {
    return { error: "La invitación todavía tiene requisitos pendientes." };
  }

  const content = stripTransientMediaUrls(event.content);
  const snapshot = {
    content,
    coupleName: event.coupleName,
    dateLabel: event.dateLabel,
    mainInvitationMessage: event.mainInvitationMessage,
    mainLocationName: event.mainLocationName,
    mainLocationTime: event.mainLocationTime,
    paletteId: event.paletteId,
    revision: event.draftRevision,
    themeId: event.themeId,
  };

  const mediaIds = collectMediaReferences(content).map((media) => media.id);

  if (mediaIds.length) {
    const { error: mediaError } = await supabase
      .from("invitation_media")
      .update({ is_published: true })
      .eq("event_id", event.id)
      .in("id", mediaIds);

    if (mediaError) {
      return { error: "No pudimos proteger las fotos para publicar." };
    }
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      published_revision: event.draftRevision,
      published_snapshot: snapshot,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    return { error: "No pudimos publicar la invitación." };
  }

  if (!data) {
    return {
      error:
        "Hay cambios más recientes. Recarga la página antes de volver a publicar.",
    };
  }

  revalidatePath("/admin/personal/invitacion/publicar");
  revalidatePath("/admin/personal/invitados");
  revalidatePath(`/i/${event.slug}`);

  return { success: "Invitación publicada." };
}
