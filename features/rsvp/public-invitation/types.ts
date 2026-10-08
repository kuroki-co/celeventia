import type { WeddingInvitationContent } from "@/invitation/renderer/types";

export type PublicInvitationData = {
  event: {
    slug: string;
    coupleName: string;
    dateLabel: string;
    eventDate?: string | null;
    eventTimezone?: string | null;
    themeId: string;
    paletteId: string;
    mainLocationName: string;
    mainLocationTime: string;
    mainInvitationMessage: string;
  } & WeddingInvitationContent;
  recipient: {
    displayName: string;
    maxGuests: number;
  } | null;
  rsvp: {
    response: "confirmed" | "declined" | null;
    attendeeCount: number;
    attendeeNames: string[];
    deadlineLabel?: string | null;
    isClosed?: boolean;
  } | null;
};
