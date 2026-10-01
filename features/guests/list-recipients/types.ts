export type RecipientVisualStatus =
  | "not_shared"
  | "shared"
  | "opened"
  | "confirmed"
  | "declined";

export type InvitationRecipient = {
  id: string;
  displayName: string;
  phone: string | null;
  normalizedPhone: string | null;
  maxGuests: number;
  publicLink: string;
  shareStatus: RecipientVisualStatus;
  sharedAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  response: "confirmed" | "declined" | null;
  attendeeCount: number | null;
  attendeeNames: string[];
};

export type EventPublicationStatus =
  | "draft"
  | "ready"
  | "published"
  | "archived";

export type GuestsPageData = {
  event: {
    id: string;
    slug: string;
    coupleName: string;
    dateLabel: string;
    status: EventPublicationStatus;
  };
  recipients: InvitationRecipient[];
};
