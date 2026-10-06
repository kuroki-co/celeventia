"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTransition } from "react";

import { deleteRecipient } from "../delete-recipient/action";
import { RecipientShareActions } from "../share-via-whatsapp/RecipientShareActions";
import { UpdateRecipientForm } from "../update-recipient/UpdateRecipientForm";
import {
  getRecipientStatusClassName,
  getRecipientStatusLabel,
  getRecipientStatusMark,
} from "./status";
import type { InvitationRecipient, RecipientVisualStatus } from "./types";

type GuestsListProps = {
  isPublished: boolean;
  recipients: InvitationRecipient[];
};

type FilterValue = "all" | RecipientVisualStatus;

export function GuestsList({ isPublished, recipients }: GuestsListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const filteredRecipients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return recipients.filter((recipient) => {
      const matchesFilter =
        filter === "all" || recipient.shareStatus === filter;
      const matchesQuery =
        !normalizedQuery ||
        recipient.displayName.toLowerCase().includes(normalizedQuery) ||
        (recipient.phone ?? "").toLowerCase().includes(normalizedQuery) ||
        (recipient.normalizedPhone ?? "")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, recipients]);

  if (!recipients.length) {
    return (
      <div className="rounded-[18px] border border-midnight-navy/10 bg-white p-5">
        <p className="text-sm font-semibold text-midnight-navy">
          Aun no hay invitados.
        </p>
        <p className="mt-1 text-sm leading-6 text-midnight-navy/62">
          Agrega tu primer invitado o familia para preparar sus enlaces.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-[18px] border border-midnight-navy/10 bg-white p-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Buscar
          <input
            className="min-h-11 rounded-2xl border border-midnight-navy/10 bg-porcelain px-4 text-sm text-midnight-navy outline-none transition focus:border-muted-mauve"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre o teléfono"
            value={query}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Estado
          <select
            className="min-h-11 rounded-2xl border border-midnight-navy/10 bg-porcelain px-4 text-sm text-midnight-navy outline-none transition focus:border-muted-mauve"
            onChange={(event) => setFilter(event.target.value as FilterValue)}
            value={filter}
          >
            <option value="all">Todos</option>
            <option value="not_shared">Sin compartir</option>
            <option value="shared">WhatsApp abierto</option>
            <option value="opened">Invitacion abierta</option>
            <option value="confirmed">Confirmado</option>
            <option value="declined">No asistirá</option>
          </select>
        </label>
      </div>

      {filteredRecipients.length ? (
        filteredRecipients.map((recipient) => (
          <RecipientCard
            isPublished={isPublished}
            key={recipient.id}
            recipient={recipient}
          />
        ))
      ) : (
        <div className="rounded-[18px] border border-midnight-navy/10 bg-white p-5">
          <p className="text-sm font-semibold text-midnight-navy">
            No encontramos coincidencias.
          </p>
          <button
            className="mt-3 text-sm font-semibold text-muted-mauve underline underline-offset-4"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            type="button"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

function RecipientCard({
  isPublished,
  recipient,
}: {
  isPublished: boolean;
  recipient: InvitationRecipient;
}) {
  return (
    <article className="rounded-[18px] border border-midnight-navy/10 bg-white p-4 transition-colors hover:border-muted-mauve/22">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-midnight-navy">
            {recipient.displayName}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-midnight-navy/62">
            <span>
              {recipient.maxGuests}{" "}
              {recipient.maxGuests === 1 ? "pase" : "pases"}
            </span>
            {recipient.normalizedPhone ? (
              <span>{recipient.normalizedPhone}</span>
            ) : (
              <span>Sin teléfono</span>
            )}
            {recipient.attendeeCount ? (
              <span>
                {recipient.attendeeCount}{" "}
                {recipient.attendeeCount === 1 ? "asistente" : "asistentes"}
              </span>
            ) : null}
          </div>
          <p
            className={[
              "mt-3 flex items-center gap-2 text-sm font-semibold",
              getRecipientStatusClassName(recipient.shareStatus),
            ].join(" ")}
          >
            <span aria-hidden="true">
              {getRecipientStatusMark(recipient.shareStatus)}
            </span>
            {getRecipientStatusLabel(recipient.shareStatus)}
          </p>
          {recipient.attendeeNames.length ? (
            <p className="mt-2 text-sm leading-5 text-midnight-navy/58">
              {recipient.attendeeNames.join(", ")}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <UpdateRecipientForm recipient={recipient} />
            <DeleteRecipientButton recipient={recipient} />
          </div>
        </div>

        <div className="lg:min-w-[360px]">
          <RecipientShareActions
            isInvitationPublished={isPublished}
            recipient={recipient}
          />
        </div>
      </div>
    </article>
  );
}

function DeleteRecipientButton({
  recipient,
}: {
  recipient: InvitationRecipient;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function confirmAndDelete() {
    const rsvpWarning = recipient.response
      ? " También se eliminará su RSVP actual."
      : "";
    const confirmed = window.confirm(
      `¿Eliminar a ${recipient.displayName}? Su enlace dejara de funcionar.${rsvpWarning}`,
    );

    if (!confirmed) {
      return;
    }

    setMessage("Eliminando...");
    startTransition(async () => {
      const result = await deleteRecipient(recipient.id);
      setMessage(result.error ?? result.success ?? "");
    });
  }

  return (
    <div className="grid gap-1">
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5 disabled:cursor-wait disabled:opacity-50"
        disabled={isPending}
        onClick={confirmAndDelete}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
      <p
        aria-live="polite"
        className={[
          "min-h-5 text-xs font-semibold",
          message.startsWith("No ") ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {message}
      </p>
    </div>
  );
}
