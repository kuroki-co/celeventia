export type PublicInvitationData = {
  event: {
    slug: string;
    coupleName: string;
    dateLabel: string;
    themeId: string;
    paletteId: string;
    mainLocationName: string;
    mainLocationTime: string;
    mainInvitationMessage: string;
  };
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
