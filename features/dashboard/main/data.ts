import type { DashboardData, SetupStep, SetupStepStatus } from "./types";

// Temporary dashboard seed while event persistence is introduced.
// Keep sample values centralized here so UI components remain data-driven.
export function getDashboardData(): DashboardData {
  const setupSteps: SetupStep[] = [
    {
      id: "event-details",
      group: "invitation",
      icon: "calendar",
      title: "Datos de la celebración",
      description: "Fecha, ceremonia y recepción",
      status: "completed",
      href: "/admin/personal/invitacion/datos",
      ctaLabel: "Continuar",
      detail: "Fecha, ceremonia y recepción",
    },
    {
      id: "invitation-content",
      group: "invitation",
      icon: "document",
      title: "Contenido de la invitación",
      description: "Textos y detalles de tu invitación",
      status: "in_progress",
      href: "/admin/personal/invitacion/contenido",
      ctaLabel: "Continuar",
      detail: "Textos y detalles de tu invitación",
    },
    {
      id: "design",
      group: "invitation",
      icon: "palette",
      title: "Diseño",
      description: "Versalles · Verde Esmeralda",
      status: "completed",
      href: "/admin/personal/invitacion/preview",
      ctaLabel: "Continuar",
      detail: "Versalles · Verde Esmeralda",
    },
    {
      id: "photos",
      group: "invitation",
      icon: "image",
      title: "Fotografías",
      description: "4 fotografías cargadas",
      status: "in_progress",
      href: "/admin/personal/invitacion/fotografias",
      ctaLabel: "Continuar",
      detail: "4 fotografías cargadas",
    },
    {
      id: "guests",
      group: "event",
      icon: "users",
      title: "Invitados",
      description: "18 invitados registrados",
      status: "in_progress",
      href: "/admin/personal/invitados",
      ctaLabel: "Continuar",
      detail: "18 invitados registrados",
    },
    {
      id: "preview",
      group: "finish",
      icon: "eye",
      title: "Vista previa",
      description: "Revisa cómo verá tu invitación",
      status: "pending",
      href: "/admin/personal/invitacion/preview",
      ctaLabel: "Continuar",
      detail: "Revisa cómo verá tu invitación",
    },
    {
      id: "publish",
      group: "finish",
      icon: "send",
      title: "Publicación",
      description: "Comparte tu invitación",
      status: "pending",
      href: "/admin/personal/invitacion/publicar",
      ctaLabel: "Continuar",
      detail: "Comparte tu invitación",
    },
  ];

  return {
    event: {
      coupleName: "Andrea & Diego",
      title: "Boda de Andrea & Diego",
      dateLabel: "14 de noviembre de 2026",
      description: "Tu invitación está tomando forma.",
      initials: "A&D",
    },
    invitation: {
      status: getInvitationStatus(setupSteps),
      previewHref: "/admin/personal/invitacion/preview",
      themeName: "Versalles",
      paletteName: "Verde Esmeralda",
    },
    guestSummary: {
      guestsCount: 18,
      passesCount: 36,
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

function getInvitationStatus(
  steps: SetupStep[],
): DashboardData["invitation"]["status"] {
  const requiredStatuses: SetupStepStatus[] = ["completed"];
  const ready = steps
    .filter((step) => step.id !== "publish")
    .every((step) => requiredStatuses.includes(step.status));

  return ready ? "ready_to_publish" : "configuring";
}
