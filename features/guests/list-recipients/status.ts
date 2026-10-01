import type { RecipientVisualStatus } from "./types";

export function getRecipientStatusLabel(status: RecipientVisualStatus) {
  if (status === "confirmed") {
    return "Confirmado";
  }

  if (status === "declined") {
    return "No asistirá";
  }

  if (status === "opened") {
    return "Invitación abierta";
  }

  if (status === "shared") {
    return "Compartida";
  }

  return "No compartida";
}

export function getRecipientStatusMark(status: RecipientVisualStatus) {
  if (status === "confirmed") {
    return "✓";
  }

  if (status === "declined") {
    return "×";
  }

  if (status === "opened") {
    return "◉";
  }

  if (status === "shared") {
    return "•";
  }

  return "○";
}

export function getRecipientStatusClassName(status: RecipientVisualStatus) {
  if (status === "confirmed") {
    return "text-[#24523D]";
  }

  if (status === "declined") {
    return "text-midnight-navy/58";
  }

  if (status === "opened" || status === "shared") {
    return "text-muted-mauve";
  }

  return "text-midnight-navy/55";
}
