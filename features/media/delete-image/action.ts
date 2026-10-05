"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { createClient } from "@/shared/supabase/server";

const schema = z.object({
  mediaId: z.string().uuid(),
});

export async function deleteInvitationImage(mediaId: string) {
  const parsed = schema.safeParse({ mediaId });

  if (!parsed.success) {
    return { error: "Imagen invalida." };
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

  if (data.is_published) {
    return {
      error:
        "La imagen pertenece a una version publicada. Reemplazala en el borrador antes de eliminarla.",
    };
  }

  const { error: deleteError } = await supabase
    .from("invitation_media")
    .delete()
    .eq("id", data.id)
    .eq("event_id", event.id);

  if (deleteError) {
    return { error: "No pudimos eliminar los metadatos." };
  }

  await supabase.storage.from(data.bucket).remove([data.object_path]);

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/preview");

  return { success: "Imagen eliminada." };
}
