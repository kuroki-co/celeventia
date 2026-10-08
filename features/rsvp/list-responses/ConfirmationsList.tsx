"use client";

import { useMemo, useState } from "react";

import {
  getRecipientStatusClassName,
  getRecipientStatusLabel,
} from "@/features/guests/list-recipients/status";
import type { RecipientVisualStatus } from "@/features/guests/list-recipients/types";

type RsvpResponseItem = {
  attendeeCount: number;
  attendeeNames: string[];
  displayName: string;
  id: string;
  maxGuests: number;
  respondedAt: string | null;
  response: "confirmed" | "declined" | null;
  shareStatus: RecipientVisualStatus;
};

type ConfirmationsListProps = {
  responses: RsvpResponseItem[];
};

type FilterValue = "all" | "confirmed" | "declined" | "pending";

export function ConfirmationsList({ responses }: ConfirmationsListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const filteredResponses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return responses.filter((response) => {
      const responseStatus = response.response ?? "pending";
      const matchesFilter = filter === "all" || responseStatus === filter;
      const matchesQuery =
        !normalizedQuery ||
        response.displayName.toLowerCase().includes(normalizedQuery) ||
        response.attendeeNames.some((name) =>
          name.toLowerCase().includes(normalizedQuery),
        );

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, responses]);

  if (!responses.length) {
    return (
      <EmptyState
        title="Aun no hay invitados."
        description="Agrega invitados para preparar enlaces y recibir confirmaciones."
      />
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
            placeholder="Invitado o asistente"
            value={query}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
          Respuesta
          <select
            className="min-h-11 appearance-none rounded-2xl border border-midnight-navy/12 bg-white bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%238E6C88%22%20stroke-width=%222.2%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_1rem_center] bg-no-repeat px-4 pr-11 text-sm font-medium text-midnight-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition hover:border-midnight-navy/22 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/10"
            onChange={(event) => setFilter(event.target.value as FilterValue)}
            value={filter}
          >
            <option value="all">Todas</option>
            <option value="confirmed">Confirmados</option>
            <option value="declined">No asistirán</option>
            <option value="pending">Pendientes</option>
          </select>
        </label>
      </div>

      {filteredResponses.length ? (
        filteredResponses.map((response) => (
          <article
            className="rounded-[18px] border border-midnight-navy/10 bg-white px-4 py-4"
            key={response.id}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-midnight-navy">
                  {response.displayName}
                </h2>
                <p className="mt-1 text-sm text-midnight-navy/58">
                  {getResponseLabel(response)}
                </p>
              </div>
              <span
                className={[
                  "text-xs font-semibold uppercase",
                  getRecipientStatusClassName(response.shareStatus),
                ].join(" ")}
              >
                {getRecipientStatusLabel(response.shareStatus)}
              </span>
            </div>
            {response.attendeeNames.length ? (
              <p className="mt-3 text-sm leading-6 text-midnight-navy/65">
                {response.attendeeNames.join(", ")}
              </p>
            ) : null}
          </article>
        ))
      ) : (
        <EmptyState
          action={() => {
            setFilter("all");
            setQuery("");
          }}
          description="Prueba otro nombre o limpia los filtros para ver todo."
          title="No hay coincidencias."
        />
      )}
    </div>
  );
}

function EmptyState({
  action,
  description,
  title,
}: {
  action?: () => void;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-[18px] border border-midnight-navy/10 bg-white p-5">
      <p className="text-sm font-semibold text-midnight-navy">{title}</p>
      <p className="mt-1 text-sm leading-6 text-midnight-navy/62">
        {description}
      </p>
      {action ? (
        <button
          className="mt-3 text-sm font-semibold text-muted-mauve underline underline-offset-4"
          onClick={action}
          type="button"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}

function getResponseLabel(response: RsvpResponseItem) {
  if (response.response === "confirmed") {
    return `${response.attendeeCount} ${
      response.attendeeCount === 1 ? "asistente" : "asistentes"
    } de ${response.maxGuests} pases`;
  }

  if (response.response === "declined") {
    return "No asistirá";
  }

  return "Pendiente de respuesta";
}
