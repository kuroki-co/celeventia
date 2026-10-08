"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";

import { updateAlbumUploadStatus } from "@/features/album/moderate-upload/action";

type AlbumUploadItem = {
  caption: string | null;
  createdAt: string;
  id: string;
  status: "approved" | "pending" | "rejected";
  uploaderName: string | null;
  url: string | null;
};

type AlbumUploadsListProps = {
  uploads: AlbumUploadItem[];
};

export function AlbumUploadsList({ uploads }: AlbumUploadsListProps) {
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateStatus(
    uploadId: string,
    status: "approved" | "rejected",
  ) {
    setStatusMessage("");
    startTransition(async () => {
      const result = await updateAlbumUploadStatus({ status, uploadId });

      setStatusMessage(result.error ?? result.success ?? "");
    });
  }

  if (!uploads.length) {
    return (
      <div className="rounded-[18px] border border-midnight-navy/10 bg-white p-5">
        <p className="text-sm font-semibold text-midnight-navy">
          Aun no hay fotos enviadas.
        </p>
        <p className="mt-1 text-sm leading-6 text-midnight-navy/62">
          Cuando publiques el album colaborativo, las fotos recibidas apareceran aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <p
        aria-live="polite"
        className="min-h-5 text-sm font-semibold text-midnight-navy/62"
      >
        {statusMessage}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {uploads.map((upload) => (
          <article
            className="overflow-hidden rounded-[18px] border border-midnight-navy/10 bg-white"
            key={upload.id}
          >
            {upload.url ? (
              <img
                alt=""
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                src={upload.url}
              />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-porcelain text-sm font-semibold text-midnight-navy/45">
                Sin vista previa
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-midnight-navy">
                  {upload.uploaderName || "Invitado"}
                </p>
                <span className="text-xs font-semibold uppercase text-midnight-navy/45">
                  {getStatusLabel(upload.status)}
                </span>
              </div>
              {upload.caption ? (
                <p className="mt-2 text-sm leading-6 text-midnight-navy/62">
                  {upload.caption}
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#24523D]/20 px-3 text-sm font-semibold text-[#24523D] transition hover:bg-[#24523D]/5 disabled:cursor-wait disabled:opacity-45"
                  disabled={isPending || upload.status === "approved"}
                  onClick={() => updateStatus(upload.id, "approved")}
                  type="button"
                >
                  Aprobar
                </button>
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#8A3A3A]/20 px-3 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5 disabled:cursor-wait disabled:opacity-45"
                  disabled={isPending || upload.status === "rejected"}
                  onClick={() => updateStatus(upload.id, "rejected")}
                  type="button"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function getStatusLabel(status: AlbumUploadItem["status"]) {
  if (status === "approved") {
    return "Aprobada";
  }

  if (status === "rejected") {
    return "Rechazada";
  }

  return "Pendiente";
}
