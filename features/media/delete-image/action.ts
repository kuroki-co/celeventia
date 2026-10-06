"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import {
  collectMediaReferences,
  stripTransientMediaUrls,
} from "@/features/media/media-content";
import { createClient } from "@/shared/supabase/server";
import type { WeddingInvitationContent } from "@/invitation/renderer/types";

const schema = z.object({
  mediaId: z.string().uuid(),
});

export async function deleteInvitationImage(mediaId: string) {
  const parsed = schema.safeParse({ mediaId });

  if (!parsed.success) {
    return { error: "Imagen inválida." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);
  const { data, error } = await supabase
    .from("invitation_media")
    .select("id, bucket, object_path, is_published")
    .eq("id", parsed.data.mediaId)
    .eq("event_id", event.id)
    .maybeSingle<{
      bucket: string;
      id: string;
      is_published: boolean;
      object_path: string;
    }>();

  if (error || !data) {
    return { error: "No pudimos encontrar la imagen." };
  }

  const nextContent = {
    ...event.content,
    galleryImages: event.content.galleryImages?.filter((image) =>
      typeof image === "string" ? true : image.id !== data.id,
    ),
    heroImage:
      typeof event.content.heroImage === "object" &&
      event.content.heroImage?.id === data.id
        ? null
        : event.content.heroImage,
    locations: event.content.locations?.map((location) =>
      typeof location.image === "object" && location.image?.id === data.id
        ? {
            ...location,
            image: undefined,
          }
        : location,
    ),
  };

  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: stripTransientMediaUrls(nextContent),
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedEvent) {
    if (!updatedEvent) {
      return {
        error:
          "Hay cambios más recientes. Recarga la página antes de volver a quitar la imagen.",
      };
    }

    return { error: "No pudimos quitar la imagen del borrador." };
  }

  if (
    data.is_published ||
    (await isReferencedByPublishedSnapshot(supabase, event.id, data.id))
  ) {
    revalidatePath("/admin/personal/invitacion/fotografias");
    revalidatePath("/admin/personal/invitacion/datos");
    revalidatePath("/admin/personal/invitacion/contenido");
    revalidatePath("/admin/personal/invitacion/preview");

    return { success: "Imagen quitada del borrador." };
  }

  const { error: deleteError } = await supabase
    .from("invitation_media")
    .delete()
    .eq("id", data.id)
    .eq("event_id", event.id);

  if (deleteError) {
    return { error: "No pudimos eliminar los metadatos." };
  }

  const { error: storageError } = await supabase.storage
    .from(data.bucket)
    .remove([data.object_path]);

  if (storageError) {
    return {
      error:
        "La imagen se quitó del borrador, pero no pudimos eliminar el archivo de Storage.",
    };
  }

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/datos");
  revalidatePath("/admin/personal/invitacion/contenido");
  revalidatePath("/admin/personal/invitacion/preview");

  return { success: "Imagen eliminada." };
}

async function isReferencedByPublishedSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  mediaId: string,
) {
  const { data } = await supabase
    .from("events")
    .select("published_snapshot")
    .eq("id", eventId)
    .maybeSingle<{ published_snapshot: unknown }>();

  const snapshot = data?.published_snapshot;

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return false;
  }

  const content = (snapshot as { content?: unknown }).content;

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return false;
  }

  return collectMediaReferences(content as WeddingInvitationContent).some(
    (media) => media.id === mediaId,
  );
}
