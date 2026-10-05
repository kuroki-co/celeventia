"use server";

import { revalidatePath } from "next/cache";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
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
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { error: "Selecciona una imagen valida." };
  }

  if (!allowedImageTypes.includes(file.type)) {
    return { error: "Usa JPG, PNG o WebP." };
  }

  if (file.size <= 0 || file.size > maxImageSizeBytes) {
    return { error: "La imagen debe pesar 5 MB o menos." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);

  if (event.id !== parsed.data.eventId) {
    return { error: "No pudimos confirmar el evento autorizado." };
  }

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
    return { error: "No pudimos guardar los metadatos de la imagen." };
  }

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/preview");

  return { mediaId: data.id, success: "Imagen cargada." };
}
