import type { InvitationStatus, SetupStepStatus } from "./types";

export function getInvitationStatusLabel(status: InvitationStatus) {
  if (status === "published") {
    return "Publicada";
  }

  if (status === "ready_to_publish") {
    return "Lista para publicar";
  }

  return "En configuración";
}

export function getStepStatusLabel(status: SetupStepStatus) {
  if (status === "completed") {
    return "Completado";
  }

  if (status === "in_progress") {
    return "En progreso";
  }

  return "Pendiente";
}

export function getStepStatusToneClassName(status: SetupStepStatus) {
  if (status === "completed") {
    return "text-[#24523D]";
  }

  if (status === "in_progress") {
    return "text-muted-mauve";
  }

  return "text-midnight-navy/58";
}

export function getStepStatusMark(status: SetupStepStatus) {
  if (status === "completed") {
    return "✓";
  }

  if (status === "in_progress") {
    return "•";
  }

  return "○";
}
