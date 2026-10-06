import type { createClient } from "@/shared/supabase/server";
import type {
  GalleryImage,
  InvitationLocation,
  WeddingInvitationContent,
} from "@/invitation/renderer/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const signedUrlTtlSeconds = 60 * 60;

export type MediaReference = {
  bucket: string;
  id: string;
  objectPath: string;
};

export function stripTransientMediaUrls(
  content: WeddingInvitationContent,
): WeddingInvitationContent {
  return {
    ...content,
    galleryImages: content.galleryImages?.map(stripGalleryImageUrl),
    heroImage: stripHeroImageUrl(content.heroImage),
    locations: content.locations?.map(stripLocationImageUrl),
  };
}

export async function resolveInvitationMediaUrls(
  supabase: SupabaseServerClient,
  content: WeddingInvitationContent,
): Promise<WeddingInvitationContent> {
  const references = collectMediaReferences(content);
  const signedUrls = new Map<string, string>();

  await Promise.all(
    references.map(async (reference) => {
      const { data } = await supabase.storage
        .from(reference.bucket)
        .createSignedUrl(reference.objectPath, signedUrlTtlSeconds);

      if (data?.signedUrl) {
        signedUrls.set(reference.objectPath, data.signedUrl);
      }
    }),
  );

  return {
    ...content,
    galleryImages: content.galleryImages
      ?.map((image) => resolveGalleryImageUrl(image, signedUrls))
      .filter((image): image is GalleryImage => Boolean(image)),
    heroImage: resolveHeroImageUrl(content.heroImage, signedUrls),
    locations: content.locations?.map((location) =>
      resolveLocationImageUrl(location, signedUrls),
    ),
  };
}

export function collectMediaReferences(content: WeddingInvitationContent) {
  const references: MediaReference[] = [];
  const hero = getHeroReference(content.heroImage);

  if (hero) {
    references.push(hero);
  }

  for (const image of content.galleryImages ?? []) {
    const reference = getGalleryReference(image);

    if (reference) {
      references.push(reference);
    }
  }

  for (const location of content.locations ?? []) {
    const reference = getLocationImageReference(location);

    if (reference) {
      references.push(reference);
    }
  }

  return references;
}

function getHeroReference(
  image: WeddingInvitationContent["heroImage"],
): MediaReference | null {
  if (!image || typeof image === "string") {
    return null;
  }

  if (!image.id || !image.objectPath) {
    return null;
  }

  return {
    bucket: image.bucket ?? "event-media",
    id: image.id,
    objectPath: image.objectPath,
  };
}

function getGalleryReference(image: GalleryImage): MediaReference | null {
  if (typeof image === "string") {
    return null;
  }

  if (!image.id || !image.objectPath) {
    return null;
  }

  return {
    bucket: image.bucket ?? "event-media",
    id: image.id,
    objectPath: image.objectPath,
  };
}

function stripHeroImageUrl(
  image: WeddingInvitationContent["heroImage"],
): WeddingInvitationContent["heroImage"] {
  if (!image || typeof image === "string") {
    return image;
  }

  const reference = { ...image };
  delete reference.url;

  return reference;
}

function stripGalleryImageUrl(image: GalleryImage): GalleryImage {
  if (typeof image === "string") {
    return image;
  }

  const reference = { ...image };
  delete reference.url;

  return reference;
}

function stripLocationImageUrl(location: InvitationLocation): InvitationLocation {
  if (!location.image || typeof location.image === "string") {
    return location;
  }

  const image = { ...location.image };
  delete image.url;

  return {
    ...location,
    image,
  };
}

function resolveHeroImageUrl(
  image: WeddingInvitationContent["heroImage"],
  signedUrls: Map<string, string>,
): WeddingInvitationContent["heroImage"] {
  if (!image || typeof image === "string") {
    return image;
  }

  if (!image.objectPath) {
    return image;
  }

  return {
    ...image,
    url: signedUrls.get(image.objectPath),
  };
}

function resolveGalleryImageUrl(
  image: GalleryImage,
  signedUrls: Map<string, string>,
): GalleryImage | null {
  if (typeof image === "string") {
    return image;
  }

  if (!image.objectPath) {
    return image.url ? image : null;
  }

  return {
    ...image,
    url: signedUrls.get(image.objectPath),
  };
}

function resolveLocationImageUrl(
  location: InvitationLocation,
  signedUrls: Map<string, string>,
): InvitationLocation {
  if (!location.image || typeof location.image === "string") {
    return location;
  }

  if (!location.image.objectPath) {
    return location;
  }

  return {
    ...location,
    image: {
      ...location.image,
      url: signedUrls.get(location.image.objectPath),
    },
  };
}

function getLocationImageReference(
  location: InvitationLocation,
): MediaReference | null {
  const image = location.image;

  if (!image || typeof image === "string") {
    return null;
  }

  if (!image.id || !image.objectPath) {
    return null;
  }

  return {
    bucket: image.bucket ?? "event-media",
    id: image.id,
    objectPath: image.objectPath,
  };
}
