import type { createClient } from "@/shared/supabase/server";

import {
  isInvitationPaletteId,
  isInvitationThemeId,
  type InvitationPaletteId,
  type InvitationThemeId,
} from "@/invitation/themes";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PersonalInvitationEvent = {
  id: string;
  slug: string;
  coupleName: string;
  dateLabel: string;
  status: "draft" | "ready" | "published" | "archived";
  publishedAt: string | null;
  themeId: InvitationThemeId;
  paletteId: InvitationPaletteId;
  mainLocationName: string;
  mainLocationTime: string;
  mainInvitationMessage: string;
};

type EventRow = {
  id: string;
  slug: string;
  couple_name: string;
  event_date_label: string;
  status: PersonalInvitationEvent["status"];
  published_at: string | null;
  theme_id: string | null;
  palette_id: string | null;
  main_location_name: string | null;
  main_location_time: string | null;
  main_invitation_message: string | null;
};

export async function ensurePersonalEventId(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.rpc("ensure_personal_event");

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo preparar el evento.");
  }

  return data as string;
}

export async function getPersonalInvitationEvent(
  supabase: SupabaseServerClient,
): Promise<PersonalInvitationEvent> {
  const eventId = await ensurePersonalEventId(supabase);

  const { data, error } = await supabase
    .from("events")
    .select(
      [
        "id",
        "slug",
        "couple_name",
        "event_date_label",
        "status",
        "published_at",
        "theme_id",
        "palette_id",
        "main_location_name",
        "main_location_time",
        "main_invitation_message",
      ].join(", "),
    )
    .eq("id", eventId)
    .single<EventRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo cargar la invitacion.");
  }

  return mapEvent(data);
}

function mapEvent(row: EventRow): PersonalInvitationEvent {
  const themeId = row.theme_id ?? "";
  const paletteId = row.palette_id ?? "";

  return {
    id: row.id,
    slug: row.slug,
    coupleName: row.couple_name,
    dateLabel: row.event_date_label,
    status: row.status,
    publishedAt: row.published_at,
    themeId: isInvitationThemeId(themeId) ? themeId : "versalles",
    paletteId: isInvitationPaletteId(paletteId)
      ? paletteId
      : "verde_esmeralda",
    mainLocationName: row.main_location_name ?? "",
    mainLocationTime: row.main_location_time ?? "",
    mainInvitationMessage: row.main_invitation_message ?? "",
  };
}
