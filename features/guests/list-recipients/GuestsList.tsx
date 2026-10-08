"use client";

import { useMemo, useState } from "react";

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
            className="min-h-11 rounded-2xl border border-midnight-navy/12 bg-white px-4 text-sm font-medium text-midnight-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition placeholder:text-midnight-navy/38 hover:border-midnight-navy/22 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre o teléfono"
            value={query}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Estado
          <select
            className="min-h-11 appearance-none rounded-2xl border border-midnight-navy/12 bg-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%238E6C88%22%20stroke-width=%222.2%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_1rem_center] bg-no-repeat px-4 pr-11 text-sm font-medium text-midnight-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition hover:border-midnight-navy/22 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/10"
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
          <div className="mt-4">
            <UpdateRecipientForm recipient={recipient} />
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
