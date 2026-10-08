"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

const updateAlbumUploadStatusSchema = z.object({
  uploadId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export async function updateAlbumUploadStatus(input: {
  uploadId: string;
  status: "approved" | "rejected";
}) {
  const parsed = updateAlbumUploadStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "No pudimos identificar la foto." };
  }

  const supabase = await createClient();
  const event = await getRequiredPersonalInvitationEvent(supabase);
  const { data, error } = await supabase
    .from("event_album_uploads")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.uploadId)
    .eq("event_id", event.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    return {
      error: error
        ? "No pudimos actualizar la foto."
        : "La foto ya no esta disponible.",
    };
  }

  revalidatePath("/admin/personal/confirmaciones");

  return {
    success:
      parsed.data.status === "approved"
        ? "Foto aprobada."
        : "Foto rechazada.",
  };
}
