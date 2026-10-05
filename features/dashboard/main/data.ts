import type { createClient } from "@/shared/supabase/server";
import { getInvitationPalette, getInvitationTheme } from "@/invitation/themes";
import { evaluatePublicationReadiness } from "@/features/invitations/evaluate-readiness/evaluatePublicationReadiness";
import type { PersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";

import type { DashboardData, SetupStep } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type GuestStatsRow = {
  max_guests: number;
  share_status: "not_shared" | "shared" | "opened" | "confirmed" | "declined";
  rsvps:
    | {
        response: "confirmed" | "declined";
        attendee_count: number;
      }
    | Array<{
        response: "confirmed" | "declined";
        attendee_count: number;
      }>
    | null;
};

export async function getDashboardData(
  supabase: SupabaseServerClient,
  event: PersonalInvitationEvent,
): Promise<DashboardData> {
  const readiness = evaluatePublicationReadiness(event);
  const guestSummary = await getGuestSummary(supabase, event.id);
  const theme = getInvitationTheme(event.themeId);
  const palette = getInvitationPalette(event.paletteId);
  const setupSteps: SetupStep[] = [
    {
      id: "event-details",
      group: "invitation",
      icon: "calendar",
      title: "Datos de la celebracion",
      description: event.eventDate
        ? event.dateLabel
        : "Define la fecha para publicar",
      status: event.eventDate ? "completed" : "in_progress",
      href: "/admin/personal/invitacion/datos",
      ctaLabel: "Continuar",
      detail: event.city ?? "Ciudad pendiente",
    },
    {
      id: "invitation-content",
      group: "invitation",
      icon: "document",
      title: "Contenido de la invitacion",
      description: event.mainInvitationMessage
        ? "Texto principal guardado"
        : "Textos y detalles pendientes",
      status: event.mainInvitationMessage ? "completed" : "in_progress",
      href: "/admin/personal/invitacion/contenido",
      ctaLabel: "Editar",
      detail: readiness.missingRequirements.length
        ? `${readiness.missingRequirements.length} requisitos pendientes`
        : "Requisitos obligatorios completos",
    },
    {
      id: "design",
      group: "invitation",
      icon: "palette",
      title: "Diseno",
      description: `${theme.name} · ${palette.name}`,
      status: "completed",
      href: "/admin/personal/invitacion/preview",
      ctaLabel: "Cambiar",
      detail: `${theme.name} · ${palette.name}`,
    },
    {
      id: "photos",
      group: "invitation",
      icon: "image",
      title: "Fotografias",
      description: event.content.galleryImages?.length
        ? `${event.content.galleryImages.length} fotografias cargadas`
        : "Opcional para publicar",
      status: event.content.galleryImages?.length ? "completed" : "pending",
      href: "/admin/personal/invitacion/fotografias",
      ctaLabel: "Editar",
      detail: "Portada y galeria",
    },
    {
      id: "guests",
      group: "event",
      icon: "users",
      title: "Invitados",
      description: `${guestSummary.guestsCount} grupos registrados`,
      status: guestSummary.guestsCount > 0 ? "completed" : "pending",
      href: "/admin/personal/invitados",
      ctaLabel: "Gestionar",
      detail: `${guestSummary.passesCount} pases · ${guestSummary.confirmedPeople} personas confirmadas`,
    },
    {
      id: "preview",
      group: "finish",
      icon: "eye",
      title: "Vista previa",
      description: "Revisa la invitacion real, sin datos demo",
      status: "completed",
      href: "/admin/personal/invitacion/preview",
      ctaLabel: "Ver",
      detail: "Render compartido con la pagina publica",
    },
    {
      id: "publish",
      group: "finish",
      icon: "send",
      title: event.status === "published" ? "Actualizar publicacion" : "Publicacion",
      description:
        event.status === "published"
          ? "Los cambios quedan en borrador hasta actualizar"
          : "Comparte tu invitacion cuando este lista",
      status:
        event.status === "published"
          ? "completed"
          : readiness.ready
            ? "in_progress"
            : "pending",
      href: "/admin/personal/invitacion/publicar",
      ctaLabel: event.status === "published" ? "Actualizar" : "Publicar",
      detail: readiness.ready
        ? "Lista para publicar"
        : readiness.missingRequirements[0]?.label,
    },
  ];

  return {
    event: {
      coupleName: event.coupleName || "Su boda",
      title: `Boda de ${event.coupleName || "ustedes"}`,
      dateLabel: event.dateLabel,
      description:
        event.status === "published"
          ? "Tu invitacion publicada se mantiene estable."
          : readiness.ready
            ? "Tu invitacion esta lista para publicarse."
            : "Tu invitacion esta tomando forma.",
      initials: getInitials(event),
    },
    invitation: {
      status:
        event.status === "published"
          ? "published"
          : readiness.ready
            ? "ready_to_publish"
            : "configuring",
      previewHref: "/admin/personal/invitacion/preview",
      publicHref: event.status === "published" ? `/i/${event.slug}` : undefined,
      themeName: theme.name,
      paletteName: palette.name,
    },
    guestSummary: {
      guestsCount: guestSummary.guestsCount,
      passesCount: guestSummary.passesCount,
      confirmedPeople: guestSummary.confirmedPeople,
      pendingGroups: guestSummary.pendingGroups,
    },
    setupSteps,
  };
}

export function getSetupProgress(steps: SetupStep[]) {
  const completedSteps = steps.filter((step) => step.status === "completed");

  return {
    completed: completedSteps.length,
    total: steps.length,
    percentage: Math.round((completedSteps.length / steps.length) * 100),
  };
}

export function getNextStep(steps: SetupStep[]) {
  return (
    steps.find(
      (step) => step.status === "in_progress" || step.status === "pending",
    ) ?? steps[0]
  );
}

async function getGuestSummary(
  supabase: SupabaseServerClient,
  eventId: string,
) {
  const { data } = await supabase
    .from("invitation_recipients")
    .select("max_guests, share_status, rsvps(response, attendee_count)")
    .eq("event_id", eventId)
    .returns<GuestStatsRow[]>();

  const recipients = data ?? [];
  const confirmedPeople = recipients.reduce((total, recipient) => {
    const rsvp = Array.isArray(recipient.rsvps)
      ? recipient.rsvps[0]
      : recipient.rsvps;

    return total + (rsvp?.response === "confirmed" ? rsvp.attendee_count : 0);
  }, 0);

  return {
    guestsCount: recipients.length,
    passesCount: recipients.reduce(
      (total, recipient) => total + recipient.max_guests,
      0,
    ),
    confirmedPeople,
    pendingGroups: recipients.filter(
      (recipient) =>
        !["confirmed", "declined"].includes(recipient.share_status),
    ).length,
  };
}

function getInitials(event: PersonalInvitationEvent) {
  const names = [event.partnerOneName, event.partnerTwoName].filter(Boolean);

  if (!names.length) {
    return "CE";
  }

  return names
    .map((name) => name.trim()[0])
    .join("")
    .toUpperCase();
}
