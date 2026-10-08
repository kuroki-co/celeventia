"use client";

/* eslint-disable @next/next/no-img-element */

import { Camera, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import type { WeddingInvitationContent } from "@/invitation/renderer/types";
import { createClient } from "@/shared/supabase/client";

import {
  finalizeAlbumPhotoUpload,
  prepareAlbumPhotoUpload,
} from "./action";

type PublicAlbumUploadFormProps = {
  config: NonNullable<WeddingInvitationContent["collaborativeAlbum"]>;
  slug: string;
};

type SelectedImage = {
  file: File;
  url: string;
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSizeBytes = 5 * 1024 * 1024;

export function PublicAlbumUploadForm({
  config,
  slug,
}: PublicAlbumUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [uploaderName, setUploaderName] = useState("");
  const [caption, setCaption] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [status, setStatus] = useState<{ error?: string; success?: string }>(
    {},
  );
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage.url);
      }
    };
  }, [selectedImage]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setStatus({});

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
    }

    if (!file) {
      setSelectedImage(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedImage(null);
      setStatus({ error: validationError });
      return;
    }

    setSelectedImage({
      file,
      url: URL.createObjectURL(file),
    });
  }

  function clearSelection() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (selectedImage) {
      URL.revokeObjectURL(selectedImage.url);
    }

    setSelectedImage(null);
    setStatus({});
  }

  async function uploadSelectedImage() {
    if (!selectedImage || isUploading) {
      return;
    }

    if (!hasConsent) {
      setStatus({
        error: "Confirma que tienes permiso para compartir esta foto.",
      });
      return;
    }

    if (!uploaderName.trim()) {
      setStatus({ error: "Escribe tu nombre antes de enviar la foto." });
      return;
    }

    setIsUploading(true);
    setStatus({ success: "Preparando foto..." });

    const prepared = await prepareAlbumPhotoUpload({
      fileName: selectedImage.file.name,
      mimeType: selectedImage.file.type,
      sizeBytes: selectedImage.file.size,
      slug,
    });

    if ("error" in prepared) {
      setStatus({ error: prepared.error });
      setIsUploading(false);
      return;
    }

    const supabase = createClient();

    try {
      setStatus({ success: "Subiendo foto..." });

      const { error } = await supabase.storage
        .from(prepared.bucket)
        .upload(prepared.objectPath, selectedImage.file, {
          contentType: selectedImage.file.type,
          upsert: false,
        });

      if (error) {
        throw new Error("No pudimos subir la foto.");
      }

      setStatus({ success: "Guardando..." });

      const result = await finalizeAlbumPhotoUpload({
        caption,
        mimeType: selectedImage.file.type,
        objectPath: prepared.objectPath,
        sizeBytes: selectedImage.file.size,
        slug,
        uploaderName,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      clearSelection();
      setCaption("");
      setHasConsent(false);
      setUploaderName("");
      setStatus({ success: result.success });
    } catch (error) {
      await supabase.storage.from(prepared.bucket).remove([prepared.objectPath]);
      setStatus({
        error:
          error instanceof Error
            ? error.message
            : "No pudimos subir la foto. Intentalo nuevamente.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/72 px-5 py-8 text-center shadow-[0_18px_60px_rgba(16,42,67,0.08)] sm:px-8">
      <div className="mx-auto grid size-12 place-items-center rounded-full border border-[color:var(--inv-border)] text-[color:var(--inv-secondary)]">
        <Camera aria-hidden="true" className="size-5" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase text-[color:var(--inv-secondary)]">
        Album
      </p>
      <h2 className="mt-3 font-serif text-[2.25rem] font-normal leading-tight text-[color:var(--inv-primary)] sm:text-[2.8rem]">
        {config.title || "Comparte tus fotos"}
      </h2>
      {config.description ? (
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--inv-muted)]">
          {config.description}
        </p>
      ) : null}

      <div className="mt-7 grid gap-3 text-left">
        <input
          accept={allowedImageTypes.join(",")}
          className="sr-only"
          disabled={isUploading}
          onChange={chooseFile}
          ref={inputRef}
          type="file"
        />
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[color:var(--inv-border)] px-5 text-sm font-semibold text-[color:var(--inv-primary)] transition hover:border-[color:var(--inv-secondary)] disabled:cursor-wait disabled:opacity-55"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" className="size-4" />
          Elegir foto
        </button>

        {selectedImage ? (
          <div className="grid gap-3 rounded-2xl border border-[color:var(--inv-border)] bg-[color:var(--inv-background)]/56 p-3">
            <img
              alt=""
              className="aspect-[4/3] w-full object-cover"
              src={selectedImage.url}
            />
            <TextField
              label="Tu nombre"
              onChange={setUploaderName}
              value={uploaderName}
            />
            <TextField label="Mensaje" onChange={setCaption} value={caption} />
            <label className="flex gap-3 rounded-2xl border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/55 p-3 text-left text-sm font-semibold leading-6 text-[color:var(--inv-primary)]">
              <input
                checked={hasConsent}
                className="mt-1 size-4 accent-[color:var(--inv-primary)]"
                disabled={isUploading}
                onChange={(event) => setHasConsent(event.target.checked)}
                type="checkbox"
              />
              <span>
                Confirmo que tengo permiso para compartir esta foto y acepto
                que la pareja la revise antes de mostrarla.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[color:var(--inv-primary)] px-5 text-sm font-semibold text-[color:var(--inv-surface)] transition hover:opacity-90 disabled:cursor-wait disabled:opacity-55"
                disabled={isUploading || !hasConsent || !uploaderName.trim()}
                onClick={uploadSelectedImage}
                type="button"
              >
                {isUploading ? "Subiendo..." : "Enviar foto"}
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[color:var(--inv-border)] px-5 text-sm font-semibold text-[color:var(--inv-muted)] disabled:cursor-wait disabled:opacity-55"
                disabled={isUploading}
                onClick={clearSelection}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
                Quitar
              </button>
            </div>
          </div>
        ) : null}

        <p
          aria-live="polite"
          className={[
            "min-h-5 text-center text-sm font-semibold",
            status.error ? "text-[#8A3A3A]" : "text-[color:var(--inv-primary)]",
          ].join(" ")}
        >
          {status.error ?? status.success ?? ""}
        </p>
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--inv-primary)]">
      {label}
      <input
        className="min-h-11 rounded-none border border-[color:var(--inv-border)] bg-[color:var(--inv-background)]/72 px-4 text-sm font-medium text-[color:var(--inv-text)] outline-none transition focus:border-[color:var(--inv-secondary)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function validateFile(file: File) {
  if (!allowedImageTypes.includes(file.type)) {
    return "Usa una imagen JPG, PNG o WebP.";
  }

  if (file.size > maxImageSizeBytes) {
    return "La imagen debe pesar maximo 5 MB.";
  }

  return null;
}
