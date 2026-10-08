import type { InvitationPaletteId, InvitationThemeId } from "../themes";

export type WeddingInvitationEvent = WeddingInvitationContent & {
  slug?: string;
  coupleName: string;
  dateLabel: string;
  eventDate?: string | null;
  eventTimezone?: string | null;
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
      image?: MediaImageReference | string;
      imageUrl?: string;
      imageAlt?: string;
      order?: number;
    }
  >;
  music?: {
    enabled?: boolean;
    title?: string;
    artist?: string;
    audio?: MediaAudioReference | string;
    audioUrl?: string;
    volume?: number;
  } | null;
  songSuggestions?: {
    enabled?: boolean;
    title?: string;
    description?: string;
  } | null;
  collaborativeAlbum?: {
    enabled?: boolean;
    title?: string;
    description?: string;
  } | null;
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

export type MediaImageReference = {
  id?: string;
  bucket?: string;
  objectPath?: string;
  url?: string;
  alt?: string;
};

export type MediaAudioReference = {
  id?: string;
  bucket?: string;
  objectPath?: string;
  url?: string;
};

export type GiftMethod = {
  title: string;
  description: string;
  enabled?: boolean;
  kind?: "envelope" | "yape" | "plin" | "bankTransfer" | "externalRegistry";
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
  image?: MediaImageReference | string;
};

export type InvitationTimelineItem = {
  id?: string;
  time?: string;
  date?: string;
  dayOffset?: number;
  iconKey?: "heart" | "mapPin" | "utensils" | "music" | "sparkles" | "camera";
  order?: number;
  title: string;
  description?: string;
};
