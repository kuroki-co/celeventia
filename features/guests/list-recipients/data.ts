import type { createClient } from "@/shared/supabase/server";
import { getPersonalEventId } from "@/features/invitations/get-personal-invitation/data";

import type { GuestsPageData, InvitationRecipient } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type EventRow = {
  id: string;
  slug: string;
  couple_name: string;
  event_date_label: string;
  status: GuestsPageData["event"]["status"];
};

type RecipientRow = {
  id: string;
  display_name: string;
  phone: string | null;
  normalized_phone: string | null;
  max_guests: number;
  access_token: string;
  share_status: InvitationRecipient["shareStatus"];
  shared_at: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  rsvps:
    | {
        response: "confirmed" | "declined";
        attendee_count: number;
        attendee_names: unknown;
      }
    | Array<{
        response: "confirmed" | "declined";
        attendee_count: number;
        attendee_names: unknown;
      }>
    | null;
};

export async function getRequiredPersonalEventId(supabase: SupabaseServerClient) {
  const eventId = await getPersonalEventId(supabase);

  if (!eventId) {
    throw new Error("EVENT_NOT_FOUND");
  }

  return eventId;
}

export async function getGuestsPageData(
  supabase: SupabaseServerClient,
  origin: string,
): Promise<GuestsPageData> {
  const eventId = await getRequiredPersonalEventId(supabase);

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, slug, couple_name, event_date_label, status")
    .eq("id", eventId)
    .single<EventRow>();

  if (eventError || !event) {
    throw new Error(eventError?.message ?? "No se pudo cargar el evento.");
  }

  const { data, error } = await supabase
    .from("invitation_recipients")
    .select(
      [
        "id",
        "display_name",
        "phone",
        "normalized_phone",
        "max_guests",
        "access_token",
        "share_status",
        "shared_at",
        "first_opened_at",
        "last_opened_at",
        "rsvps(response, attendee_count, attendee_names)",
      ].join(", "),
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .returns<RecipientRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const recipients = (data ?? []).map((recipient: RecipientRow) =>
    mapRecipient(recipient, event.slug, origin),
  );

  return {
    event: {
      id: event.id,
      slug: event.slug,
      coupleName: event.couple_name,
      dateLabel: event.event_date_label,
      status: event.status,
    },
    recipients,
  };
}

function mapRecipient(
  recipient: RecipientRow,
  eventSlug: string,
  origin: string,
): InvitationRecipient {
  const rsvp = Array.isArray(recipient.rsvps)
    ? recipient.rsvps[0]
    : recipient.rsvps;
  const publicLink = new URL(`/i/${eventSlug}`, origin);

  publicLink.searchParams.set("t", recipient.access_token);

  return {
    id: recipient.id,
    displayName: recipient.display_name,
    phone: recipient.phone,
    normalizedPhone: recipient.normalized_phone,
    maxGuests: recipient.max_guests,
    publicLink: publicLink.toString(),
    shareStatus: recipient.share_status,
    sharedAt: recipient.shared_at,
    firstOpenedAt: recipient.first_opened_at,
    lastOpenedAt: recipient.last_opened_at,
    response: rsvp?.response ?? null,
    attendeeCount: rsvp?.attendee_count ?? null,
    attendeeNames: parseAttendeeNames(rsvp?.attendee_names),
  };
}

function parseAttendeeNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
