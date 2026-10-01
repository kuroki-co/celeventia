/* eslint-disable @next/next/no-img-element */
"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TouchEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GalleryImage } from "./types";

type InvitationGalleryProps = {
  images: GalleryImage[];
  isTraditional: boolean;
};

type NormalizedGalleryImage = {
  id: string;
  url: string;
  alt: string;
  featured: boolean;
  order: number;
};

const maxGalleryImages = 10;
const maxFeaturedImages = 4;

export function InvitationGallery({
  images,
  isTraditional,
}: InvitationGalleryProps) {
  const normalizedImages = useMemo(() => normalizeGalleryImages(images), [images]);
  const featuredImages = useMemo(
    () => getFeaturedImages(normalizedImages),
    [normalizedImages],
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isOpen = activeIndex !== null;
  const activeImage = activeIndex !== null ? normalizedImages[activeIndex] : null;

  const closeGallery = useCallback(() => {
    setActiveIndex(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return (current - 1 + normalizedImages.length) % normalizedImages.length;
    });
  }, [normalizedImages.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) {
        return current;
      }

      return (current + 1) % normalizedImages.length;
    });
  }, [normalizedImages.length]);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const overlay = document.querySelector<HTMLElement>("[data-gallery-lightbox]");

    if (!overlay) {
      return;
    }

    const focusableElements = Array.from(
      overlay.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled"));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGallery();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
        return;
      }

      if (event.key === "Tab") {
        trapFocus(event);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeGallery, isOpen, showNext, showPrevious, trapFocus]);

  if (!normalizedImages.length) {
    return null;
  }

  function openGallery(index: number) {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setActiveIndex(index);
  }

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 48) {
      return;
    }

    if (deltaX > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }

  return (
    <>
      <div className={getGalleryGridClassName(featuredImages.length, isTraditional)}>
        {featuredImages.map((image, index) => (
          <button
            aria-label={`Abrir foto ${index + 1} de ${normalizedImages.length}`}
            className={getGalleryItemClassName(featuredImages.length, index, isTraditional)}
            key={image.id}
            onClick={() => openGallery(normalizedImages.indexOf(image))}
            type="button"
          >
            <img
              alt={image.alt}
              className="h-full w-full object-cover transition duration-200 ease-out group-hover:scale-[1.015]"
              decoding="async"
              loading={index === 0 ? "eager" : "lazy"}
              src={image.url}
            />
          </button>
        ))}
      </div>

      {normalizedImages.length > maxFeaturedImages ? (
        <div className="mt-6 text-center">
          <button
            className="inline-flex min-h-10 items-center justify-center text-sm font-semibold text-[color:var(--inv-primary)] underline decoration-[color:var(--inv-border)] underline-offset-4 transition-colors hover:text-[color:var(--inv-secondary)] hover:decoration-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]"
            onClick={() => openGallery(maxFeaturedImages)}
            type="button"
          >
            Ver las {normalizedImages.length} fotos →
          </button>
        </div>
      ) : null}

      {isOpen && activeImage ? (
        <div
          aria-label="Galería de fotos"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-5 text-white transition-opacity duration-200 sm:px-8"
          data-gallery-lightbox
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGallery();
            }
          }}
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          role="dialog"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 py-4 sm:px-7">
            <p className="pointer-events-auto text-sm font-medium text-white/76">
              {activeIndex + 1} / {normalizedImages.length}
            </p>
            <button
              aria-label="Cerrar galería"
              className="pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/10 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={closeGallery}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" size={24} strokeWidth={1.5} />
            </button>
          </div>

          {normalizedImages.length > 1 ? (
            <button
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/10 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex"
              onClick={showPrevious}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={30} strokeWidth={1.45} />
            </button>
          ) : null}

          <div
            className="flex max-h-[82dvh] w-full max-w-6xl items-center justify-center pt-10"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <img
              alt={activeImage.alt}
              className="max-h-[78dvh] max-w-full object-contain transition duration-200 ease-out"
              decoding="async"
              src={activeImage.url}
            />
          </div>

          {normalizedImages.length > 1 ? (
            <button
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/10 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:inline-flex"
              onClick={showNext}
              type="button"
            >
              <ChevronRight aria-hidden="true" size={30} strokeWidth={1.45} />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function normalizeGalleryImages(images: GalleryImage[]) {
  return images
    .slice(0, maxGalleryImages)
    .map((image, index): NormalizedGalleryImage => {
      if (typeof image === "string") {
        return {
          alt: `Foto de la sesión ${index + 1}`,
          featured: index < maxFeaturedImages,
          id: image,
          order: index,
          url: image,
        };
      }

      return {
        alt: image.alt ?? `Foto de la sesión ${index + 1}`,
        featured: image.featured ?? index < maxFeaturedImages,
        id: image.id ?? image.url,
        order: image.order ?? index,
        url: image.url,
      };
    })
    .sort((first, second) => first.order - second.order);
}

function getFeaturedImages(images: NormalizedGalleryImage[]) {
  const explicitFeatured = images.filter((image) => image.featured);
  const candidates = explicitFeatured.length ? explicitFeatured : images;

  return candidates.slice(0, maxFeaturedImages);
}

function getGalleryGridClassName(count: number, isTraditional: boolean) {
  const baseClassName = "mt-9 grid gap-3";

  if (count === 1) {
    return `${baseClassName} mx-auto max-w-3xl`;
  }

  if (count === 2) {
    return `${baseClassName} sm:grid-cols-2`;
  }

  if (count === 3) {
    return `${baseClassName} sm:grid-cols-2`;
  }

  return [
    baseClassName,
    isTraditional ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-4",
  ].join(" ");
}

function getGalleryItemClassName(
  count: number,
  index: number,
  isTraditional: boolean,
) {
  const frameClassName = isTraditional
    ? "border border-[color:var(--inv-border)] p-2"
    : "";
  const baseClassName = [
    "group relative block w-full overflow-hidden bg-[color:var(--inv-surface)] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--inv-secondary)]",
    frameClassName,
  ].join(" ");
  const aspectClassName = "aspect-[3/2]";

  if (count === 3 && index === 0) {
    return `${baseClassName} ${aspectClassName} sm:row-span-2 sm:aspect-auto`;
  }

  return `${baseClassName} ${aspectClassName}`;
}
