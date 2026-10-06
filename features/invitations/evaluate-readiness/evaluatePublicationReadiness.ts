import {
  isInvitationPaletteId,
  isInvitationThemeId,
} from "@/invitation/themes";
import type { PersonalInvitationEvent } from "../get-personal-invitation/data";

export type PublicationRequirementId =
  | "couple_names"
  | "event_date"
  | "active_location"
  | "locations"
  | "main_content"
  | "theme"
  | "palette"
  | "slug";

export type PublicationRequirement = {
  id: PublicationRequirementId;
  label: string;
  complete: boolean;
  href: string;
};

export type PublicationReadiness = {
  ready: boolean;
  missingRequirements: PublicationRequirement[];
  requirements: PublicationRequirement[];
};

export function evaluatePublicationReadiness(
  event: PersonalInvitationEvent,
): PublicationReadiness {
  const requirements: PublicationRequirement[] = [
    {
      id: "couple_names",
      label: "Nombres de la pareja",
      complete: hasText(event.coupleName),
      href: "/admin/personal/invitacion/datos",
    },
    {
      id: "event_date",
      label: "Fecha definida",
      complete: hasText(event.eventDate),
      href: "/admin/personal/invitacion/datos",
    },
    {
      id: "active_location",
      label: "Al menos un lugar activo",
      complete: getEnabledLocations(event).length > 0,
      href: "/admin/personal/invitacion/datos",
    },
    {
      id: "locations",
      label: getLocationsLabel(event),
      complete: getEnabledLocations(event).every(isCompleteLocation),
      href: "/admin/personal/invitacion/datos",
    },
    {
      id: "main_content",
      label: "Texto principal de la invitación",
      complete: hasText(event.mainInvitationMessage),
      href: "/admin/personal/invitacion/datos",
    },
    {
      id: "theme",
      label: "Tema visual seleccionado",
      complete: isInvitationThemeId(event.themeId),
      href: "/admin/personal/invitacion/preview",
    },
    {
      id: "palette",
      label: "Paleta seleccionada",
      complete: isInvitationPaletteId(event.paletteId),
      href: "/admin/personal/invitacion/preview",
    },
    {
      id: "slug",
      label: "Enlace público listo",
      complete: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug),
      href: "/admin/personal/invitacion/publicar",
    },
  ];
  const missingRequirements = requirements.filter(
    (requirement) => !requirement.complete,
  );

  return {
    ready: missingRequirements.length === 0,
    missingRequirements,
    requirements,
  };
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function getEnabledLocations(event: PersonalInvitationEvent) {
  return (event.content.locations ?? []).filter(
    (location) => location.enabled !== false,
  );
}

function getLocationsLabel(event: PersonalInvitationEvent) {
  const incomplete = getEnabledLocations(event).find(
    (location) => !isCompleteLocation(location),
  );

  if (incomplete?.kind) {
    return `Completa nombre, hora, direccion y mapa de ${incomplete.kind.toLowerCase()}`;
  }

  return "Lugares activos completos";
}

function isCompleteLocation(location: {
  address?: string;
  mapUrl?: string;
  name?: string;
  time?: string;
}) {
  return (
    Boolean(location.name?.trim()) &&
    Boolean(location.time?.trim()) &&
    Boolean(location.address?.trim()) &&
    isValidMapUrl(location.mapUrl)
  );
}

function isValidMapUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}
