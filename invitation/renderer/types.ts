import type { InvitationPaletteId, InvitationThemeId } from "../themes";

export type WeddingInvitationEvent = WeddingInvitationContent & {
  slug?: string;
  coupleName: string;
  dateLabel: string;
  themeId: InvitationThemeId | string;
  paletteId: InvitationPaletteId | string;
  mainLocationName?: string | null;
  mainLocationTime?: string | null;
  mainInvitationMessage?: string | null;
};

export type WeddingInvitationContent = {
  heroImage?: HeroImage | string | null;
  galleryImages?: GalleryImage[];
  tagline?: string | null;
  family?: {
    intro?: string;
    groomParents?: string[];
    brideParents?: string[];
    godparents?: string[];
    witnesses?: string[];
  } | null;
  saveTheDate?: {
    month: string;
    day: string;
    weekday: string;
    message?: string;
  } | null;
  locations?: InvitationLocation[];
  itinerary?: InvitationTimelineItem[];
  dressCode?: {
    style?: string;
    general?: string;
    men?: string;
    women?: string;
    children?: string;
    avoidColors?: Array<string | { name: string; value: string }>;
  } | null;
  gifts?: GiftMethod[];
  story?: Array<
    InvitationTimelineItem & {
      year?: string | number;
      image?: string;
      imageUrl?: string;
      imageAlt?: string;
      order?: number;
    }
  >;
  closingMessage?: string | null;
};

export type HeroImage = {
  bucket?: string;
  cropZoom?: number;
  focalX?: number;
  focalY?: number;
  id?: string;
  objectPath?: string;
  url?: string;
};

export type GalleryImage =
  | string
  | {
      id?: string;
      bucket?: string;
      objectPath?: string;
      url?: string;
      alt?: string;
      featured?: boolean;
      order?: number;
    };

export type GiftMethod = {
  title: string;
  description: string;
  enabled?: boolean;
  kind?: "envelope" | "yape" | "bankTransfer" | "externalRegistry";
  owner?: string;
  phone?: string;
  bank?: string;
  accountType?: string;
  currency?: string;
  accountNumber?: string;
  cci?: string;
  url?: string;
  linkLabel?: string;
};

export type InvitationLocation = {
  enabled?: boolean;
  kind: string;
  name: string;
  date?: string;
  time?: string;
  address?: string;
  mapUrl?: string;
  image?: string;
};

export type InvitationTimelineItem = {
  time?: string;
  date?: string;
  title: string;
  description?: string;
};
