"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ImagePlus,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

import type { PersonalInvitationEvent } from "@/features/invitations/get-personal-invitation/data";
import { deleteInvitationImage } from "@/features/media/delete-image/action";
import {
  finalizeInvitationImageUpload,
  prepareInvitationImageUpload,
  type UploadPurpose,
} from "@/features/media/upload-image/action";
import {
  allowedImageExtensionsLabel,
  allowedImageTypes,
  maxGalleryImages,
  maxImageSizeBytes,
  maxImageSizeLabel,
} from "@/features/media/upload-image/limits";
import {
  reorderGalleryImages,
  updateGalleryImageMeta,
  updateHeroImageFocalPoint,
  type DraftImageActionState,
} from "@/features/media/update-draft-images/action";
import type {
  GalleryImage,
  HeroImage,
  WeddingInvitationContent,
} from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/client";

type InvitationPhotosEditorProps = {
  event: PersonalInvitationEvent;
};

type GalleryItem = Extract<GalleryImage, { id?: string }>;
type SelectedPreview = {
  name: string;
  size: number;
  url: string;
};

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
    if (isPending) {
      return;
    }

    const confirmed = window.confirm(
      "¿Quitar esta foto del borrador? Si ya fue publicada, seguirá visible hasta que vuelvas a publicar.",
    );

    if (!confirmed) {
      return;
    }

    setMessage("Quitando imagen...");
    startTransition(async () => {
      const result = await deleteInvitationImage(mediaId);
      setMessage(result.error ?? result.success ?? "");
    });
  }

  function moveImage(mediaId: string, direction: "up" | "down") {
    if (isPending) {
      return;
    }

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
      <section className="grid gap-5">
        <PhotoSectionHeader
          description="Aparece en el hero y en la entrada de la invitación."
          status={heroImage ? "Portada cargada" : "Sin portada"}
          title="Foto de portada"
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          {heroImage?.url ? (
            <HeroCropForm
              eventId={event.id}
              cropZoom={heroImage.cropZoom ?? 1}
              focalX={heroImage.focalX ?? 50}
              focalY={heroImage.focalY ?? 50}
              imageUrl={heroImage.url}
              isBusy={isPending}
              key={heroImage.id ?? heroImage.objectPath ?? "hero"}
              mediaId={heroImage.id}
              onDelete={deleteImage}
            />
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-midnight-navy/10 bg-midnight-navy/5 shadow-sm">
              <div className="grid aspect-[4/5] place-items-center bg-porcelain px-6 text-center sm:aspect-[16/9]">
                <div className="grid max-w-sm justify-items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-full bg-white text-muted-mauve shadow-sm">
                    <ImagePlus aria-hidden="true" className="size-5" />
                  </span>
                  <p className="text-sm font-semibold text-midnight-navy">
                    Aun no hay foto de portada en el borrador.
                  </p>
                  <p className="text-xs leading-5 text-midnight-navy/55">
                    Sube una imagen horizontal o vertical; luego podrás ajustar
                    el encuadre.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <UploadImageForm
              buttonLabel={heroImage ? "Usar nueva portada" : "Usar esta portada"}
              dropzoneTitle={heroImage ? "Reemplazar portada" : "Subir portada"}
              eventId={event.id}
              existingGalleryCount={galleryImages.length}
              purpose="invitation"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 border-t border-midnight-navy/8 pt-5">
        <PhotoSectionHeader
          description="Agrega fotos al borrador, ordenalas y elimina las que no quieras mostrar."
          status={`${galleryImages.length}/${maxGalleryImages} fotos`}
          title="Galeria"
        />

        <UploadImageForm
          buttonLabel="Agregar fotos"
          dropzoneTitle="Agregar a la galería"
          eventId={event.id}
          existingGalleryCount={galleryImages.length}
          purpose="gallery"
        />

        {galleryImages.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {galleryImages.map((image, index) => (
              <GalleryImageTile
                eventId={event.id}
                image={image}
                index={index}
                isFirst={index === 0}
                isLast={index === galleryImages.length - 1}
                isBusy={isPending}
                key={image.id ?? image.objectPath ?? index}
                onDelete={deleteImage}
                onMove={moveImage}
              />
            ))}
          </div>
        ) : (
          <EmptyPhotoState text="Aún no hay fotos en la galería del borrador." />
        )}
      </section>

      <div className="flex flex-col gap-3 rounded-[18px] border border-midnight-navy/10 bg-porcelain px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className="min-h-5 text-sm font-semibold text-midnight-navy/62"
        >
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

function PhotoSectionHeader({
  description,
  status,
  title,
}: {
  description: string;
  status: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-midnight-navy">{title}</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-midnight-navy/60">
          {description}
        </p>
      </div>
      <span className="inline-flex w-fit items-center rounded-full border border-muted-mauve/20 bg-muted-mauve/10 px-3 py-1 text-xs font-semibold text-muted-mauve">
        {status}
      </span>
    </div>
  );
}

function UploadImageForm({
  buttonLabel,
  dropzoneTitle,
  eventId,
  existingGalleryCount,
  purpose,
}: {
  buttonLabel: string;
  dropzoneTitle: string;
  existingGalleryCount: number;
  eventId: string;
  purpose: UploadPurpose;
}) {
  const router = useRouter();
  const inputId = useId();
  const helpId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<SelectedPreview[]>([]);
  const [status, setStatus] = useState<{
    error?: string;
    success?: string;
  }>({});
  const isGalleryFull =
    purpose === "gallery" && existingGalleryCount >= maxGalleryImages;
  const selectedCount = previews.length;

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function updateSelectedFiles(files: File[]) {
    previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews(
      files.map((file) => ({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      })),
    );
  }

  function setFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files);
    const selected = purpose === "gallery" ? nextFiles : nextFiles.slice(0, 1);
    setStatus({});
    updateSelectedFiles(selected);
  }

  function clearSelection() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setStatus({});
    updateSelectedFiles([]);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (!isGalleryFull && !isUploading) {
      setIsDragging(true);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isGalleryFull || isUploading) {
      return;
    }

    if (inputRef.current) {
      inputRef.current.files = event.dataTransfer.files;
    }

    setFiles(event.dataTransfer.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUploading || isGalleryFull) {
      return;
    }

    const files = Array.from(inputRef.current?.files ?? []);
    const selected = purpose === "gallery" ? files : files.slice(0, 1);
    const validationError = validateSelectedImages(
      selected,
      purpose,
      existingGalleryCount,
    );

    if (validationError) {
      setStatus({ error: validationError });
      return;
    }

    setIsUploading(true);
    setStatus({});

    const supabase = createClient();
    const uploadedObjects: Array<{
      bucket: string;
      mimeType: string;
      objectPath: string;
      sizeBytes: number;
    }> = [];

    try {
      for (const file of selected) {
        const prepared = await prepareInvitationImageUpload({
          eventId,
          fileName: file.name,
          mimeType: file.type,
          purpose,
          sizeBytes: file.size,
        });

        if ("error" in prepared) {
          throw new Error(prepared.error);
        }

        const { error } = await supabase.storage
          .from(prepared.bucket)
          .upload(prepared.objectPath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          throw new Error("No pudimos subir la imagen a Storage.");
        }

        uploadedObjects.push({
          bucket: prepared.bucket,
          mimeType: file.type,
          objectPath: prepared.objectPath,
          sizeBytes: file.size,
        });
      }

      const result = await finalizeInvitationImageUpload({
        eventId,
        purpose,
        uploads: uploadedObjects.map(({ mimeType, objectPath, sizeBytes }) => ({
          mimeType,
          objectPath,
          sizeBytes,
        })),
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setStatus({ success: result.success ?? "Imagen cargada." });
      updateSelectedFiles([]);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      router.refresh();
    } catch (error) {
      if (uploadedObjects.length) {
        await supabase.storage
          .from(uploadedObjects[0].bucket)
          .remove(uploadedObjects.map((upload) => upload.objectPath));
      }

      setStatus({
        error:
          error instanceof Error
            ? error.message
            : "No pudimos subir la imagen. Inténtalo nuevamente.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <input name="eventId" type="hidden" value={eventId} />
      <input name="purpose" type="hidden" value={purpose} />
      <input
        accept={allowedImageTypes.join(",")}
        aria-describedby={helpId}
        className="sr-only"
        disabled={isGalleryFull || isUploading}
        id={inputId}
        multiple={purpose === "gallery"}
        name="file"
        ref={inputRef}
        onChange={(event) => {
          setFiles(event.currentTarget.files ?? []);
        }}
        required
        type="file"
      />

      <label
        className={[
          "group grid cursor-pointer justify-items-center gap-3 rounded-[18px] border border-dashed px-4 py-5 text-center transition",
          isDragging
            ? "border-muted-mauve bg-muted-mauve/10"
            : "border-midnight-navy/16 bg-porcelain hover:border-muted-mauve/55 hover:bg-white",
          isGalleryFull || isUploading ? "cursor-not-allowed opacity-65" : "",
        ].join(" ")}
        htmlFor={inputId}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="grid size-11 place-items-center rounded-full bg-white text-muted-mauve shadow-sm transition group-hover:scale-[1.03]">
          <UploadCloud aria-hidden="true" className="size-5" />
        </span>
        <span className="grid gap-1">
          <span className="text-sm font-semibold text-midnight-navy">
            {isGalleryFull ? "Galeria completa" : dropzoneTitle}
          </span>
          <span className="text-xs leading-5 text-midnight-navy/55">
            {isGalleryFull
              ? `Ya tienes ${maxGalleryImages} fotos en el borrador.`
              : "Arrastra una imagen aquí o elige una de tu dispositivo."}
          </span>
        </span>
        <span className="inline-flex min-h-9 items-center rounded-full border border-muted-mauve/20 bg-white px-4 text-xs font-semibold text-muted-mauve">
          Elegir archivo{purpose === "gallery" ? "s" : ""}
        </span>
      </label>

      <p id={helpId} className="text-xs leading-5 text-midnight-navy/55">
        {allowedImageExtensionsLabel}. Máximo {maxImageSizeLabel} por imagen.
        {purpose === "gallery"
          ? ` Galeria: ${existingGalleryCount}/${maxGalleryImages}.`
          : ""}
      </p>

      {previews.length ? (
        <div className="grid gap-2 rounded-[18px] border border-midnight-navy/10 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-midnight-navy/45">
              Seleccion
            </p>
            <button
              className="inline-flex size-8 items-center justify-center rounded-full text-midnight-navy/55 transition hover:bg-midnight-navy/5"
              onClick={clearSelection}
              type="button"
            >
              <span className="sr-only">Quitar selección</span>
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="grid gap-2">
            {previews.map((preview) => (
              <div
                className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3"
                key={`${preview.name}-${preview.size}`}
              >
                <img
                  alt=""
                  className="size-14 rounded-xl object-cover"
                  src={preview.url}
                />
                <p className="min-w-0 text-xs font-semibold leading-5 text-midnight-navy/65">
                  <span className="block truncate text-midnight-navy">
                    {preview.name}
                  </span>
                  {formatFileSize(preview.size)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-4 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-not-allowed disabled:bg-muted-mauve/45"
        disabled={isUploading || isGalleryFull || selectedCount === 0}
        type="submit"
      >
        {isUploading ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Subiendo...
          </>
        ) : (
          <>
            <ImagePlus aria-hidden="true" className="size-4" />
            {buttonLabel}
          </>
        )}
      </button>

      <p
        aria-live="polite"
        className={[
          "min-h-5 text-sm font-semibold",
          status.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {status.error ?? status.success ?? ""}
      </p>
    </form>
  );
}

function HeroCropForm({
  cropZoom,
  eventId,
  focalX,
  focalY,
  imageUrl,
  isBusy,
  mediaId,
  onDelete,
}: {
  cropZoom: number;
  eventId: string;
  focalX: number;
  focalY: number;
  imageUrl: string;
  isBusy: boolean;
  mediaId?: string;
  onDelete: (mediaId: string) => void;
}) {
  const [state, formAction] = useActionState(
    updateHeroImageFocalPoint,
    initialImageState,
  );
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(clampZoom(cropZoom));
  const [focalPoint, setFocalPoint] = useState({
    x: focalX,
    y: focalY,
  });
  const initialCroppedArea = useMemo(
    () => getInitialHeroCrop(focalX, focalY, cropZoom),
    [cropZoom, focalX, focalY],
  );
  const cropperStyle = useMemo(
    () => ({
      containerStyle: {
        backgroundColor: "#102A43",
      },
      cropAreaStyle: {
        border: "1px solid rgba(248, 246, 242, 0.95)",
        boxShadow: "0 0 0 9999px rgba(16, 42, 67, 0.42)",
      },
    }),
    [],
  );
  const hasChanges =
    Number(zoom.toFixed(2)) !== Number(clampZoom(cropZoom).toFixed(2)) ||
    Math.round(focalPoint.x) !== Math.round(focalX) ||
    Math.round(focalPoint.y) !== Math.round(focalY);

  const updateCrop = useCallback((nextCrop: { x: number; y: number }) => {
    if (!Number.isFinite(nextCrop.x) || !Number.isFinite(nextCrop.y)) {
      return;
    }

    setCrop((current) =>
      current.x === nextCrop.x && current.y === nextCrop.y
        ? current
        : nextCrop,
    );
  }, []);

  const updateZoom = useCallback((nextZoom: number) => {
    if (!Number.isFinite(nextZoom)) {
      return;
    }

    setZoom((current) => (current === nextZoom ? current : nextZoom));
  }, []);

  const updateFocalPoint = useCallback((croppedArea: Area) => {
    const nextX = croppedArea.x + croppedArea.width / 2;
    const nextY = croppedArea.y + croppedArea.height / 2;

    if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
      return;
    }

    setFocalPoint((current) => {
      const next = {
        x: clampPercentage(nextX),
        y: clampPercentage(nextY),
      };

      return Math.round(current.x) === Math.round(next.x) &&
        Math.round(current.y) === Math.round(next.y)
        ? current
        : next;
    });
  }, []);

  function resetFocalPoint() {
    setCrop({ x: 0, y: 0 });
    setZoom(clampZoom(cropZoom));
    setFocalPoint({
      x: focalX,
      y: focalY,
    });
  }

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-[18px] border border-midnight-navy/10 bg-white p-3 shadow-sm"
    >
      <input name="eventId" type="hidden" value={eventId} />
      <input name="cropZoom" type="hidden" value={Number(zoom.toFixed(2))} />
      <input name="focalX" type="hidden" value={Math.round(focalPoint.x)} />
      <input name="focalY" type="hidden" value={Math.round(focalPoint.y)} />

      <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-midnight-navy sm:aspect-[16/9]">
        <Cropper
          aspect={16 / 9}
          crop={crop}
          cropShape="rect"
          image={imageUrl}
          initialCroppedAreaPercentages={initialCroppedArea}
          onCropChange={updateCrop}
          onCropComplete={updateFocalPoint}
          onZoomChange={updateZoom}
          restrictPosition
          showGrid={false}
          zoom={zoom}
          style={cropperStyle}
        />
      </div>

      <div className="grid gap-4 px-1 pb-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid gap-3">
          <div>
            <h4 className="text-sm font-semibold text-midnight-navy">
              Encuadra la portada
            </h4>
            <p className="mt-1 text-xs leading-5 text-midnight-navy/55">
              Arrastra la foto y ajusta el zoom hasta que el recorte se vea bien.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
            <span className="flex items-center justify-between">
              Zoom
              <span className="text-xs text-midnight-navy/45">
                {zoom.toFixed(1)}x
              </span>
            </span>
            <input
              aria-label="Zoom de la portada"
              className="h-2 accent-muted-mauve"
              max={3}
              min={1}
              onChange={(event) => updateZoom(Number(event.target.value))}
              step={0.05}
              type="range"
              value={zoom}
            />
          </label>
        </div>
        <div className="grid gap-2 sm:min-w-48">
          <ImageSubmitButton disabled={!hasChanges} label="Guardar encuadre" />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-midnight-navy/10 px-4 text-sm font-semibold text-midnight-navy/62 transition hover:bg-midnight-navy/5 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!hasChanges}
            onClick={resetFocalPoint}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Reiniciar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-midnight-navy/8 px-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          aria-live="polite"
          className={[
            "min-h-5 text-sm font-semibold",
            state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
          ].join(" ")}
        >
          {state.error ?? state.success ?? ""}
        </p>
        {mediaId ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5 sm:w-fit"
            disabled={isBusy}
            onClick={() => onDelete(mediaId)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Quitar portada
          </button>
        ) : null}
      </div>
    </form>
  );
}

function GalleryImageTile({
  eventId,
  image,
  index,
  isFirst,
  isLast,
  isBusy,
  onDelete,
  onMove,
}: {
  eventId: string;
  image: GalleryItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isBusy: boolean;
  onDelete: (mediaId: string) => void;
  onMove: (mediaId: string, direction: "down" | "up") => void;
}) {
  const [state, formAction] = useActionState(
    updateGalleryImageMeta,
    initialImageState,
  );

  return (
    <article className="overflow-hidden rounded-[18px] border border-midnight-navy/10 bg-white shadow-sm">
      <div className="relative bg-porcelain">
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
        <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-midnight-navy shadow-sm">
          {index + 1}
        </span>
        <div className="absolute right-2 top-2 flex gap-1 rounded-full bg-white/92 p-1 shadow-sm">
          <IconButton
            disabled={isBusy || isFirst || !image.id}
            label="Subir foto en el orden"
            onClick={() => image.id && onMove(image.id, "up")}
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton
            disabled={isBusy || isLast || !image.id}
            label="Bajar foto en el orden"
            onClick={() => image.id && onMove(image.id, "down")}
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </IconButton>
          <IconButton
            danger
            disabled={isBusy || !image.id}
            label="Eliminar foto del borrador"
            onClick={() => image.id && onDelete(image.id)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </IconButton>
        </div>
      </div>
      <form action={formAction} className="grid gap-3 p-3">
        <input name="eventId" type="hidden" value={eventId} />
        <input name="mediaId" type="hidden" value={image.id} />
        <label className="grid gap-1 text-xs font-semibold text-midnight-navy">
          Descripcion opcional
          <input
            className="min-h-10 rounded-2xl border border-midnight-navy/12 bg-white px-3 text-sm font-medium text-midnight-navy outline-none transition focus:border-muted-mauve"
            defaultValue={image.alt ?? ""}
            maxLength={120}
            name="alt"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ImageSubmitButton label="Guardar texto" />
          <p
            aria-live="polite"
            className={[
              "min-h-5 text-xs font-semibold",
              state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
            ].join(" ")}
          >
            {state.error ?? state.success ?? ""}
          </p>
        </div>
      </form>
    </article>
  );
}

function IconButton({
  children,
  danger = false,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={[
        "inline-flex size-9 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35",
        danger
          ? "text-[#8A3A3A] hover:bg-[#8A3A3A]/10"
          : "text-midnight-navy/65 hover:bg-midnight-navy/10",
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ImageSubmitButton({
  disabled = false,
  label,
}: {
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-muted-mauve/25 px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-not-allowed disabled:opacity-45"
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-muted-mauve/30 border-t-muted-mauve"
          />
          Guardando...
        </>
      ) : (
        label
      )}
    </button>
  );
}

function EmptyPhotoState({ text }: { text: string }) {
  return (
    <div className="grid justify-items-center gap-2 rounded-[18px] border border-dashed border-midnight-navy/16 bg-porcelain px-4 py-6 text-center">
      <CheckCircle2 aria-hidden="true" className="size-5 text-midnight-navy/28" />
      <p className="text-sm font-semibold text-midnight-navy/55">{text}</p>
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

function validateSelectedImages(
  files: File[],
  purpose: UploadPurpose,
  existingGalleryCount: number,
) {
  if (!files.length) {
    return "Selecciona una imagen.";
  }

  if (files.some((file) => !allowedImageTypes.includes(file.type))) {
    return "Usa solo imágenes JPG, PNG o WebP. HEIC aún no está admitido.";
  }

  if (files.some((file) => file.size <= 0 || file.size > maxImageSizeBytes)) {
    return "Cada imagen debe pesar 5 MB o menos.";
  }

  if (
    purpose === "gallery" &&
    existingGalleryCount + files.length > maxGalleryImages
  ) {
    return `La galería admite hasta ${maxGalleryImages} fotos. Puedes agregar ${Math.max(
      0,
      maxGalleryImages - existingGalleryCount,
    )}.`;
  }

  return null;
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

function clampZoom(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(3, value));
}

function getInitialHeroCrop(
  focalX: number,
  focalY: number,
  cropZoom: number,
): Area {
  const visibleArea = 100 / clampZoom(cropZoom);
  const width = visibleArea;
  const height = visibleArea;

  return {
    height,
    width,
    x: clampPercentage(focalX - width / 2),
    y: clampPercentage(focalY - height / 2),
  };
}
