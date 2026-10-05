import type { createClient } from "@/shared/supabase/server";
import type {
  GalleryImage,
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
