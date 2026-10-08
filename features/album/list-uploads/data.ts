import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import type { createClient } from "@/shared/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AlbumUploadRow = {
  id: string;
  bucket: string;
  caption: string | null;
  created_at: string;
  object_path: string;
  status: "pending" | "approved" | "rejected";
  uploader_name: string | null;
};

export async function getAlbumUploads(supabase: SupabaseServerClient) {
  const event = await getRequiredPersonalInvitationEvent(supabase);
  const { data, error } = await supabase
    .from("event_album_uploads")
    .select("id, bucket, object_path, uploader_name, caption, status, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .returns<AlbumUploadRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return Promise.all(
    (data ?? []).map(async (upload) => {
      const { data: signed } = await supabase.storage
        .from(upload.bucket)
        .createSignedUrl(upload.object_path, 60 * 60);

      return {
        caption: upload.caption,
        createdAt: upload.created_at,
        id: upload.id,
        status: upload.status,
        uploaderName: upload.uploader_name,
        url: signed?.signedUrl ?? null,
      };
    }),
  );
}
