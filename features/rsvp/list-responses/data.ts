import type { createClient } from "@/shared/supabase/server";
import { getRequiredPersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ResponseRow = {
  id: string;
  display_name: string;
  max_guests: number;
  share_status: "not_shared" | "shared" | "opened" | "confirmed" | "declined";
  rsvps:
    | {
        response: "confirmed" | "declined";
        attendee_count: number;
        attendee_names: unknown;
        responded_at: string;
      }
    | Array<{
        response: "confirmed" | "declined";
        attendee_count: number;
        attendee_names: unknown;
        responded_at: string;
      }>
    | null;
};

export async function getRsvpResponses(supabase: SupabaseServerClient) {
  const event = await getRequiredPersonalInvitationEvent(supabase);
  const { data, error } = await supabase
    .from("invitation_recipients")
    .select(
      [
        "id",
        "display_name",
        "max_guests",
        "share_status",
        "rsvps(response, attendee_count, attendee_names, responded_at)",
      ].join(", "),
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .returns<ResponseRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const responses = (data ?? []).map((row) => {
    const rsvp = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;

    return {
      attendeeCount: rsvp?.attendee_count ?? 0,
      attendeeNames: parseAttendeeNames(rsvp?.attendee_names),
      displayName: row.display_name,
      id: row.id,
      maxGuests: row.max_guests,
      respondedAt: rsvp?.responded_at ?? null,
      response: rsvp?.response ?? null,
      shareStatus: row.share_status,
    };
  });

  return {
    event,
    responses,
    summary: {
      confirmedPeople: responses.reduce(
        (total, response) => total + response.attendeeCount,
        0,
      ),
      pendingGroups: responses.filter((response) => !response.response).length,
      totalGroups: responses.length,
    },
  };
}

function parseAttendeeNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
