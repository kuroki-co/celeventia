import type { createClient } from "@/shared/supabase/server";

import type { PublicInvitationData } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PublicInvitationRow = {
  event_slug: string;
  couple_name: string;
  event_date_label: string;
  theme_id: string;
  palette_id: string;
  main_location_name: string;
  main_location_time: string;
  main_invitation_message: string;
  display_name: string;
  max_guests: number;
  response: "confirmed" | "declined" | null;
  attendee_count: number | null;
  attendee_names: unknown;
};

type PublicEventRow = {
  event_slug: string;
  couple_name: string;
  event_date_label: string;
  theme_id: string;
  palette_id: string;
  main_location_name: string;
  main_location_time: string;
  main_invitation_message: string;
};

export async function getPublicInvitation(
  supabase: SupabaseServerClient,
  slug: string,
  token?: string,
): Promise<PublicInvitationData | null> {
  if (!token) {
    return getPublicEvent(supabase, slug);
  }

  const { error: trackError } = await supabase.rpc("track_invitation_open", {
    p_slug: slug,
    p_token: token,
  });

  if (trackError) {
    throw new Error(trackError.message);
  }

  const { data, error } = await supabase
    .rpc("resolve_public_invitation_render", {
      p_slug: slug,
      p_token: token,
    });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as PublicInvitationRow[] | null;
  const row = rows?.[0];

  if (!row) {
    return null;
  }

  return {
    event: {
      slug: row.event_slug,
      coupleName: row.couple_name,
      dateLabel: row.event_date_label,
      themeId: row.theme_id,
      paletteId: row.palette_id,
      mainLocationName: row.main_location_name,
      mainLocationTime: row.main_location_time,
      mainInvitationMessage: row.main_invitation_message,
    },
    recipient: {
      displayName: row.display_name,
      maxGuests: row.max_guests,
    },
    rsvp: {
      response: row.response,
      attendeeCount: row.attendee_count ?? 1,
      attendeeNames: parseAttendeeNames(row.attendee_names),
    },
  };
}

async function getPublicEvent(
  supabase: SupabaseServerClient,
  slug: string,
): Promise<PublicInvitationData | null> {
  const { data, error } = await supabase.rpc("resolve_public_event", {
    p_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as PublicEventRow[] | null;
  const row = rows?.[0];

  if (!row) {
    return null;
  }

  return {
    event: {
      slug: row.event_slug,
      coupleName: row.couple_name,
      dateLabel: row.event_date_label,
      themeId: row.theme_id,
      paletteId: row.palette_id,
      mainLocationName: row.main_location_name,
      mainLocationTime: row.main_location_time,
      mainInvitationMessage: row.main_invitation_message,
    },
    recipient: null,
    rsvp: null,
  };
}

function parseAttendeeNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
