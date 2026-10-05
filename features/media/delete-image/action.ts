"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { stripTransientMediaUrls } from "@/features/media/media-content";
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
  };

  const { error: updateError } = await supabase
    .from("events")
    .update({
      draft_revision: event.draftRevision + 1,
      invitation_content: stripTransientMediaUrls(nextContent),
    })
    .eq("id", event.id);

  if (updateError) {
    return { error: "No pudimos quitar la imagen del borrador." };
  }

  if (data.is_published) {
    revalidatePath("/admin/personal/invitacion/fotografias");
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

  await supabase.storage.from(data.bucket).remove([data.object_path]);

  revalidatePath("/admin/personal/invitacion/fotografias");
  revalidatePath("/admin/personal/invitacion/preview");

  return { success: "Imagen eliminada." };
}
