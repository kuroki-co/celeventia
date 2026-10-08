"use server";

import { z } from "zod";

import { createClient } from "@/shared/supabase/server";

const bucket = "event-media";
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxImageSizeBytes = 5 * 1024 * 1024;

const prepareSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z.enum(allowedImageTypes),
  sizeBytes: z.number().int().positive().max(maxImageSizeBytes),
  slug: z.string().trim().min(1).max(120),
});

const finalizeSchema = z.object({
  caption: z.string().trim().max(240).optional(),
  mimeType: z.enum(allowedImageTypes),
  objectPath: z.string().trim().min(1),
  sizeBytes: z.number().int().positive().max(maxImageSizeBytes),
  slug: z.string().trim().min(1).max(120),
  uploaderName: z.string().trim().min(1).max(120),
});

export async function prepareAlbumPhotoUpload(input: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  slug: string;
}) {
  const parsed = prepareSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Selecciona una imagen JPG, PNG o WebP de hasta 5 MB." };
  }

  const supabase = await createClient();
  const event = await getPublishedAlbumEvent(supabase, parsed.data.slug);

  if (!event) {
    return { error: "El album no esta disponible." };
  }

  const rateLimitMessage = await getAlbumUploadLimitMessage(
    supabase,
    event.id,
  );

  if (rateLimitMessage) {
    return { error: rateLimitMessage };
  }

  return {
    bucket,
    objectPath: `events/${event.id}/guest-album/${crypto.randomUUID()}.${getExtension(
      parsed.data.mimeType,
    )}`,
  };
}

export async function finalizeAlbumPhotoUpload(input: {
  caption?: string;
  mimeType: string;
  objectPath: string;
  sizeBytes: number;
  slug: string;
  uploaderName?: string;
}) {
  const parsed = finalizeSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "No pudimos confirmar la foto." };
  }

  const supabase = await createClient();
  const event = await getPublishedAlbumEvent(supabase, parsed.data.slug);

  if (!event) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);
    return { error: "El album no esta disponible." };
  }

  const expectedPrefix = `events/${event.id}/guest-album/`;

  if (!parsed.data.objectPath.startsWith(expectedPrefix)) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);
    return { error: "La ruta de la foto no pertenece a esta boda." };
  }

  const rateLimitMessage = await getAlbumUploadLimitMessage(
    supabase,
    event.id,
  );

  if (rateLimitMessage) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);
    return { error: rateLimitMessage };
  }

  const verification = await verifyUploadedObject(supabase, parsed.data);

  if (verification) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);
    return { error: verification };
  }

  const { error } = await supabase.from("event_album_uploads").insert({
    bucket,
    caption: parsed.data.caption || null,
    event_id: event.id,
    mime_type: parsed.data.mimeType,
    object_path: parsed.data.objectPath,
    size_bytes: parsed.data.sizeBytes,
    uploader_name: parsed.data.uploaderName,
  });

  if (error) {
    await cleanupStorageObject(supabase, parsed.data.objectPath);
    return { error: "La foto subio, pero no pudimos registrarla." };
  }

  return { success: "Foto recibida. La revisaremos antes de mostrarla." };
}

async function getPublishedAlbumEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("id, published_snapshot, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<{
      id: string;
      published_snapshot: unknown;
      status: string;
    }>();

  if (error || !data || !isAlbumEnabled(data.published_snapshot)) {
    return null;
  }

  return data;
}

function isAlbumEnabled(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return false;
  }

  const content = (snapshot as { content?: unknown }).content;

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return false;
  }

  return Boolean(
    (content as { collaborativeAlbum?: { enabled?: boolean } })
      .collaborativeAlbum?.enabled,
  );
}

async function getAlbumUploadLimitMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
) {
  const { data, error } = await supabase.rpc("album_upload_limit_status", {
    p_event_id: eventId,
  });

  if (error || typeof data !== "string") {
    return "No pudimos validar la disponibilidad del album.";
  }

  if (data === "hourly_limit") {
    return "El album recibio muchas fotos en la ultima hora. Intentalo mas tarde.";
  }

  if (data === "daily_limit") {
    return "El album recibio muchas fotos hoy. Intentalo manana.";
  }

  if (data !== "ok") {
    return "El album no esta disponible.";
  }

  return null;
}

async function verifyUploadedObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  upload: {
    mimeType: string;
    objectPath: string;
    sizeBytes: number;
  },
) {
  const folder = upload.objectPath.split("/").slice(0, -1).join("/");
  const fileName = upload.objectPath.split("/").at(-1) ?? "";
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1,
    search: fileName,
  });

  if (error) {
    return "No pudimos verificar la foto subida.";
  }

  const object = data?.find((item) => item.name === fileName);
  const metadata = object?.metadata as
    | {
        mimetype?: string;
        size?: number;
      }
    | undefined;

  if (!object || !metadata) {
    return "No encontramos la foto subida.";
  }

  if (metadata.size !== upload.sizeBytes || metadata.size > maxImageSizeBytes) {
    return "El peso verificado no coincide con el permitido.";
  }

  if (metadata.mimetype !== upload.mimeType) {
    return "El formato verificado no coincide con el permitido.";
  }

  return null;
}

async function cleanupStorageObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  objectPath: string,
) {
  await supabase.storage.from(bucket).remove([objectPath]);
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
