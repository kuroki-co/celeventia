import type { createClient } from "@/shared/supabase/server";

import type { WeddingInvitationContent } from "@/invitation/renderer/types";
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
  partnerOneName: string;
  partnerTwoName: string;
  nameOrder: "partner_one_first" | "partner_two_first";
  eventDate: string | null;
  eventTimezone: string;
  city: string | null;
  isConfigured: boolean;
  draftRevision: number;
  publishedRevision: number | null;
  content: WeddingInvitationContent;
};

type EventRow = {
  id: string;
  slug: string;
  couple_name: string | null;
  event_date_label: string | null;
  status: PersonalInvitationEvent["status"];
  published_at: string | null;
  theme_id: string | null;
  palette_id: string | null;
  main_location_name: string | null;
  main_location_time: string | null;
  main_invitation_message: string | null;
  partner_one_name: string | null;
  partner_two_name: string | null;
  name_order: "partner_one_first" | "partner_two_first" | null;
  event_date: string | null;
  event_timezone: string | null;
  city: string | null;
  is_configured: boolean | null;
  draft_revision: number | null;
  published_revision: number | null;
  invitation_content: unknown;
};

export async function getPersonalEventId(supabase: SupabaseServerClient) {
  const { data, error } = await supabase.rpc("get_personal_event_id");

  if (error) {
    throw new Error(error.message);
  }

  return (data as string | null) ?? null;
}

export async function getPersonalInvitationEvent(
  supabase: SupabaseServerClient,
): Promise<PersonalInvitationEvent | null> {
  const eventId = await getPersonalEventId(supabase);

  if (!eventId) {
    return null;
  }

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
        "partner_one_name",
        "partner_two_name",
        "name_order",
        "event_date",
        "event_timezone",
        "city",
        "is_configured",
        "draft_revision",
        "published_revision",
        "invitation_content",
      ].join(", "),
    )
    .eq("id", eventId)
    .single<EventRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo cargar la invitacion.");
  }

  return mapEvent(data);
}

export async function getRequiredPersonalInvitationEvent(
  supabase: SupabaseServerClient,
): Promise<PersonalInvitationEvent> {
  const event = await getPersonalInvitationEvent(supabase);

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  return event;
}

function mapEvent(row: EventRow): PersonalInvitationEvent {
  const themeId = row.theme_id ?? "";
  const paletteId = row.palette_id ?? "";
  const partnerOneName = row.partner_one_name ?? "";
  const partnerTwoName = row.partner_two_name ?? "";
  const coupleName =
    row.couple_name ??
    formatCoupleName({
      nameOrder: row.name_order ?? "partner_one_first",
      partnerOneName,
      partnerTwoName,
    });
  const dateLabel =
    row.event_date_label ?? formatDateLabel(row.event_date) ?? "Fecha por definir";

  return {
    id: row.id,
    slug: row.slug,
    coupleName,
    dateLabel,
    status: row.status,
    publishedAt: row.published_at,
    themeId: isInvitationThemeId(themeId) ? themeId : "versalles",
    paletteId: isInvitationPaletteId(paletteId)
      ? paletteId
      : "verde_esmeralda",
    mainLocationName: row.main_location_name ?? "",
    mainLocationTime: row.main_location_time ?? "",
    mainInvitationMessage: row.main_invitation_message ?? "",
    partnerOneName,
    partnerTwoName,
    nameOrder: row.name_order ?? "partner_one_first",
    eventDate: row.event_date,
    eventTimezone: row.event_timezone ?? "America/Lima",
    city: row.city,
    isConfigured: Boolean(row.is_configured),
    draftRevision: row.draft_revision ?? 1,
    publishedRevision: row.published_revision,
    content: parseInvitationContent(row.invitation_content),
  };
}

export function formatCoupleName({
  nameOrder,
  partnerOneName,
  partnerTwoName,
}: {
  nameOrder: PersonalInvitationEvent["nameOrder"];
  partnerOneName: string;
  partnerTwoName: string;
}) {
  const first =
    nameOrder === "partner_two_first" ? partnerTwoName : partnerOneName;
  const second =
    nameOrder === "partner_two_first" ? partnerOneName : partnerTwoName;

  return [first, second].filter(Boolean).join(" & ");
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function parseInvitationContent(value: unknown): WeddingInvitationContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as WeddingInvitationContent;
}
