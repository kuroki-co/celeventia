"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { useTransition } from "react";
import { useFormStatus } from "react-dom";

import { deleteRecipient } from "../delete-recipient/action";
import type { InvitationRecipient } from "../list-recipients/types";
import { updateRecipient, type UpdateRecipientState } from "./action";

const initialState: UpdateRecipientState = {};

export function UpdateRecipientForm({
  recipient,
}: {
  recipient: InvitationRecipient;
}) {
  const [state, formAction] = useActionState(updateRecipient, initialState);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();
  const values = state.values;

  function confirmAndDelete() {
    const rsvpWarning = recipient.response
      ? " Tambien se eliminara su RSVP actual."
      : "";
    const confirmed = window.confirm(
      `Eliminar a ${recipient.displayName}? Su enlace dejara de funcionar.${rsvpWarning}`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteMessage("Eliminando...");
    startDeleteTransition(async () => {
      const result = await deleteRecipient(recipient.id);
      setDeleteMessage(result.error ?? result.success ?? "");
    });
  }

  return (
    <details className="w-full rounded-2xl border border-midnight-navy/10 bg-white p-3 shadow-[0_8px_24px_rgba(16,42,67,0.035)]">
      <summary className="cursor-pointer text-sm font-semibold text-muted-mauve marker:text-muted-mauve">
        Editar invitado
      </summary>
      <form action={formAction} className="mt-4 grid gap-4">
        <input name="recipientId" type="hidden" value={recipient.id} />
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(220px,1.2fr)_minmax(220px,0.9fr)_120px]">
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
        <div className="flex flex-col gap-3 border-t border-midnight-navy/8 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            aria-live="polite"
            className="min-h-5 text-sm font-semibold"
          >
            {state.error || state.success ? (
              <p className={state.error ? "text-[#8A3A3A]" : "text-[#24523D]"}>
                {state.error ?? state.success}
              </p>
            ) : deleteMessage ? (
              <p
                className={
                  deleteMessage.startsWith("No ")
                    ? "text-[#8A3A3A]"
                    : "text-[#24523D]"
                }
              >
                {deleteMessage}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-[#8A3A3A]/20 px-4 text-sm font-semibold text-[#8A3A3A] transition hover:bg-[#8A3A3A]/5 disabled:cursor-wait disabled:opacity-50"
              disabled={isDeleting}
              onClick={confirmAndDelete}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
            <SubmitButton />
          </div>
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
    <label className="grid content-start gap-2 text-sm font-semibold text-midnight-navy">
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
  "h-11 w-full rounded-2xl border border-midnight-navy/12 bg-white px-4 text-sm font-medium text-midnight-navy shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition placeholder:text-midnight-navy/38 hover:border-midnight-navy/22 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/10";
