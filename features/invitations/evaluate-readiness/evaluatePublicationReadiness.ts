import {
  isInvitationPaletteId,
  isInvitationThemeId,
} from "@/invitation/themes";
import type { PersonalInvitationEvent } from "../get-personal-invitation/data";

export type PublicationRequirementId =
  | "couple_names"
  | "event_date"
  | "main_location"
  | "main_time"
  | "main_address"
  | "main_map"
  | "main_content"
  | "theme"
  | "palette"
  | "slug";

export type PublicationRequirement = {
  id: PublicationRequirementId;
  label: string;
  complete: boolean;
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
    },
    {
      id: "event_date",
      label: "Fecha definida",
      complete: hasText(event.eventDate),
    },
    {
      id: "main_location",
      label: "Lugar principal",
      complete: Boolean(getMainLocation(event)?.name?.trim()),
    },
    {
      id: "main_time",
      label: "Hora principal",
      complete: Boolean(getMainLocation(event)?.time?.trim()),
    },
    {
      id: "main_address",
      label: "Direccion del lugar principal",
      complete: Boolean(getMainLocation(event)?.address?.trim()),
    },
    {
      id: "main_map",
      label: "Mapa valido",
      complete: isValidMapUrl(getMainLocation(event)?.mapUrl),
    },
    {
      id: "main_content",
      label: "Texto principal de la invitacion",
      complete: hasText(event.mainInvitationMessage),
    },
    {
      id: "theme",
      label: "Tema visual seleccionado",
      complete: isInvitationThemeId(event.themeId),
    },
    {
      id: "palette",
      label: "Paleta seleccionada",
      complete: isInvitationPaletteId(event.paletteId),
    },
    {
      id: "slug",
      label: "URL publica unica y valida",
      complete: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug),
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

function getMainLocation(event: PersonalInvitationEvent) {
  return event.content.locations?.find((location) => location.enabled !== false);
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
