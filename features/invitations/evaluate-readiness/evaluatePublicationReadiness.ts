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
      label: "Fecha del evento",
      complete: hasText(event.dateLabel),
    },
    {
      id: "main_location",
      label: "Lugar principal",
      complete: hasText(event.mainLocationName),
    },
    {
      id: "main_time",
      label: "Hora principal",
      complete: hasText(event.mainLocationTime),
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
