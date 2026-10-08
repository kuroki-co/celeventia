"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type RsvpResponse = "confirmed" | "declined";
type ViewMode = "form" | "summary";

type InvitationRsvpPreviewProps = {
  displayName?: string;
  maxGuests?: number;
};

export function InvitationRsvpPreview({
  displayName = "Invitado de prueba",
  maxGuests = 2,
}: InvitationRsvpPreviewProps) {
  const guestLimit = Math.max(1, Math.min(maxGuests, 20));
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [response, setResponse] = useState<RsvpResponse>("confirmed");
  const [attendeeCount, setAttendeeCount] = useState(guestLimit);
  const [attendeeNames, setAttendeeNames] = useState(() =>
    Array.from({ length: guestLimit }, () => ""),
  );
  const [simulateError, setSimulateError] = useState(false);
  const [status, setStatus] = useState<{ error?: string; success?: string }>({});
  const [isPending, setIsPending] = useState(false);
  const attendeeIndexes = useMemo(
    () => Array.from({ length: attendeeCount }, (_, index) => index),
    [attendeeCount],
  );

  function selectResponse(nextResponse: RsvpResponse) {
    setResponse(nextResponse);
    setStatus({});

    if (nextResponse === "confirmed") {
      setAttendeeCount((current) => Math.max(1, current));
    }
  }

  function updateAttendeeName(index: number, value: string) {
    setAttendeeNames((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    setStatus({});
  }

  async function submitPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setIsPending(true);
    setStatus({});

    await new Promise((resolve) => window.setTimeout(resolve, 350));

    if (simulateError) {
      setIsPending(false);
      setStatus({
        error: "Simulacion de error: revisa el mensaje sin guardar datos.",
      });
      return;
    }

    setIsPending(false);
    setStatus({ success: "Simulacion completada. No se guardo ninguna respuesta." });
    setViewMode("summary");
  }

  if (viewMode === "summary") {
    const isConfirmed = response === "confirmed";

    return (
      <div
        aria-live="polite"
        className="mx-auto mt-7 max-w-xl border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-primary)]/[0.04] p-5 text-center"
        role="status"
      >
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--inv-muted)]">
          Simulacion: no se guardara ninguna respuesta
        </p>
        <p className="font-serif text-2xl font-normal text-[color:var(--inv-primary)]">
          <span aria-hidden="true" className="text-[color:var(--inv-secondary)]">
            ✓{" "}
          </span>
          {isConfirmed ? "Asistencia confirmada" : "Respuesta registrada"}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--inv-muted)]">
          {isConfirmed
            ? `${attendeeCount} ${attendeeCount === 1 ? "asistente" : "asistentes"} en esta prueba.`
            : "Respuesta negativa simulada."}
        </p>
        {status.success ? (
          <p className="mt-4 text-sm font-semibold text-[color:var(--inv-text)]">
            {status.success}
          </p>
        ) : null}
        <button
          className="mt-6 inline-flex min-h-11 items-center justify-center border border-[color:var(--inv-border)] bg-transparent px-5 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:border-[color:var(--inv-secondary)] hover:text-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
          onClick={() => {
            setStatus({});
            setViewMode("form");
          }}
          type="button"
        >
          Modificar respuesta
        </button>
      </div>
    );
  }

  return (
    <form
      className="mx-auto mt-7 max-w-2xl border border-[color:var(--inv-border)]/70 bg-[color:var(--inv-primary)]/[0.04] p-4 sm:p-5"
      onSubmit={submitPreview}
    >
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--inv-muted)]">
        Simulacion: no se guardara ninguna respuesta
      </p>
      <p className="mb-5 text-center text-sm font-semibold text-[color:var(--inv-text)]">
        {displayName} - {guestLimit} {guestLimit === 1 ? "pase" : "pases"}
      </p>

      <fieldset>
        <legend className="sr-only">Respuesta de asistencia simulada</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewChoiceButton
            isSelected={response === "confirmed"}
            label="Si, asistiremos"
            onClick={() => selectResponse("confirmed")}
          />
          <PreviewChoiceButton
            isSelected={response === "declined"}
            label="No podremos asistir"
            onClick={() => selectResponse("declined")}
          />
        </div>
      </fieldset>

      {response === "confirmed" ? (
        <div className="mx-auto mt-7 max-w-xl text-center">
          {guestLimit > 1 ? (
            <label className="mx-auto block max-w-xs">
              <span className="block font-serif text-xl font-normal text-[color:var(--inv-primary)]">
                Cuantas personas asistiran?
              </span>
              <select
                className="mt-3 min-h-12 w-full appearance-none border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/82 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%238E6C88%22%20stroke-width=%222.2%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[position:right_1rem_center] bg-no-repeat px-4 pr-11 text-center text-sm font-semibold text-[color:var(--inv-text)] outline-none transition-colors focus:border-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                onChange={(event) => {
                  setAttendeeCount(Number(event.target.value));
                  setStatus({});
                }}
                value={attendeeCount}
              >
                {Array.from({ length: guestLimit }, (_, index) => index + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </label>
          ) : null}

          <div className="mt-6 grid gap-3 text-left">
            <p className="text-center font-serif text-xl font-normal text-[color:var(--inv-primary)]">
              Nombres de los asistentes
            </p>
            <p className="text-center text-sm leading-6 text-[color:var(--inv-muted)]">
              Opcional. Puedes dejar campos vacios en esta prueba.
            </p>
            {attendeeIndexes.map((index) => (
              <label className="block" key={index}>
                <span className="mb-2 block text-sm font-semibold text-[color:var(--inv-text)]">
                  Asistente {index + 1}
                </span>
                <input
                  className="min-h-12 w-full border border-[color:var(--inv-border)] bg-[color:var(--inv-surface)]/82 px-4 text-sm font-medium text-[color:var(--inv-text)] outline-none transition-colors placeholder:text-[color:var(--inv-muted)] focus:border-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                  onChange={(event) =>
                    updateAttendeeName(index, event.target.value)
                  }
                  placeholder={`Nombre ${index + 1}`}
                  value={attendeeNames[index] ?? ""}
                />
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-7 max-w-xl text-center">
          <p className="font-serif text-xl font-normal text-[color:var(--inv-primary)]">
            Respuesta negativa simulada.
          </p>
        </div>
      )}

      <label className="mx-auto mt-6 flex max-w-xl items-center justify-center gap-2 text-sm font-semibold text-[color:var(--inv-muted)]">
        <input
          checked={simulateError}
          className="size-4 accent-[color:var(--inv-secondary)]"
          onChange={(event) => {
            setSimulateError(event.target.checked);
            setStatus({});
          }}
          type="checkbox"
        />
        Simular error al enviar
      </label>

      <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-4">
        {status.error ? (
          <p
            aria-live="assertive"
            className="text-center text-sm font-medium text-[#8A3A3A]"
            role="alert"
          >
            {status.error}
          </p>
        ) : null}
        <button
          className="inline-flex min-h-12 w-full items-center justify-center border border-[color:var(--inv-secondary)] bg-[color:var(--inv-secondary)]/10 px-6 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:bg-[color:var(--inv-secondary)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
          disabled={isPending}
          type="submit"
        >
          {isPending
            ? "Simulando..."
            : response === "confirmed"
              ? "Simular confirmacion"
              : "Simular respuesta"}
        </button>
      </div>
    </form>
  );
}

function PreviewChoiceButton({
  isSelected,
  label,
  onClick,
}: {
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={[
        "inline-flex min-h-12 w-full items-center justify-center gap-2 border px-5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]",
        isSelected
          ? "border-[color:var(--inv-secondary)] bg-[color:var(--inv-secondary)]/10 text-[color:var(--inv-primary)]"
          : "border-[color:var(--inv-border)] bg-transparent text-[color:var(--inv-muted)] hover:border-[color:var(--inv-secondary)] hover:text-[color:var(--inv-primary)]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      {isSelected ? (
        <span aria-hidden="true" className="text-[color:var(--inv-secondary)]">
          ✓
        </span>
      ) : null}
      {label}
    </button>
  );
}
