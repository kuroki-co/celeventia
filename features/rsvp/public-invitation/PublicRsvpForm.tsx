"use client";

import { useActionState, useMemo, useState } from "react";

import { submitRsvp, type SubmitRsvpState } from "../submit-rsvp/action";
import type { PublicInvitationData } from "./types";

type PublicRsvpFormProps = {
  data: PublicInvitationData & {
    recipient: NonNullable<PublicInvitationData["recipient"]>;
    rsvp: NonNullable<PublicInvitationData["rsvp"]>;
  };
  slug: string;
  token: string;
};

type RsvpResponse = "confirmed" | "declined";
type ViewMode = "form" | "summary";

const initialState: SubmitRsvpState = {};

export function PublicRsvpForm({ data, slug, token }: PublicRsvpFormProps) {
  const maxGuests = Math.max(1, data.recipient.maxGuests);
  const hasStoredResponse = data.rsvp.response !== null;
  const isClosed = Boolean(data.rsvp.isClosed);
  const [viewMode, setViewMode] = useState<ViewMode>(
    hasStoredResponse ? "summary" : "form",
  );
  const [state, formAction, isPending] = useActionState(
    async (_prevState: SubmitRsvpState, formData: FormData) => {
      const nextState = await submitRsvp(_prevState, formData);

      if (nextState.success) {
        setViewMode("summary");
      }

      return nextState;
    },
    initialState,
  );
  const [response, setResponse] = useState<RsvpResponse>(
    data.rsvp.response ?? "confirmed",
  );
  const [attendeeCount, setAttendeeCount] = useState(
    clampCount(data.rsvp.attendeeCount || 1, maxGuests),
  );
  const [attendeeNames, setAttendeeNames] = useState(() =>
    Array.from(
      { length: maxGuests },
      (_, index) => data.rsvp.attendeeNames[index] ?? "",
    ),
  );
  const attendeeIndexes = useMemo(
    () => Array.from({ length: attendeeCount }, (_, index) => index),
    [attendeeCount],
  );

  function selectResponse(nextResponse: RsvpResponse) {
    setResponse(nextResponse);

    if (nextResponse === "confirmed") {
      setAttendeeCount((current) => clampCount(current || 1, maxGuests));
    }
  }

  function updateAttendeeName(index: number, value: string) {
    setAttendeeNames((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  if (viewMode === "summary") {
    return (
      <RsvpSummary
        attendeeCount={attendeeCount}
        canModify={!isClosed}
        isClosed={isClosed}
        onModify={() => setViewMode("form")}
        response={response}
      />
    );
  }

  if (isClosed) {
    return (
      <div
        aria-live="polite"
        className="mx-auto mt-7 max-w-xl text-center"
        role="status"
      >
        <p className="font-serif text-2xl font-normal text-[color:var(--inv-primary)]">
          El período de confirmación ha finalizado.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--inv-muted)]">
          Gracias por acompañarnos en esta celebración.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto mt-7 max-w-2xl">
      <input name="slug" type="hidden" value={slug} />
      <input name="token" type="hidden" value={token} />
      <input name="response" type="hidden" value={response} />

      {data.rsvp.deadlineLabel ? (
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--inv-muted)]">
          Confirma hasta el {data.rsvp.deadlineLabel}
        </p>
      ) : null}
      <p className="mb-5 text-center text-sm font-semibold text-[color:var(--inv-text)]">
        Esta invitación incluye {maxGuests}{" "}
        {maxGuests === 1 ? "pase" : "pases"}.
      </p>

      <fieldset>
        <legend className="sr-only">¿Podrán acompañarnos?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <RsvpChoiceButton
            isSelected={response === "confirmed"}
            label="Sí, asistiremos"
            onClick={() => selectResponse("confirmed")}
          />
          <RsvpChoiceButton
            isSelected={response === "declined"}
            label="No podremos asistir"
            onClick={() => selectResponse("declined")}
          />
        </div>
      </fieldset>

      {response === "confirmed" ? (
        <div className="mx-auto mt-7 max-w-xl text-center">
          {maxGuests > 1 ? (
            <label className="mx-auto block max-w-xs">
              <span className="block font-serif text-xl font-normal text-[color:var(--inv-primary)]">
                ¿Cuántas personas asistirán?
              </span>
              <select
                className="mt-3 min-h-12 w-full border border-[color:var(--inv-border)] bg-transparent px-4 text-center text-sm font-semibold text-[color:var(--inv-text)] outline-none transition-colors focus:border-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                name="attendeeCount"
                onChange={(event) =>
                  setAttendeeCount(Number(event.target.value))
                }
                value={attendeeCount}
              >
                {Array.from({ length: maxGuests }, (_, index) => index + 1).map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </label>
          ) : (
            <input name="attendeeCount" type="hidden" value={attendeeCount} />
          )}

          <div className="mt-6 grid gap-3 text-left">
            <p className="text-center font-serif text-xl font-normal text-[color:var(--inv-primary)]">
              Nombres de los asistentes
            </p>
            <p className="text-center text-sm leading-6 text-[color:var(--inv-muted)]">
              Puedes escribirlos ahora o completar solo los que tengas claros.
            </p>
            {attendeeIndexes.map((index) => (
              <label className="block" key={index}>
                <span className="mb-2 block text-sm font-semibold text-[color:var(--inv-text)]">
                  Asistente {index + 1}
                </span>
                <input
                  className="min-h-12 w-full border border-[color:var(--inv-border)] bg-transparent px-4 text-sm text-[color:var(--inv-text)] outline-none transition-colors placeholder:text-[color:var(--inv-muted)] focus:border-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
                  name="attendeeNames"
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
          <input name="attendeeCount" type="hidden" value={0} />
          <p className="font-serif text-xl font-normal text-[color:var(--inv-primary)]">
            Lamentamos que no puedan acompañarnos.
          </p>
        </div>
      )}

      <div className="mx-auto mt-7 flex max-w-xl flex-col items-center gap-4">
        {state.error ? (
          <p
            aria-live="assertive"
            className="text-center text-sm font-medium text-[#8A3A3A]"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        <SubmitButton isPending={isPending} response={response} />
      </div>
    </form>
  );
}

function RsvpChoiceButton({
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

function RsvpSummary({
  attendeeCount,
  canModify,
  isClosed,
  onModify,
  response,
}: {
  attendeeCount: number;
  canModify: boolean;
  isClosed: boolean;
  onModify: () => void;
  response: RsvpResponse;
}) {
  const isConfirmed = response === "confirmed";

  return (
    <div
      aria-live="polite"
      className="mx-auto mt-7 max-w-xl text-center"
      role="status"
    >
      <p className="font-serif text-2xl font-normal text-[color:var(--inv-primary)]">
        <span aria-hidden="true" className="text-[color:var(--inv-secondary)]">
          ✓{" "}
        </span>
        {isConfirmed ? "Asistencia confirmada" : "Respuesta registrada"}
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--inv-muted)]">
        {isConfirmed
          ? "Nos alegra saber que podrán acompañarnos."
          : "Gracias por confirmar."}
      </p>
      {isConfirmed ? (
        <p className="mt-3 text-sm font-semibold text-[color:var(--inv-text)]">
          {attendeeCount}{" "}
          {attendeeCount === 1
            ? "asistente confirmado"
            : "asistentes confirmados"}
        </p>
      ) : null}
      {isClosed ? (
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--inv-muted)]">
          El período de confirmación ha finalizado.
        </p>
      ) : null}
      {canModify ? (
        <button
          className="mt-6 inline-flex min-h-11 items-center justify-center border border-[color:var(--inv-border)] bg-transparent px-5 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:border-[color:var(--inv-secondary)] hover:text-[color:var(--inv-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)]"
          onClick={onModify}
          type="button"
        >
          Modificar respuesta
        </button>
      ) : null}
    </div>
  );
}

function SubmitButton({
  isPending,
  response,
}: {
  isPending: boolean;
  response: RsvpResponse;
}) {
  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center border border-[color:var(--inv-secondary)] bg-[color:var(--inv-secondary)]/10 px-6 text-sm font-semibold text-[color:var(--inv-primary)] transition-colors hover:bg-[color:var(--inv-secondary)]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--inv-secondary)] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
      disabled={isPending}
      type="submit"
    >
      {isPending
        ? "Confirmando..."
        : response === "confirmed"
          ? "Confirmar asistencia"
          : "Confirmar respuesta"}
    </button>
  );
}

function clampCount(value: number, max: number) {
  return Math.max(1, Math.min(value, max));
}
