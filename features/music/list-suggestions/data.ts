import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import type { createClient } from "@/shared/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type SongSuggestionRow = {
  id: string;
  artist: string | null;
  created_at: string;
  requester_name: string | null;
  song_title: string;
};

export async function getSongSuggestions(supabase: SupabaseServerClient) {
  const event = await getRequiredPersonalInvitationEvent(supabase);
  const { data, error } = await supabase
    .from("event_song_suggestions")
    .select("id, song_title, artist, requester_name, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .returns<SongSuggestionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((suggestion) => ({
    artist: suggestion.artist,
    createdAt: suggestion.created_at,
    id: suggestion.id,
    requesterName: suggestion.requester_name,
    songTitle: suggestion.song_title,
  }));
}
