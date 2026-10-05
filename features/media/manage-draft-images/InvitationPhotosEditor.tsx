"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { useActionState, useId, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import type {
  GalleryImage,
  HeroImage,
  WeddingInvitationContent,
} from "@/invitation/renderer/types";
import type { PersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { deleteInvitationImage } from "@/features/media/delete-image/action";
import { uploadInvitationImage, type UploadImageState } from "@/features/media/upload-image/action";
import {
  allowedImageExtensionsLabel,
  maxImageSizeLabel,
} from "@/features/media/upload-image/limits";
import {
  reorderGalleryImages,
  updateGalleryImageMeta,
  updateHeroImageFocalPoint,
  type DraftImageActionState,
} from "@/features/media/update-draft-images/action";

type InvitationPhotosEditorProps = {
  event: PersonalInvitationEvent;
};

type GalleryItem = Extract<GalleryImage, { id?: string }>;

const initialUploadState: UploadImageState = {};
const initialImageState: DraftImageActionState = {};

export function InvitationPhotosEditor({ event }: InvitationPhotosEditorProps) {
  const heroImage = normalizeHeroImage(event.content.heroImage);
  const galleryImages = useMemo(
    () => normalizeGalleryImages(event.content),
    [event.content],
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function deleteImage(mediaId: string) {
    setMessage("Quitando imagen...");
    startTransition(async () => {
      const result = await deleteInvitationImage(mediaId);
      setMessage(result.error ?? result.success ?? "");
    });
  }

  function moveImage(mediaId: string, direction: "up" | "down") {
    const currentIndex = galleryImages.findIndex((image) => image.id === mediaId);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= galleryImages.length) {
      return;
    }

    const nextOrder = [...galleryImages];
    const [current] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(nextIndex, 0, current);
    setMessage("Guardando orden...");

    startTransition(async () => {
      const result = await reorderGalleryImages(
        nextOrder.map((image) => image.id).filter(Boolean) as string[],
      );
      setMessage(result.error ?? result.success ?? "");
    });
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-[18px] border border-midnight-navy/10 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-midnight-navy">
              Foto de portada
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-midnight-navy/60">
              Esta imagen aparece en el hero y en la entrada de la invitacion.
              Puedes ajustar el punto focal para encuadrarla mejor.
            </p>
          </div>
          <UploadImageForm
            buttonLabel={heroImage ? "Reemplazar portada" : "Subir foto de portada"}
            eventId={event.id}
            purpose="invitation"
          />
        </div>

        {heroImage ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="overflow-hidden rounded-[18px] border border-midnight-navy/10 bg-midnight-navy/5">
              {heroImage.url ? (
                <img
                  alt="Foto de portada"
                  className="aspect-[4/5] w-full object-cover sm:aspect-[16/9]"
                  src={heroImage.url}
                  style={{
                    objectPosition: `${heroImage.focalX ?? 50}% ${heroImage.focalY ?? 50}%`,
                  }}
                />
              ) : (
                <div className="grid aspect-[16/9] place-items-center px-4 text-center text-sm font-semibold text-midnight-navy/55">
                  No pudimos generar la vista previa de esta imagen.
                </div>
              )}
            </div>
            <HeroFocalForm
              eventId={event.id}
              focalX={heroImage.focalX ?? 50}
              focalY={heroImage.focalY ?? 50}
              mediaId={heroImage.id}
              onDelete={deleteImage}
            />
          </div>
        ) : (
          <EmptyPhotoState text="Aun no hay foto de portada en el borrador." />
        )}
      </section>

      <section className="grid gap-4 rounded-[18px] border border-midnight-navy/10 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-midnight-navy">
              Galeria
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-midnight-navy/60">
              Agrega fotos al borrador, ordenalas y elimina las que no quieras
              mostrar. La version publicada se conserva hasta actualizarla.
            </p>
          </div>
          <UploadImageForm
            buttonLabel="Agregar fotos a la galeria"
            eventId={event.id}
            purpose="gallery"
          />
        </div>

        {galleryImages.length ? (
          <div className="grid gap-3">
            {galleryImages.map((image, index) => (
              <GalleryImageRow
                eventId={event.id}
                image={image}
                index={index}
                isFirst={index === 0}
                isLast={index === galleryImages.length - 1}
                key={image.id ?? image.objectPath ?? index}
                onDelete={deleteImage}
                onMove={moveImage}
              />
            ))}
          </div>
        ) : (
          <EmptyPhotoState text="Aun no hay fotos en la galeria del borrador." />
        )}
      </section>

      <div className="flex flex-col gap-3 rounded-[18px] border border-midnight-navy/10 bg-porcelain px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="min-h-5 text-sm font-semibold text-midnight-navy/62">
          {isPending ? "Guardando..." : message}
        </p>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-muted-mauve/25 px-5 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5"
          href="/admin/personal/invitacion/preview"
        >
          Abrir vista previa
        </Link>
      </div>
    </div>
  );
}

function UploadImageForm({
  buttonLabel,
  eventId,
  purpose,
}: {
  buttonLabel: string;
  eventId: string;
  purpose: "gallery" | "invitation";
}) {
  const [state, formAction] = useActionState(uploadInvitationImage, initialUploadState);
  const inputId = useId();
  const [selectedFiles, setSelectedFiles] = useState("");

  return (
    <form action={formAction} className="grid w-full gap-2 sm:max-w-[22rem] sm:min-w-[18rem]">
      <input name="eventId" type="hidden" value={eventId} />
      <input name="purpose" type="hidden" value={purpose} />
      <div className="grid gap-2">
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id={inputId}
          multiple={purpose === "gallery"}
          name="file"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            setSelectedFiles(
              files.length
                ? files.map((file) => file.name).join(", ")
                : "",
            );
          }}
          required
          type="file"
        />
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <label
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition hover:bg-[#7D5F78]"
            htmlFor={inputId}
          >
            Seleccionar archivo
          </label>
          <p className="min-h-11 min-w-0 rounded-2xl border border-midnight-navy/12 bg-white px-3 py-3 text-sm font-semibold text-midnight-navy/70 sm:flex-1">
            <span className="block truncate">
              {selectedFiles || "Ningun archivo seleccionado"}
            </span>
          </p>
        </div>
      </div>
      <p className="text-xs leading-5 text-midnight-navy/55">
        {allowedImageExtensionsLabel}. Maximo {maxImageSizeLabel}.
      </p>
      <UploadSubmitButton label={buttonLabel} />
      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {state.error ?? state.success ?? ""}
      </p>
    </form>
  );
}

function UploadSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-wait disabled:bg-muted-mauve/50"
      disabled={pending}
      type="submit"
    >
      <ImagePlus aria-hidden="true" className="size-4" />
      {pending ? "Subiendo..." : label}
    </button>
  );
}

function HeroFocalForm({
  eventId,
  focalX,
  focalY,
  mediaId,
  onDelete,
}: {
  eventId: string;
  focalX: number;
  focalY: number;
  mediaId?: string;
  onDelete: (mediaId: string) => void;
}) {
  const [state, formAction] = useActionState(
    updateHeroImageFocalPoint,
    initialImageState,
  );
  const [x, setX] = useState(focalX);
  const [y, setY] = useState(focalY);

  return (
    <form action={formAction} className="grid content-start gap-4">
      <input name="eventId" type="hidden" value={eventId} />
      <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
        Encuadre horizontal
        <input
          max={100}
          min={0}
          name="focalX"
          onChange={(event) => setX(Number(event.target.value))}
          type="range"
          value={x}
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
        Encuadre vertical
        <input
          max={100}
          min={0}
          name="focalY"
          onChange={(event) => setY(Number(event.target.value))}
          type="range"
          value={y}
        />
      </label>
      <div className="flex flex-col gap-2">
        <ImageSubmitButton label="Guardar encuadre" />
        {mediaId ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5"
            onClick={() => onDelete(mediaId)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Quitar portada
          </button>
        ) : null}
      </div>
      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {state.error ?? state.success ?? ""}
      </p>
    </form>
  );
}

function GalleryImageRow({
  eventId,
  image,
  index,
  isFirst,
  isLast,
  onDelete,
  onMove,
}: {
  eventId: string;
  image: GalleryItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (mediaId: string) => void;
  onMove: (mediaId: string, direction: "down" | "up") => void;
}) {
  const [state, formAction] = useActionState(
    updateGalleryImageMeta,
    initialImageState,
  );

  return (
    <article className="grid gap-3 rounded-[18px] border border-midnight-navy/10 bg-porcelain p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
      <div className="overflow-hidden rounded-[14px] border border-midnight-navy/10 bg-white">
        {image.url ? (
          <img
            alt={image.alt ?? `Foto ${index + 1}`}
            className="aspect-[4/3] w-full object-cover"
            src={image.url}
          />
        ) : (
          <div className="grid aspect-[4/3] place-items-center px-2 text-center text-xs font-semibold text-midnight-navy/45">
            Sin vista previa
          </div>
        )}
      </div>
      <form action={formAction} className="grid gap-2">
        <input name="eventId" type="hidden" value={eventId} />
        <input name="mediaId" type="hidden" value={image.id} />
        <label className="grid gap-1 text-sm font-semibold text-midnight-navy">
          Descripcion opcional
          <input
            className="min-h-10 rounded-2xl border border-midnight-navy/12 bg-white px-3 text-sm font-medium text-midnight-navy outline-none transition focus:border-muted-mauve"
            defaultValue={image.alt ?? ""}
            maxLength={120}
            name="alt"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <ImageSubmitButton label="Guardar texto" />
          <p
            aria-live="polite"
            className={[
              "min-h-5 text-sm font-semibold",
              state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
            ].join(" ")}
          >
            {state.error ?? state.success ?? ""}
          </p>
        </div>
      </form>
      <div className="flex gap-2 sm:flex-col">
        <button
          aria-label="Subir foto en el orden"
          className="inline-flex size-10 items-center justify-center rounded-full border border-midnight-navy/10 text-midnight-navy/65 disabled:opacity-35"
          disabled={isFirst || !image.id}
          onClick={() => image.id && onMove(image.id, "up")}
          type="button"
        >
          <ArrowUp aria-hidden="true" className="size-4" />
        </button>
        <button
          aria-label="Bajar foto en el orden"
          className="inline-flex size-10 items-center justify-center rounded-full border border-midnight-navy/10 text-midnight-navy/65 disabled:opacity-35"
          disabled={isLast || !image.id}
          onClick={() => image.id && onMove(image.id, "down")}
          type="button"
        >
          <ArrowDown aria-hidden="true" className="size-4" />
        </button>
        <button
          aria-label="Eliminar foto del borrador"
          className="inline-flex size-10 items-center justify-center rounded-full border border-[#8A3A3A]/20 text-[#8A3A3A] disabled:opacity-35"
          disabled={!image.id}
          onClick={() => image.id && onDelete(image.id)}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  );
}

function ImageSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-muted-mauve/25 px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-wait disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

function EmptyPhotoState({ text }: { text: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-midnight-navy/16 bg-porcelain px-4 py-5 text-sm font-semibold text-midnight-navy/55">
      {text}
    </div>
  );
}

function normalizeHeroImage(
  image: WeddingInvitationContent["heroImage"],
): (HeroImage & { id?: string }) | null {
  if (!image || typeof image === "string") {
    return null;
  }

  return image;
}

function normalizeGalleryImages(content: WeddingInvitationContent) {
  return (content.galleryImages ?? [])
    .filter((image): image is GalleryItem => typeof image !== "string")
    .sort((first, second) => (first.order ?? 0) - (second.order ?? 0));
}
