"use server";

import { revalidatePath } from "next/cache";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { stripTransientMediaUrls } from "@/features/media/media-content";
import type { GalleryImage, HeroImage } from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/server";

import {
  allowedImageTypes,
  maxImageSizeBytes,
  uploadImageSchema,
} from "./schema";

export type UploadImageState = {
  error?: string;
  success?: string;
  mediaId?: string;
};

const bucket = "event-media";

export async function uploadInvitationImage(
  _prevState: UploadImageState,
  formData: FormData,
): Promise<UploadImageState> {
  const parsed = uploadImageSchema.safeParse({
    eventId: formData.get("eventId"),
    purpose: formData.get("purpose"),
  });
  const submittedFiles = formData
    .getAll("file")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (!parsed.success || !submittedFiles.length) {
    return { error: "Selecciona una imagen valida." };
  }

  const files =
    parsed.data.purpose === "gallery" ? submittedFiles : submittedFiles.slice(0, 1);

  if (files.some((file) => !allowedImageTypes.includes(file.type))) {
    return { error: "Usa solo imagenes JPG, PNG o WebP." };
  }

  if (files.some((file) => file.size <= 0 || file.size > maxImageSizeBytes)) {
    return { error: "Cada imagen debe pesar 5 MB o menos." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return { error: "No pudimos confirmar el evento autorizado." };
  }

  const uploadedMedia: Array<{
    bucket: string;
    id: string;
    objectPath: string;
  }> = [];

  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
    const folder =
      parsed.data.purpose === "invitation"
        ? "invitation"
        : parsed.data.purpose === "story"
          ? "story"
          : "gallery";
    const objectPath = `events/${event.id}/${folder}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      await cleanupUploadedMedia(supabase, uploadedMedia);

      return { error: "No pudimos subir la imagen." };
    }

    const { data, error } = await supabase
      .from("invitation_media")
      .insert({
        bucket,
        event_id: event.id,
        mime_type: file.type,
        object_path: objectPath,
        purpose: parsed.data.purpose,
        size_bytes: file.size,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      await supabase.storage.from(bucket).remove([objectPath]);
      await cleanupUploadedMedia(supabase, uploadedMedia);

      return { error: "No pudimos guardar los metadatos de la imagen." };
    }

    uploadedMedia.push({
      bucket,
      id: data.id,
      objectPath,
    });
  }

  const nextGalleryImages: GalleryImage[] = uploadedMedia.map(
    (mediaReference, index) => ({
      ...mediaReference,
      alt: "Foto de la galeria",
      featured: (event.content.galleryImages ?? []).length + index < 4,
      order: getNextGalleryOrder(event.content.galleryImages) + index,
    }),
  );

  const nextContent =
    parsed.data.purpose === "invitation"
      ? {
          ...event.content,
          heroImage: {
            ...uploadedMedia[0],
            focalX: 50,
            focalY: 50,
          } satisfies HeroImage,
        }
      : parsed.data.purpose === "gallery"
        ? {
            ...event.content,
            galleryImages: [
              ...(event.content.galleryImages ?? []),
              ...nextGalleryImages,
            ],
          }
        : event.content;

  const { error: updateError } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: stripTransientMediaUrls(nextContent),
    })
    .eq("id", event.id);

  if (updateError) {
    await cleanupUploadedMedia(supabase, uploadedMedia);

    return { error: "La imagen subio, pero no pudimos asociarla al borrador." };
  }

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/preview");

  return {
    mediaId: uploadedMedia[0]?.id,
    success: files.length === 1 ? "Imagen cargada." : "Imagenes cargadas.",
  };
}

function getNextGalleryOrder(images: GalleryImage[] | undefined) {
  const orders = (images ?? []).map((image, index) =>
    typeof image === "string" ? index : image.order ?? index,
  );

  return orders.length ? Math.max(...orders) + 1 : 0;
}

async function cleanupUploadedMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media: Array<{ bucket: string; id: string; objectPath: string }>,
) {
  for (const item of media) {
    await supabase.from("invitation_media").delete().eq("id", item.id);
    await supabase.storage.from(item.bucket).remove([item.objectPath]);
  }
}
