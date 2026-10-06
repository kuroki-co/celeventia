"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { stripTransientMediaUrls } from "@/features/media/media-content";
import type {
  GalleryImage,
  HeroImage,
  InvitationLocation,
  MediaImageReference,
} from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/server";

import {
  allowedImageTypes,
  maxGalleryImages,
  maxImageSizeBytes,
} from "./limits";

export type UploadPurpose = "gallery" | "invitation" | "location";

export type PreparedImageUpload = {
  bucket: string;
  objectPath: string;
};

export type UploadImageState = {
  error?: string;
  success?: string;
  mediaId?: string;
};

const bucket = "event-media";

const allowedImageTypeSchema = z.enum(
  allowedImageTypes as [string, ...string[]],
);

const prepareUploadSchema = z.object({
  eventId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(240),
  locationKind: z.enum(["Ceremonia", "Recepcion"]).optional(),
  mimeType: allowedImageTypeSchema,
  purpose: z.enum(["invitation", "gallery", "location"]),
  sizeBytes: z.number().int().positive().max(maxImageSizeBytes),
});

const finalizeUploadSchema = z.object({
  eventId: z.string().uuid(),
  locationKind: z.enum(["Ceremonia", "Recepcion"]).optional(),
  purpose: z.enum(["invitation", "gallery", "location"]),
  uploads: z
    .array(
      z.object({
        mimeType: allowedImageTypeSchema,
        objectPath: z.string().trim().min(1),
        sizeBytes: z.number().int().positive().max(maxImageSizeBytes),
      }),
    )
    .min(1)
    .max(maxGalleryImages),
}).superRefine((value, context) => {
  if (value.purpose === "location" && !value.locationKind) {
    context.addIssue({
      code: "custom",
      message: "Selecciona el lugar de la imagen.",
      path: ["locationKind"],
    });
  }

  if (value.purpose === "location" && value.uploads.length !== 1) {
    context.addIssue({
      code: "custom",
      message: "Sube una sola imagen para el lugar.",
      path: ["uploads"],
    });
  }
});

type FinalizeUploadInput = z.input<typeof finalizeUploadSchema>;

export async function prepareInvitationImageUpload(input: {
  eventId: string;
  fileName: string;
  locationKind?: "Ceremonia" | "Recepcion";
  mimeType: string;
  purpose: UploadPurpose;
  sizeBytes: number;
}): Promise<PreparedImageUpload | { error: string }> {
  const parsed = prepareUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Selecciona una imagen JPG, PNG o WebP de hasta 5 MB." };
  }

  if (parsed.data.purpose === "location" && !parsed.data.locationKind) {
    return { error: "Selecciona el lugar de la imagen." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return { error: "No pudimos confirmar el evento autorizado." };
  }

  if (
    parsed.data.purpose === "gallery" &&
    getDraftGalleryCount(event.content.galleryImages) >= maxGalleryImages
  ) {
    return {
      error: `La galería admite hasta ${maxGalleryImages} fotos.`,
    };
  }

  return {
    bucket,
    objectPath: `events/${event.id}/${getPurposeFolder(parsed.data.purpose, parsed.data.locationKind)}/${crypto.randomUUID()}.${getExtension(parsed.data.mimeType)}`,
  };
}

export async function finalizeInvitationImageUpload(
  input: FinalizeUploadInput,
): Promise<UploadImageState> {
  const parsed = finalizeUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "No pudimos confirmar la subida de imágenes." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    await cleanupStorageObjects(supabase, parsed.data.uploads);

    return { error: "No pudimos confirmar el evento autorizado." };
  }

  if (parsed.data.purpose === "gallery") {
    const currentCount = getDraftGalleryCount(event.content.galleryImages);

    if (currentCount + parsed.data.uploads.length > maxGalleryImages) {
      await cleanupStorageObjects(supabase, parsed.data.uploads);

      return {
        error: `La galería admite hasta ${maxGalleryImages} fotos. Quita una antes de subir más.`,
      };
    }
  }

  for (const upload of parsed.data.uploads) {
    const verification = await verifyUploadedObject(
      supabase,
      event.id,
      parsed.data.purpose,
      parsed.data.locationKind,
      upload,
    );

    if (verification) {
      await cleanupStorageObjects(supabase, parsed.data.uploads);

      return { error: verification };
    }
  }

  const nextOrder = getNextGalleryOrder(event.content.galleryImages);
  const { data: insertedMedia, error: insertError } = await supabase
    .from("invitation_media")
    .insert(
      parsed.data.uploads.map((upload, index) => ({
        bucket,
        event_id: event.id,
        mime_type: upload.mimeType,
        object_path: upload.objectPath,
        purpose:
          parsed.data.purpose === "location"
            ? `location:${parsed.data.locationKind}`
            : parsed.data.purpose,
        size_bytes: upload.sizeBytes,
        sort_order: nextOrder + index,
      })),
    )
    .select("id, object_path")
    .returns<Array<{ id: string; object_path: string }>>();

  if (insertError || !insertedMedia?.length) {
    await cleanupStorageObjects(supabase, parsed.data.uploads);

    return { error: "La imagen subió, pero no pudimos guardar sus metadatos." };
  }

  const mediaByPath = new Map(
    insertedMedia.map((media) => [media.object_path, media.id]),
  );
  const uploadedMedia = parsed.data.uploads.map((upload) => ({
    bucket,
    id: mediaByPath.get(upload.objectPath) ?? "",
    objectPath: upload.objectPath,
  }));

  const nextContent =
    parsed.data.purpose === "invitation"
      ? {
          ...event.content,
          heroImage: {
            ...uploadedMedia[0],
            cropZoom: 1,
            focalX: 50,
            focalY: 50,
          } satisfies HeroImage,
        }
      : parsed.data.purpose === "gallery"
        ? {
          ...event.content,
          galleryImages: [
            ...(event.content.galleryImages ?? []),
            ...uploadedMedia.map(
              (mediaReference, index): GalleryImage => ({
                ...mediaReference,
                alt: "Foto de la galería",
                featured:
                  getDraftGalleryCount(event.content.galleryImages) + index < 4,
                order: nextOrder + index,
              }),
            ),
          ],
        }
        : {
            ...event.content,
            locations: getLocationsWithImage(
              event.content.locations,
              parsed.data.locationKind ?? "Ceremonia",
              {
                ...uploadedMedia[0],
                alt: `${parsed.data.locationKind ?? "Lugar"} de la boda`,
              },
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
    await cleanupInsertedMedia(supabase, uploadedMedia);

    return {
      error: updateError
        ? "La imagen subió, pero no pudimos asociarla al borrador."
        : "Hay cambios más recientes. Recarga la página antes de volver a subir fotos.",
    };
  }

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/datos");
  revalidatePath("/admin/personal/invitacion/contenido");
  revalidatePath("/admin/personal/invitacion/preview");

  return {
    mediaId: uploadedMedia[0]?.id,
    success:
      parsed.data.uploads.length === 1
        ? "Imagen cargada."
        : "Imágenes cargadas.",
  };
}

function getDraftGalleryCount(images: GalleryImage[] | undefined) {
  return (images ?? []).filter((image) => {
    if (typeof image === "string") {
      return Boolean(image);
    }

    return Boolean(image.id || image.objectPath || image.url);
  }).length;
}

function getNextGalleryOrder(images: GalleryImage[] | undefined) {
  const orders = (images ?? []).map((image, index) =>
    typeof image === "string" ? index : image.order ?? index,
  );

  return orders.length ? Math.max(...orders) + 1 : 0;
}

function getPurposeFolder(
  purpose: UploadPurpose,
  locationKind?: "Ceremonia" | "Recepcion",
) {
  if (purpose === "invitation") {
    return "invitation";
  }

  if (purpose === "location") {
    return `locations/${locationKind === "Recepcion" ? "reception" : "ceremony"}`;
  }

  return "gallery";
}

function getExtension(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function verifyUploadedObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  purpose: UploadPurpose,
  locationKind: "Ceremonia" | "Recepcion" | undefined,
  upload: {
    mimeType: string;
    objectPath: string;
    sizeBytes: number;
  },
) {
  const folder = `events/${eventId}/${getPurposeFolder(purpose, locationKind)}`;
  const expectedPrefix = `${folder}/`;

  if (!upload.objectPath.startsWith(expectedPrefix)) {
    return "La ruta de Storage no pertenece a esta boda.";
  }

  const fileName = upload.objectPath.slice(expectedPrefix.length);

  if (!fileName || fileName.includes("/")) {
    return "La ruta de Storage no es válida.";
  }

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1,
    search: fileName,
  });

  if (error) {
    return "No pudimos verificar la imagen subida.";
  }

  const object = data?.find((item) => item.name === fileName);
  const metadata = object?.metadata as
    | {
        mimetype?: string;
        size?: number;
      }
    | undefined;

  if (!object || !metadata) {
    return "No encontramos la imagen subida en Storage.";
  }

  if (metadata.size !== upload.sizeBytes || metadata.size > maxImageSizeBytes) {
    return "El peso verificado de la imagen no coincide con el permitido.";
  }

  if (metadata.mimetype !== upload.mimeType) {
    return "El formato verificado de la imagen no coincide con el permitido.";
  }

  return null;
}

function getLocationsWithImage(
  locations: InvitationLocation[] | undefined,
  locationKind: "Ceremonia" | "Recepcion",
  image: MediaImageReference,
): InvitationLocation[] {
  const existingLocations = locations?.length
    ? locations
    : [{ kind: locationKind, name: "", enabled: true }];
  const hasTarget = existingLocations.some(
    (location) => location.kind === locationKind,
  );
  const nextLocations = hasTarget
    ? existingLocations
    : [...existingLocations, { kind: locationKind, name: "", enabled: true }];

  return nextLocations.map((location) =>
    location.kind === locationKind
      ? {
          ...location,
          image,
        }
      : location,
  );
}

async function cleanupStorageObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  uploads: Array<{ objectPath: string }>,
) {
  await supabase.storage
    .from(bucket)
    .remove(uploads.map((upload) => upload.objectPath));
}

async function cleanupInsertedMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media: Array<{ id: string; objectPath: string }>,
) {
  const mediaIds = media.map((item) => item.id).filter(Boolean);

  if (mediaIds.length) {
    await supabase.from("invitation_media").delete().in("id", mediaIds);
  }

  await cleanupStorageObjects(supabase, media);
}
