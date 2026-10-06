"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { InvitationRecipient } from "../list-recipients/types";
import { updateRecipient, type UpdateRecipientState } from "./action";

const initialState: UpdateRecipientState = {};

export function UpdateRecipientForm({
  recipient,
}: {
  recipient: InvitationRecipient;
}) {
  const [state, formAction] = useActionState(updateRecipient, initialState);
  const values = state.values;

  return (
    <details className="mt-4 rounded-2xl border border-midnight-navy/10 bg-porcelain p-3">
      <summary className="cursor-pointer text-sm font-semibold text-muted-mauve">
        Editar invitado
      </summary>
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="recipientId" type="hidden" value={recipient.id} />
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_120px]">
          <TextField
            defaultValue={values?.displayName ?? recipient.displayName}
            error={state.fieldErrors?.displayName}
            label="Nombre del invitado o familia"
            name="displayName"
            required
          />
          <TextField
            defaultValue={values?.phone ?? recipient.phone ?? ""}
            error={state.fieldErrors?.phone}
            help="Usa un celular peruano de 9 dígitos o un número internacional con +."
            inputMode="tel"
            label="Teléfono (opcional)"
            name="phone"
          />
          <TextField
            defaultValue={values?.maxGuests ?? String(recipient.maxGuests)}
            error={state.fieldErrors?.maxGuests}
            label="Pases"
            max={20}
            min={1}
            name="maxGuests"
            required
            type="number"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={[
              "text-sm font-semibold",
              state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
            ].join(" ")}
          >
            {state.error ?? state.success ?? ""}
          </p>
          <SubmitButton />
        </div>
      </form>
    </details>
  );
}

function TextField({
  defaultValue,
  error,
  help,
  inputMode,
  label,
  max,
  min,
  name,
  required = false,
  type = "text",
}: {
  defaultValue: string;
  error?: string;
  help?: string;
  inputMode?: "tel";
  label: string;
  max?: number;
  min?: number;
  name: "displayName" | "maxGuests" | "phone";
  required?: boolean;
  type?: string;
}) {
  const helpId = `edit-${name}-help`;
  const errorId = `edit-${name}-error`;
  const describedBy = [help ? helpId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="grid gap-2 text-sm font-semibold text-midnight-navy">
      {label}
      <input
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        className={`${inputClassName} aria-invalid:border-[#8A3A3A]`}
        defaultValue={defaultValue}
        inputMode={inputMode}
        key={`${name}-${defaultValue}`}
        max={max}
        min={min}
        name={name}
        required={required}
        type={type}
      />
      {help ? (
        <span className="text-xs leading-5 text-midnight-navy/65" id={helpId}>
          {help}
        </span>
      ) : null}
      <FieldError id={errorId} message={error} />
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="text-xs font-semibold text-[#8A3A3A]" id={id}>
      {message}
    </span>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-muted-mauve/25 px-4 text-sm font-semibold text-muted-mauve transition hover:bg-muted-mauve/5 disabled:cursor-wait disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

const inputClassName =
  "min-h-10 rounded-2xl border border-midnight-navy/10 bg-white px-3 text-sm text-midnight-navy outline-none transition-colors focus:border-muted-mauve";
