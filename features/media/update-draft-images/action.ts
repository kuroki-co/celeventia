"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { stripTransientMediaUrls } from "@/features/media/media-content";
import type { WeddingInvitationContent } from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/server";

const focalSchema = z.object({
  cropZoom: z.coerce.number().min(1).max(3).default(1),
  eventId: z.string().uuid(),
  focalX: z.coerce.number().min(0).max(100),
  focalY: z.coerce.number().min(0).max(100),
});

const reorderSchema = z.object({
  eventId: z.string().uuid(),
  orderedIds: z.array(z.string().uuid()).min(1),
});

const galleryMetaSchema = z.object({
  alt: z.string().trim().max(120).optional(),
  eventId: z.string().uuid(),
  mediaId: z.string().uuid(),
});

export type DraftImageActionState = {
  error?: string;
  success?: string;
};

export async function updateHeroImageFocalPoint(
  _prevState: DraftImageActionState,
  formData: FormData,
): Promise<DraftImageActionState> {
  const parsed = focalSchema.safeParse({
    eventId: formData.get("eventId"),
    cropZoom: formData.get("cropZoom"),
    focalX: formData.get("focalX"),
    focalY: formData.get("focalY"),
  });

  if (!parsed.success) {
    return { error: "El encuadre no es valido." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return { error: "No pudimos confirmar el evento autorizado." };
  }

  if (!event.content.heroImage || typeof event.content.heroImage === "string") {
    return { error: "Sube una foto de portada antes de ajustar el encuadre." };
  }

  const content = {
    ...event.content,
    heroImage: {
      ...event.content.heroImage,
      cropZoom: parsed.data.cropZoom,
      focalX: parsed.data.focalX,
      focalY: parsed.data.focalY,
    },
  };

  const error = await updateDraftContent(supabase, event, content);

  if (error) {
    return { error };
  }

  return { success: "Encuadre guardado." };
}

export async function reorderGalleryImages(
  orderedIds: string[],
): Promise<DraftImageActionState> {
  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);
  const parsed = reorderSchema.safeParse({
    eventId: event.id,
    orderedIds,
  });

  if (!parsed.success) {
    return { error: "No pudimos ordenar la galería." };
  }

  const orderById = new Map(
    parsed.data.orderedIds.map((id, index) => [id, index]),
  );
  const content = {
    ...event.content,
    galleryImages: event.content.galleryImages?.map((image, index) => {
      if (typeof image === "string") {
        return image;
      }

      return {
        ...image,
        featured: (orderById.get(image.id ?? "") ?? index) < 4,
        order: orderById.get(image.id ?? "") ?? index,
      };
    }),
  };

  const error = await updateDraftContent(supabase, event, content);

  if (error) {
    return { error };
  }

  return { success: "Orden guardado." };
}

export async function updateGalleryImageMeta(
  _prevState: DraftImageActionState,
  formData: FormData,
): Promise<DraftImageActionState> {
  const parsed = galleryMetaSchema.safeParse({
    alt: formData.get("alt"),
    eventId: formData.get("eventId"),
    mediaId: formData.get("mediaId"),
  });

  if (!parsed.success) {
    return { error: "Revisa la descripción." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return { error: "No pudimos confirmar el evento autorizado." };
  }

  const content = {
    ...event.content,
    galleryImages: event.content.galleryImages?.map((image) => {
      if (typeof image === "string" || image.id !== parsed.data.mediaId) {
        return image;
      }

      return {
        ...image,
        alt: parsed.data.alt || "Foto de la galería",
      };
    }),
  };

  const error = await updateDraftContent(supabase, event, content);

  if (error) {
    return { error };
  }

  return { success: "Descripcion guardada." };
}

async function updateDraftContent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  event: Awaited<ReturnType<typeof getRequiredPersonalInvitationEvent>>,
  content: WeddingInvitationContent,
) {
  const { data, error } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: stripTransientMediaUrls(content),
    })
    .eq("id", event.id)
    .eq("draft_revision", event.draftRevision)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (!data) {
      return "Hay cambios más recientes. Recarga la página antes de volver a guardar.";
    }

    return "No pudimos guardar los cambios.";
  }

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/preview");

  return null;
}
