"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { stripTransientMediaUrls } from "@/features/media/media-content";
import type { MediaAudioReference, WeddingInvitationContent } from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/server";

import { allowedAudioTypes, maxAudioSizeBytes } from "./limits";

export type PreparedAudioUpload = {
  bucket: string;
  objectPath: string;
};

export type UploadAudioState = {
  error?: string;
  success?: string;
  mediaId?: string;
};

const bucket = "event-media";

const allowedAudioTypeSchema = z.enum(
  allowedAudioTypes as [string, ...string[]],
);

const prepareAudioUploadSchema = z.object({
  eventId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(240),
  mimeType: allowedAudioTypeSchema,
  sizeBytes: z.number().int().positive().max(maxAudioSizeBytes),
});

const finalizeAudioUploadSchema = z.object({
  eventId: z.string().uuid(),
  mimeType: allowedAudioTypeSchema,
  objectPath: z.string().trim().min(1),
  sizeBytes: z.number().int().positive().max(maxAudioSizeBytes),
});

export async function prepareInvitationAudioUpload(input: {
  eventId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<PreparedAudioUpload | { error: string }> {
  const parsed = prepareAudioUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Selecciona un archivo MP3 de hasta 10 MB." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return { error: "No pudimos confirmar el evento autorizado." };
  }

  return {
    bucket,
    objectPath: `events/${event.id}/music/${crypto.randomUUID()}.mp3`,
  };
}

export async function finalizeInvitationAudioUpload(
  input: z.input<typeof finalizeAudioUploadSchema>,
): Promise<UploadAudioState> {
  const parsed = finalizeAudioUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "No pudimos confirmar la subida del MP3." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);

    return { error: "No pudimos confirmar el evento autorizado." };
  }

  const verification = await verifyUploadedObject(supabase, event.id, parsed.data);

  if (verification) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);

    return { error: verification };
  }

  const { data: insertedMedia, error: insertError } = await supabase
    .from("invitation_media")
    .insert({
      bucket,
      event_id: event.id,
      mime_type: parsed.data.mimeType,
      object_path: parsed.data.objectPath,
      purpose: "music",
      size_bytes: parsed.data.sizeBytes,
      sort_order: 0,
    })
    .select("id, object_path")
    .single<{ id: string; object_path: string }>();

  if (insertError || !insertedMedia) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);

    return { error: "El MP3 subio, pero no pudimos guardar sus metadatos." };
  }

  const audio: MediaAudioReference = {
    bucket,
    id: insertedMedia.id,
    objectPath: insertedMedia.object_path,
  };
  const nextContent: WeddingInvitationContent = {
    ...event.content,
    music: {
      ...(event.content.music ?? {}),
      audio,
      enabled: Boolean(event.content.music?.enabled),
      volume: event.content.music?.volume ?? 0.45,
    },
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
    await cleanupInsertedMedia(supabase, audio);

    return {
      error: updateError
        ? "El MP3 subio, pero no pudimos asociarlo al borrador."
        : "Hay cambios mas recientes. Recarga la pagina antes de volver a subir musica.",
    };
  }

  revalidatePath("/admin/personal/invitacion/contenido");
  revalidatePath("/admin/personal/invitacion/preview");
  revalidatePath("/admin/personal/invitacion/publicar");
  revalidatePath(`/i/${event.slug}`);

  return {
    mediaId: audio.id,
    success: "MP3 cargado.",
  };
}

async function verifyUploadedObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  upload: {
    mimeType: string;
    objectPath: string;
    sizeBytes: number;
  },
) {
  const folder = `events/${eventId}/music`;
  const expectedPrefix = `${folder}/`;

  if (!upload.objectPath.startsWith(expectedPrefix)) {
    return "La ruta de Storage no pertenece a esta boda.";
  }

  const fileName = upload.objectPath.slice(expectedPrefix.length);

  if (!fileName || fileName.includes("/")) {
    return "La ruta de Storage no es valida.";
  }

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1,
    search: fileName,
  });

  if (error) {
    return "No pudimos verificar el MP3 subido.";
  }

  const object = data?.find((item) => item.name === fileName);
  const metadata = object?.metadata as
    | {
        mimetype?: string;
        size?: number;
      }
    | undefined;

  if (!object || !metadata) {
    return "No encontramos el MP3 subido en Storage.";
  }

  if (metadata.size !== upload.sizeBytes || metadata.size > maxAudioSizeBytes) {
    return "El peso verificado del MP3 no coincide con el permitido.";
  }

  if (metadata.mimetype !== upload.mimeType) {
    return "El formato verificado del MP3 no coincide con el permitido.";
  }

  return null;
}

async function cleanupStorageObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectPath: string,
) {
  await supabase.storage.from(bucket).remove([objectPath]);
}

async function cleanupInsertedMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  audio: MediaAudioReference,
) {
  if (audio.id) {
    await supabase.from("invitation_media").delete().eq("id", audio.id);
  }

  if (audio.objectPath) {
    await cleanupStorageObject(supabase, audio.objectPath);
  }
}
