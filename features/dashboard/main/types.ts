export type InvitationStatus = "configuring" | "ready_to_publish" | "published";

export type SetupStepStatus = "pending" | "in_progress" | "completed";
export type SetupStepGroup = "invitation" | "event" | "finish";
export type SetupStepIcon =
  | "calendar"
  | "document"
  | "palette"
  | "image"
  | "users"
  | "eye"
  | "send";

export type DashboardEvent = {
  coupleName: string;
  title: string;
  dateLabel: string;
  description: string;
  initials: string;
};

export type InvitationSummary = {
  status: InvitationStatus;
  previewHref: string;
  publicHref?: string;
  themeName?: string;
  paletteName?: string;
};

export type GuestSummary = {
  guestsCount: number;
  passesCount?: number;
  confirmedPeople?: number;
  pendingGroups?: number;
};

export type SetupStep = {
  id: string;
  group: SetupStepGroup;
  icon: SetupStepIcon;
  title: string;
  description: string;
  status: SetupStepStatus;
  href: string;
  ctaLabel: string;
  detail?: string;
};

export type DashboardData = {
  event: DashboardEvent;
  invitation: InvitationSummary;
  guestSummary: GuestSummary;
  setupSteps: SetupStep[];
};

export type SetupProgress = {
  completed: number;
  total: number;
  percentage: number;
};
