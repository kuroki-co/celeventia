"use server";

import { createClient } from "@/shared/supabase/server";

import { suggestSongSchema } from "./schema";

export type SuggestSongState = {
  error?: string;
  success?: string;
  values?: {
    artist?: string;
    requesterName?: string;
    songTitle?: string;
  };
};

export async function suggestSong(
  _prevState: SuggestSongState,
  formData: FormData,
): Promise<SuggestSongState> {
  const values = {
    artist: getStringValue(formData, "artist"),
    requesterName: getStringValue(formData, "requesterName"),
    slug: getStringValue(formData, "slug"),
    songTitle: getStringValue(formData, "songTitle"),
  };
  const parsed = suggestSongSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa la sugerencia.",
      values,
    };
  }

  const supabase = await createClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, published_snapshot, status")
    .eq("slug", parsed.data.slug)
    .eq("status", "published")
    .maybeSingle<{
      id: string;
      published_snapshot: unknown;
      status: string;
    }>();

  if (eventError || !event || !isSongSuggestionsEnabled(event.published_snapshot)) {
    return {
      error: "La seccion de sugerencias no esta disponible.",
      values,
    };
  }

  const { data: isDuplicate, error: duplicateError } = await supabase.rpc(
    "song_suggestion_duplicate_exists",
    {
      p_artist: parsed.data.artist ?? null,
      p_event_id: event.id,
      p_song_title: parsed.data.songTitle,
    },
  );

  if (duplicateError) {
    return {
      error: "No pudimos validar la sugerencia. Intentalo nuevamente.",
      values,
    };
  }

  if (isDuplicate === true) {
    return {
      error: "Esa cancion ya fue sugerida.",
      values,
    };
  }

  const { error } = await supabase.from("event_song_suggestions").insert({
    artist: parsed.data.artist ?? null,
    event_id: event.id,
    requester_name: parsed.data.requesterName ?? null,
    song_title: parsed.data.songTitle,
  });

  if (error) {
    return {
      error: "No pudimos guardar la sugerencia. Intentalo nuevamente.",
      values,
    };
  }

  return { success: "Sugerencia guardada. Gracias por compartirla." };
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function isSongSuggestionsEnabled(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return false;
  }

  const content = (snapshot as { content?: unknown }).content;

  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return false;
  }

  return Boolean(
    (content as { songSuggestions?: { enabled?: boolean } }).songSuggestions
      ?.enabled,
  );
}
